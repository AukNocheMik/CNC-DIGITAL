import * as THREE from 'three';
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';
import { CuttingOperation, ModelConfig } from '../types';

/**
 * 创建基础几何体
 */
export function createBaseGeometry(config: ModelConfig): THREE.BufferGeometry {
  let geometry: THREE.BufferGeometry;

  switch (config.baseGeometry) {
    case 'cube':
      geometry = new THREE.BoxGeometry(...config.size);
      break;
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(config.size[0] / 2, config.size[0] / 2, config.size[1], 32);
      console.log('Created cylinder geometry, size:', config.size);
      break;
    case 'sphere':
      geometry = new THREE.SphereGeometry(config.size[0] / 2, 32, 32);
      console.log('Created sphere geometry, size:', config.size);
      break;
    default:
      geometry = new THREE.BoxGeometry(...config.size);
  }

  return geometry;
}

/**
 * 根据切削操作创建刀具几何体
 */
export function createCutterGeometry(operation: CuttingOperation): THREE.BufferGeometry {
  switch (operation.type) {
    case 'hole':
      // 创建圆柱体用于钻孔
      // 注意：position格式为 [x, z_in_gcode, y_in_gcode] 需要转换为 [x, y, z]
      const holeGeometry = new THREE.CylinderGeometry(
        operation.toolRadius,
        operation.toolRadius,
        operation.size[1], // 使用指定的高度
        32
      );
      // Cylinder默认沿Y轴，正好是垂直方向，不需要旋转
      holeGeometry.translate(
        operation.position[0], 
        operation.position[1], 
        operation.position[2]
      );
      console.log('Created hole geometry:', { 
        position: operation.position, 
        size: operation.size,
        radius: operation.toolRadius,
        cylinderHeight: operation.size[1]
      });
      return holeGeometry;

    case 'surface':
      // 创建扁平的长方体用于表面切削
      const surfaceGeometry = new THREE.BoxGeometry(
        operation.size[0],
        operation.size[1], // 使用指定的高度
        operation.size[2]
      );
      surfaceGeometry.translate(
        operation.position[0], 
        operation.position[1], 
        operation.position[2]
      );
      console.log('Created surface geometry:', { position: operation.position, size: operation.size });
      return surfaceGeometry;

    case 'contour':
      // 创建轮廓切削几何体 - 使用简化的长方体表示
      const contourGeometry = new THREE.BoxGeometry(
        operation.size[0],
        operation.size[1], // 使用指定的高度
        operation.size[2]
      );
      contourGeometry.translate(
        operation.position[0], 
        operation.position[1], 
        operation.position[2]
      );
      console.log('Created contour geometry:', { position: operation.position, size: operation.size });
      return contourGeometry;

    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

/**
 * 合并多个几何体
 */
function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  // 简化的合并实现
  // 实际项目中可能需要使用BufferGeometryUtils.mergeGeometries
  if (geometries.length === 0) return new THREE.BufferGeometry();
  if (geometries.length === 1) return geometries[0];

  // 这里返回第一个几何体作为简化处理
  // 完整实现需要真正的几何体合并
  return geometries[0];
}

/**
 * 执行CSG减法运算
 */
export function performCSGSubtraction(
  baseGeometry: THREE.BufferGeometry,
  cutterGeometry: THREE.BufferGeometry
): THREE.BufferGeometry {
  try {
    console.log('Performing CSG subtraction...');
    
    // 创建基础模型的Brush
    const baseBrush = new Brush(baseGeometry);
    baseBrush.updateMatrixWorld();
    
    // 创建刀具的Brush
    const cutterBrush = new Brush(cutterGeometry);
    cutterBrush.updateMatrixWorld();
    cutterBrush.material = cutterBrush.material.clone();
    cutterBrush.material.side = THREE.DoubleSide;
    
    // 创建评估器并执行减法
    const evaluator = new Evaluator();
    const result = evaluator.evaluate(baseBrush, cutterBrush, SUBTRACTION);
    
    console.log('CSG subtraction completed successfully');
    return result.geometry;
  } catch (error) {
    console.error('CSG subtraction error:', error);
    // 如果CSG失败，返回原始几何体
    return baseGeometry;
  }
}

/**
 * 应用多个切削操作
 */
export function applyCuttingOperations(
  baseGeometry: THREE.BufferGeometry,
  operations: CuttingOperation[]
): THREE.BufferGeometry {
  if (operations.length === 0) {
    return baseGeometry;
  }
  
  let currentGeometry = baseGeometry;

  for (let i = 0; i < operations.length; i++) {
    try {
      const operation = operations[i];
      const cutterGeometry = createCutterGeometry(operation);
      currentGeometry = performCSGSubtraction(currentGeometry, cutterGeometry);
    } catch (error) {
      console.error('Error applying cutting operation:', error);
    }
  }

  return currentGeometry;
}

/**
 * 从刀路生成切削操作
 */
export function generateCuttingOperationsFromToolpath(
  toolpath: any[],
  toolRadius: number = 2.5
): CuttingOperation[] {
  const operations: CuttingOperation[] = [];
  
  for (const segment of toolpath) {
    if (segment.points.length < 2) continue;

    // 过滤掉快速移动的点，只保留切削移动
    const cuttingPoints = segment.points.filter(p => !p.isRapid);
    if (cuttingPoints.length < 2) continue;

    const firstPoint = cuttingPoints[0];
    const lastPoint = cuttingPoints[cuttingPoints.length - 1];
    
    // 检查Z轴变化
    const minZ = Math.min(...cuttingPoints.map(p => p.z));
    const maxZ = Math.max(...cuttingPoints.map(p => p.z));
    
    // 如果起点和终点在同一位置，且Z轴有显著变化，认为是钻孔
    if (Math.abs(firstPoint.x - lastPoint.x) < 0.1 &&
        Math.abs(firstPoint.y - lastPoint.y) < 0.1) {
      
      if (maxZ - minZ > 1) { // 深度变化超过1mm，认为是钻孔
        operations.push({
          type: 'hole',
          position: [firstPoint.x, 10, firstPoint.y], // Y=10是模型中心，圆柱体足够高会穿透
          size: [toolRadius * 2, 100, toolRadius * 2], // 高度100足够穿透整个模型
          toolRadius,
        });
      }
    } else {
      // 获取所有切削点的边界
      const minX = Math.min(...cuttingPoints.map(p => p.x));
      const maxX = Math.max(...cuttingPoints.map(p => p.x));
      const minY = Math.min(...cuttingPoints.map(p => p.y));
      const maxY = Math.max(...cuttingPoints.map(p => p.y));
      
      const width = maxX - minX;
      const length = maxY - minY;

      // 检查点的分布模式
      const pointsInRow = cuttingPoints.filter(p => Math.abs(p.y - firstPoint.y) < 1);
      
      if (pointsInRow.length > cuttingPoints.length * 0.7) {
        // 大部分点在同一行，认为是表面铣削
        operations.push({
          type: 'surface',
          position: [(minX + maxX) / 2, 10, (minY + maxY) / 2], // Y=10是模型中心
          size: [width, 100, length],
          toolRadius,
        });
      } else if (width > 10 && length > 10) {
        // 大面积，但不是同一行，认为是表面切削（多行）
        operations.push({
          type: 'surface',
          position: [(minX + maxX) / 2, 10, (minY + maxY) / 2], // Y=10是模型中心
          size: [width, 100, length],
          toolRadius,
        });
      } else {
        // 小范围，轮廓切削
        operations.push({
          type: 'contour',
          position: [(minX + maxX) / 2, 10, (minY + maxY) / 2], // Y=10是模型中心
          size: [width, 100, length],
          toolRadius,
        });
      }
    }
  }

  console.log('Generated cutting operations:', operations);
  return operations;
}

/**
 * 验证几何体
 */
export function validateGeometry(geometry: THREE.BufferGeometry): void {
  const position = geometry.attributes.position;
  console.log('Geometry validation:', {
    vertexCount: position.count,
    hasIndex: geometry.index !== null,
    triangleCount: geometry.index ? geometry.index.count / 3 : position.count / 3
  });
}