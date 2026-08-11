import { useRef } from 'react';
import { AppState, ModelConfig } from '../types';

interface ControlPanelProps {
  state: AppState;
  onFileUpload: (file: File) => void;
  onTogglePlayPause: () => void;
  onToggleViewMode: (mode: AppState['viewMode']) => void;
  onToggleToolpathVisibility: () => void;
  onUpdateModelConfig: (config: Partial<ModelConfig>) => void;
  onAnimationProgress: (progress: number) => void;
}

export default function ControlPanel({
  state,
  onFileUpload,
  onTogglePlayPause,
  onToggleViewMode,
  onToggleToolpathVisibility,
  onUpdateModelConfig,
  onAnimationProgress,
}: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleGeometryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateModelConfig({ baseGeometry: e.target.value as ModelConfig['baseGeometry'] });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateModelConfig({
      material: { ...state.modelConfig.material, color: e.target.value },
    });
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#1a1a1a',
      color: '#fff',
      padding: '20px',
      display: 'flex',
      gap: '30px',
      alignItems: 'center',
      flexWrap: 'wrap',
      borderTop: '2px solid #333',
    }}>
      {/* 文件上传 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', color: '#999' }}>G-code文件</label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".gcode,.nc,.ngc,.txt"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4a90d9',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          📁 上传G-code
        </button>
      </div>

      {/* 播放控制 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', color: '#999' }}>动画控制</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={onTogglePlayPause}
            style={{
              padding: '10px 20px',
              backgroundColor: state.isPlaying ? '#e74c3c' : '#27ae60',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {state.isPlaying ? '⏸️ 暂停' : '▶️ 播放'}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={state.animationProgress}
            onChange={(e) => onAnimationProgress(parseFloat(e.target.value))}
            style={{ width: '200px' }}
          />
          <span style={{ fontSize: '14px', minWidth: '40px', textAlign: 'center' }}>
            {Math.round(state.animationProgress)}%
          </span>
        </div>
      </div>

      {/* 视图模式 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', color: '#999' }}>视图模式</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onToggleViewMode('original')}
            style={{
              padding: '8px 16px',
              backgroundColor: state.viewMode === 'original' ? '#3498db' : '#2c3e50',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            原始模型
          </button>
          <button
            onClick={() => onToggleViewMode('cutting-process')}
            style={{
              padding: '8px 16px',
              backgroundColor: state.viewMode === 'cutting-process' ? '#3498db' : '#2c3e50',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            切削过程
          </button>
          <button
            onClick={() => onToggleViewMode('cut')}
            style={{
              padding: '8px 16px',
              backgroundColor: state.viewMode === 'cut' ? '#3498db' : '#2c3e50',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            切削后
          </button>
          <button
            onClick={() => onToggleViewMode('both')}
            style={{
              padding: '8px 16px',
              backgroundColor: state.viewMode === 'both' ? '#3498db' : '#2c3e50',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            对比视图
          </button>
        </div>
      </div>

      {/* 显示选项 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', color: '#999' }}>显示选项</label>
        <button
          onClick={onToggleToolpathVisibility}
          style={{
            padding: '8px 16px',
            backgroundColor: state.showToolpath ? '#27ae60' : '#e74c3c',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {state.showToolpath ? '✓ 显示刀路' : '✗ 隐藏刀路'}
        </button>
      </div>

      {/* 模型设置 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', color: '#999' }}>模型设置</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={state.modelConfig.baseGeometry}
            onChange={handleGeometryChange}
            style={{
              padding: '8px',
              backgroundColor: '#2c3e50',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value="cube">立方体</option>
            <option value="cylinder">圆柱体</option>
            <option value="sphere">球体</option>
          </select>
          <input
            type="color"
            value={state.modelConfig.material.color}
            onChange={handleColorChange}
            style={{
              width: '50px',
              height: '35px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>

      {/* 统计信息 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: 'auto' }}>
        <div style={{ fontSize: '12px', color: '#999' }}>
          刀路段数: {state.toolpaths.length}
        </div>
        <div style={{ fontSize: '12px', color: '#999' }}>
          切削操作: {state.cuttingOperations.length}
        </div>
        <div style={{ fontSize: '12px', color: '#999' }}>
          总点数: {state.toolpaths.reduce((sum, seg) => sum + seg.points.length, 0)}
        </div>
      </div>
    </div>
  );
}