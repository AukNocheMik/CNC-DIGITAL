import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { AppState } from '../types';
import ToolpathVisualizer from './ToolpathVisualizer';

interface ModelViewerProps {
  state: AppState;
  onAnimationProgress: (progress: number) => void;
}

function SceneContent({ state, onAnimationProgress }: ModelViewerProps) {
  const groupRef = useRef<THREE.Group>(null);

  // 动画控制
  useFrame((_, delta) => {
    if (state.isPlaying && state.animationProgress < 100) {
      const newProgress = Math.min(state.animationProgress + delta * 20, 100);
      onAnimationProgress(newProgress);
    }
  });

  return (
    <>
      {/* 相机控制 */}
      <OrbitControls
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
        minDistance={20}
        maxDistance={200}
        target={[50, 0, 50]}
      />

      {/* 灯光 */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[50, 50, 50]}
        intensity={1}
        castShadow
      />
      <pointLight position={[0, 50, 0]} intensity={0.5} />

      {/* 辅助网格 */}
      <Grid
        args={[100, 100]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#666"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#999"
        fadeDistance={150}
        position={[50, -0.01, 50]}
      />

      {/* 坐标轴 */}
      <primitive object={new THREE.AxesHelper(20)} position={[0, 0, 0]} />

      {/* 模型组 */}
      <group ref={groupRef}>
        {/* 计算模型边界 */}
        {(() => {
          const [width, height, depth] = state.modelConfig.size; // [X, Y(厚度), Z]
          const [centerX, centerY, centerZ] = state.modelConfig.position;
          
          // 模型边界（Three.js坐标系，与 BoxGeometry 一致）
          const modelBounds = {
            minX: centerX - width / 2,
            maxX: centerX + width / 2,
            minY: centerY - height / 2,
            maxY: centerY + height / 2,
            minZ: centerZ - depth / 2,
            maxZ: centerZ + depth / 2,
          };

          // 模型边界计算完成

          return (
            <>
              {/* 刀路可视化（已移除模型，仅显示刀路） */}
              {state.showToolpath && state.toolpaths.length > 0 && (
                <ToolpathVisualizer
                  toolpaths={state.toolpaths}
                  animationProgress={state.animationProgress}
                  isPlaying={state.isPlaying}
                  modelTopY={modelBounds.maxY}
                />
              )}
            </>
          );
        })()}
      </group>
    </>
  );
}

export default function ModelViewer({ state, onAnimationProgress }: ModelViewerProps) {
  return (
    <Canvas
      shadows
      camera={{
        position: [100, 80, 150],
        fov: 50,
      }}
      gl={{ antialias: true }}
    >
      <SceneContent state={state} onAnimationProgress={onAnimationProgress} />
    </Canvas>
  );
}