# CNC Toolpath Visualization Demo Project

## Project Overview
- **Type**: React + Three.js 3D visualization application
- **Purpose**: Desktop CNC toolpath visualization demo with cutting effects
- **Features**: 
  - G-code parsing and toolpath visualization
  - Model cutting effects (holes, surface removal) using CSG operations
  - Interactive 3D scene controls
  - Toolpath animation

## Tech Stack
- React 18 with TypeScript
- Three.js for 3D rendering
- @react-three/fiber for React Three.js integration
- @react-three/drei for Three.js helpers
- three-stdlib for additional Three.js utilities
- three-bvh-csg for CSG (Constructive Solid Geometry) operations

## Development Commands
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build for production: `npm run build`
- Type checking: `npx tsc --noEmit`

## Key Components
- `GCodeParser`: Parses G-code files into toolpath data
- `ModelViewer`: Three.js 3D scene component
- `ToolpathVisualizer`: Renders toolpath lines
- `CSGModel`: Handles model cutting operations
- `AnimationController`: Controls toolpath animation
- `ControlPanel`: UI controls for interaction

## File Structure
- `src/components/`: React components
- `src/lib/`: Utility functions and helpers
- `src/types/`: TypeScript type definitions
- `src/data/`: Sample G-code files