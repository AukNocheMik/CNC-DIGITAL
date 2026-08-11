import { useMemo } from 'react';
import * as THREE from 'three';
import { CuttingOperation, ModelConfig } from '../types';
import { createBaseGeometry, applyCuttingOperations, validateGeometry } from '../lib/csgHelper';

interface CSGModelProps {
  config: ModelConfig;
  operations: CuttingOperation[];
  position: [number, number, number];
  opacity?: number;
  showWireframe?: boolean;
}

export default function CSGModel({
  config,
  operations,
  position,
  opacity = 1,
  showWireframe = false,
}: CSGModelProps) {
  // 创建几何体（带缓存）
  const geometry = useMemo(() => {
    try {
      const baseGeometry = createBaseGeometry(config);
      
      if (operations.length > 0) {
        const result = applyCuttingOperations(baseGeometry, operations);
        validateGeometry(result);
        return result;
      }
      
      return baseGeometry;
    } catch (error) {
      console.error('Error creating CSG model:', error);
      return createBaseGeometry(config);
    }
  }, [config, operations]);

  return (
    <mesh geometry={geometry} position={position} castShadow receiveShadow>
      <meshStandardMaterial
        color={config.material.color}
        opacity={opacity}
        transparent={opacity < 1}
        metalness={config.material.metalness}
        roughness={config.material.roughness}
        wireframe={showWireframe}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}