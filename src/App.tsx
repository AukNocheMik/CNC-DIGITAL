import { useState, useEffect } from 'react';
import ModelViewer from './components/ModelViewer';
import ControlPanel from './components/ControlPanel';
import { AppState, ModelConfig } from './types';
import { parseGCode } from './lib/gcodeParser';
import { generateCuttingOperationsFromToolpath } from './lib/csgHelper';

function App() {
  // 应用状态
  const [state, setState] = useState<AppState>({
    toolpaths: [],
    currentToolpath: 0,
    isPlaying: false,
    animationProgress: 0,
    viewMode: 'cutting-process', // 默认显示切削过程视图
    showToolpath: true,
    cuttingOperations: [],
    modelConfig: {
      baseGeometry: 'cube',
      size: [100, 20, 100],
      position: [50, 10, 50], // 改为正Y值，让模型在原点上方
      material: {
        color: '#4a90d9',
        opacity: 0.9,
        metalness: 0.3,
        roughness: 0.7,
      },
    },
  });

  // 初始化：加载示例G代码
  useEffect(() => {
    // 加载示例G-code文件
    fetch('/sample.gcode')
      .then((response) => response.text())
      .then((gcode) => {
        const toolpaths = parseGCode(gcode);
        const cuttingOperations = generateCuttingOperationsFromToolpath(toolpaths);

        setState((prev) => ({
          ...prev,
          toolpaths,
          cuttingOperations,
        }));
      })
      .catch((error) => {
        console.error('Error loading sample G-code:', error);
      });
  }, []);

  // 处理G代码文件上传
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const gcode = e.target?.result as string;
      const toolpaths = parseGCode(gcode);
      const cuttingOperations = generateCuttingOperationsFromToolpath(toolpaths);

      setState((prev) => ({
        ...prev,
        toolpaths,
        currentToolpath: 0,
        animationProgress: 0,
        cuttingOperations,
      }));
    };
    reader.readAsText(file);
  };

  // 切换播放状态
  const togglePlayPause = () => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  // 更新动画进度
  const updateAnimationProgress = (progress: number) => {
    setState((prev) => ({ ...prev, animationProgress: progress }));
  };

  // 切换视图模式
  const toggleViewMode = (mode: AppState['viewMode']) => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  };

  // 切换刀路显示
  const toggleToolpathVisibility = () => {
    setState((prev) => ({ ...prev, showToolpath: !prev.showToolpath }));
  };

  // 更新模型配置
  const updateModelConfig = (config: Partial<ModelConfig>) => {
    setState((prev) => ({
      ...prev,
      modelConfig: { ...prev.modelConfig, ...config },
    }));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 3D场景 */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ModelViewer
          state={state}
          onAnimationProgress={updateAnimationProgress}
        />
      </div>

      {/* 控制面板 */}
      <ControlPanel
        state={state}
        onFileUpload={handleFileUpload}
        onTogglePlayPause={togglePlayPause}
        onToggleViewMode={toggleViewMode}
        onToggleToolpathVisibility={toggleToolpathVisibility}
        onUpdateModelConfig={updateModelConfig}
        onAnimationProgress={updateAnimationProgress}
      />
    </div>
  );
}

export default App;