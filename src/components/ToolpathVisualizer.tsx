import { useMemo } from 'react';
import * as THREE from 'three';
import { ToolpathSegment } from '../types';

interface ToolpathVisualizerProps {
  toolpaths: ToolpathSegment[];
  animationProgress: number;
  isPlaying: boolean;
  modelTopY?: number; // 模型顶面在 Three.js 中的 Y 坐标（G-code Z=0 对应此高度）
}

/**
 * 根据切削深度返回颜色（地形热力图）
 * t: 0 = 表面（浅），1 = 最深
 * 绿色 → 黄色 → 橙色 → 红色
 */
function depthToColor(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  const color = new THREE.Color();
  // HSL: 绿(0.33) → 黄(0.17) → 红(0.0)
  const h = 0.33 * (1 - clamped);
  color.setHSL(h, 1.0, 0.5);
  return [color.r, color.g, color.b];
}

export default function ToolpathVisualizer({
  toolpaths,
  animationProgress,
  isPlaying,
  modelTopY = 0,
}: ToolpathVisualizerProps) {
  // 计算可见点数
  const visiblePoints = useMemo(() => {
    const total = toolpaths.reduce((sum, seg) => sum + seg.points.length, 0);
    return Math.floor((total * animationProgress) / 100);
  }, [toolpaths, animationProgress]);

  // 找到 Z 深度范围（仅切削部分）
  const maxCutDepth = useMemo(() => {
    let minZ = 0;
    toolpaths.forEach(seg => seg.points.forEach(p => {
      if (!p.isRapid && p.z < minZ) minZ = p.z;
    }));
    return Math.max(1, Math.abs(minZ));
  }, [toolpaths]);

  // 构建线段几何体（顶点着色）
  const { geometry, toolPos } = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    let tool: [number, number, number] | null = null;

    // 展平所有点
    const allPoints: ToolpathSegment['points'] = [];
    toolpaths.forEach(seg => allPoints.push(...seg.points));

    const limit = Math.min(visiblePoints, allPoints.length);

    for (let i = 0; i < limit - 1; i++) {
      const p1 = allPoints[i];
      const p2 = allPoints[i + 1];

      // G-code → Three.js: X→X, Z→Y(加偏移), Y→Z
      const y1 = modelTopY + p1.z;
      const y2 = modelTopY + p2.z;

      positions.push(p1.x, y1, p1.y, p2.x, y2, p2.y);

      if (p1.isRapid || p2.isRapid) {
        // 快速移动 — 灰色
        colors.push(0.45, 0.45, 0.45, 0.45, 0.45, 0.45);
      } else {
        // 切削移动 — 按深度着色
        const t1 = Math.min(1, -p1.z / maxCutDepth);
        const t2 = Math.min(1, -p2.z / maxCutDepth);
        const c1 = depthToColor(t1);
        const c2 = depthToColor(t2);
        colors.push(c1[0], c1[1], c1[2], c2[0], c2[1], c2[2]);
      }

      if (i >= limit - 2) {
        tool = [p2.x, y2, p2.y];
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    return { geometry: geo, toolPos: tool };
  }, [toolpaths, visiblePoints, modelTopY, maxCutDepth]);

  return (
    <>
      {/* 刀路线段（顶点着色） */}
      <lineSegments geometry={geometry}>
        <lineBasicMaterial vertexColors />
      </lineSegments>

      {/* 刀具位置指示器 */}
      {isPlaying && toolPos && (
        <group position={toolPos}>
          <mesh>
            <sphereGeometry args={[1.5, 16, 16]} />
            <meshStandardMaterial
              color="#ffff00"
              emissive="#ffaa00"
              emissiveIntensity={1}
            />
          </mesh>
          {/* 光晕 */}
          <mesh>
            <sphereGeometry args={[3, 16, 16]} />
            <meshBasicMaterial color="#ff8800" transparent opacity={0.25} />
          </mesh>
        </group>
      )}
    </>
  );
}