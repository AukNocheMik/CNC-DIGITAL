// G-code相关类型
export interface GCodeCommand {
  type: 'G' | 'M' | 'T' | 'S' | 'F';
  value: number;
  parameters: Record<string, number>;
  line: number;
}

export interface ToolpathPoint {
  x: number;
  y: number;
  z: number;
  isRapid: boolean; // 是否为快速移动
}

export interface ToolpathSegment {
  points: ToolpathPoint[];
  toolNumber: number;
  feedRate: number;
  spindleSpeed: number;
}

// CSG模型类型
export interface CuttingOperation {
  type: 'hole' | 'surface' | 'contour';
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
  toolRadius: number;
}

export interface ModelConfig {
  baseGeometry: 'cube' | 'cylinder' | 'sphere';
  size: [number, number, number];
  position: [number, number, number];
  material: {
    color: string;
    opacity: number;
    metalness: number;
    roughness: number;
  };
}

// 应用状态类型
export interface AppState {
  toolpaths: ToolpathSegment[];
  currentToolpath: number;
  isPlaying: boolean;
  animationProgress: number;
  viewMode: 'original' | 'cut' | 'both' | 'cutting-process';
  showToolpath: boolean;
  cuttingOperations: CuttingOperation[];
  modelConfig: ModelConfig;
}