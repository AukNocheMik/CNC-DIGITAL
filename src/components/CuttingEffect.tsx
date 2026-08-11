import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ToolpathSegment } from '../types';

interface VoxelInstance {
  position: [number, number, number];
  scale: [number, number, number];
}

interface CuttingEffectProps {
  toolpaths: ToolpathSegment[];
  animationProgress: number;
  modelBounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
  voxelSize: number;
}

export default function CuttingEffect({
  toolpaths,
  animationProgress,
  modelBounds,
  voxelSize = 3,
}: CuttingEffectProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { instances } = useMemo(() => {
    const instances: VoxelInstance[] = [];
    const seen = new Set<string>();

    // 展平所有点，按动画进度截取
    const allPoints: ToolpathSegment['points'][0][] = [];
    toolpaths.forEach(seg => allPoints.push(...seg.points));

    const totalPoints = allPoints.length;
    const visiblePoints = Math.floor((totalPoints * animationProgress) / 100);

    // 模型顶面 Y（G-code Z=0 对应此处）
    const modelTopY = modelBounds.maxY;

    for (let i = 0; i < Math.min(visiblePoints, totalPoints) - 1; i++) {
      const start = allPoints[i];
      const end = allPoints[i + 1];

      // 跳过快速移动
      if (start.isRapid || end.isRapid) continue;

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dz = end.z - start.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const steps = Math.max(1, Math.ceil(distance / voxelSize));

      for (let step = 0; step <= steps; step++) {
        const t = step / steps;
        const gX = start.x + dx * t;
        const gY = start.y + dy * t;
        const gZ = start.z + dz * t;

        // G-code → Three.js: X→X, Z→Y(+偏移), Y→Z
        const threeX = gX;
        const threeY = modelTopY + gZ;
        const threeZ = gY;

        // 边界检查
        if (threeX < modelBounds.minX || threeX > modelBounds.maxX) continue;
        if (threeZ < modelBounds.minZ || threeZ > modelBounds.maxZ) continue;
        if (threeY < modelBounds.minY || threeY > modelBounds.maxY) continue;

        // 网格对齐
        const vx = Math.floor(threeX / voxelSize) * voxelSize + voxelSize / 2;
        const vy = modelTopY; // 从表面向下
        const vz = Math.floor(threeZ / voxelSize) * voxelSize + voxelSize / 2;

        // 去重
        const key = `${vx},${vz}`;
        if (seen.has(key)) continue;
        seen.add(key);

        // 切削深度（体素高度）
        const cutDepth = modelTopY - threeY;
        if (cutDepth <= 0) continue;

        instances.push({
          position: [vx, vy - cutDepth / 2, vz],
          scale: [voxelSize, cutDepth, voxelSize],
        });
      }
    }

    return { instances };
  }, [toolpaths, animationProgress, modelBounds, voxelSize]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!meshRef.current || instances.length === 0) return;

    const mesh = meshRef.current;
    mesh.count = instances.length;

    instances.forEach((instance, index) => {
      dummy.position.set(...instance.position);
      dummy.scale.set(...instance.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  if (instances.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 0.6,
        metalness: 0.3,
        roughness: 0.7,
      }), instances.length]}
      castShadow
      receiveShadow
    />
  );
}