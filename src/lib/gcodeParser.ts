import { GCodeCommand, ToolpathSegment } from '../types';

/**
 * 解析G代码文件
 */
export function parseGCode(gcode: string): ToolpathSegment[] {
  const lines = gcode.split('\n');
  const segments: ToolpathSegment[] = [];
  
  let currentSegment: ToolpathSegment | null = null;
  let currentPosition = { x: 0, y: 0, z: 10 }; // 初始Z轴抬起
  let currentTool = 1;
  let currentFeedRate = 1000;
  let currentSpindleSpeed = 0;
  let isRapidMove = false;
  let previousPosition = { ...currentPosition }; // 记录上一个位置

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    // Strip inline comments: everything after ';' or within '( )'
    const semiIdx = line.indexOf(';');
    if (semiIdx >= 0) line = line.substring(0, semiIdx).trim();
    line = line.replace(/\([^)]*\)/g, '').trim();
    if (!line) continue;

    const command = parseLine(line, i);
    if (!command) continue;

    // 处理不同的命令类型
    if (command.type === 'G') {
      switch (command.value) {
        case 0: // 快速移动
        case 1: // 直线插补
          isRapidMove = command.value === 0;
          
          // 保存上一个位置
          previousPosition = { ...currentPosition };
          
          // 更新坐标（只更新有变化的参数）
          if (command.parameters.X !== undefined) currentPosition.x = command.parameters.X;
          if (command.parameters.Y !== undefined) currentPosition.y = command.parameters.Y;
          if (command.parameters.Z !== undefined) currentPosition.z = command.parameters.Z;
          
          // 创建或添加到当前段
          if (!currentSegment || currentSegment.toolNumber !== currentTool) {
            if (currentSegment && currentSegment.points.length > 1) {
              segments.push(currentSegment);
            }
            currentSegment = {
              points: [{ ...previousPosition, isRapid: isRapidMove }],
              toolNumber: currentTool,
              feedRate: currentFeedRate,
              spindleSpeed: currentSpindleSpeed,
            };
          }
          
          // 总是添加当前位置
          currentSegment.points.push({ ...currentPosition, isRapid: isRapidMove });
          break;

        case 2: // 顺时针圆弧
        case 3: // 逆时针圆弧
          // 简化处理：圆弧插补（完整实现需要计算圆弧上的点）
          handleArcMove(currentSegment, currentPosition, command, command.value === 2);
          if (command.parameters.X !== undefined) currentPosition.x = command.parameters.X;
          if (command.parameters.Y !== undefined) currentPosition.y = command.parameters.Y;
          if (command.parameters.Z !== undefined) currentPosition.z = command.parameters.Z;
          break;
      }
    } else if (command.type === 'M') {
      switch (command.value) {
        case 3: // 主轴顺时针旋转
        case 4: // 主轴逆时针旋转
          if (command.parameters.S !== undefined) {
            currentSpindleSpeed = command.parameters.S;
          }
          break;
        case 5: // 主轴停止
          currentSpindleSpeed = 0;
          break;
      }
    } else if (command.type === 'T') {
      // 换刀
      currentTool = command.value;
      if (currentSegment) {
        segments.push(currentSegment);
        currentSegment = null;
      }
    } else if (command.type === 'S') {
      // 设置主轴转速
      currentSpindleSpeed = command.value;
    } else if (command.type === 'F') {
      // 设置进给率
      currentFeedRate = command.value;
    }
  }

  // 添加最后一个段
  if (currentSegment && currentSegment.points.length > 1) {
    segments.push(currentSegment);
  }

  return segments;
}

/**
 * 解析单行G代码
 */
function parseLine(line: string, lineNumber: number): GCodeCommand | null {
  // Match ANY letter followed by a number (including negative & decimal values)
  // This captures G/M/T commands AND X/Y/Z/I/J/R/K parameters
  const regex = /([A-Z])(-?\d+(?:\.\d+)?)/gi;
  const matches = [...line.matchAll(regex)];
  
  if (matches.length === 0) return null;

  const firstMatch = matches[0];
  const type = firstMatch[1].toUpperCase() as GCodeCommand['type'];
  const value = parseFloat(firstMatch[2]);

  const parameters: Record<string, number> = {};
  for (const match of matches) {
    const letter = match[1].toUpperCase();
    const num = parseFloat(match[2]);
    if (!['G', 'M', 'T', 'S', 'F'].includes(letter)) {
      parameters[letter] = num;
    }
  }

  return {
    type,
    value,
    parameters,
    line: lineNumber,
  };
}

/**
 * 处理圆弧移动
 */
function handleArcMove(
  segment: ToolpathSegment | null,
  currentPosition: { x: number; y: number; z: number },
  command: GCodeCommand,
  clockwise: boolean
): void {
  if (!segment) return;

  // 简化实现：将圆弧分解为多个直线段
  const targetX = command.parameters.X ?? currentPosition.x;
  const targetY = command.parameters.Y ?? currentPosition.y;
  const targetZ = command.parameters.Z ?? currentPosition.z;
  const centerX = command.parameters.I ?? currentPosition.x;
  const centerY = command.parameters.J ?? currentPosition.y;
  const radius = command.parameters.R ?? Math.sqrt(
    Math.pow(targetX - centerX, 2) + Math.pow(targetY - centerY, 2)
  );

  // 计算圆弧的起始角度和结束角度
  const startAngle = Math.atan2(currentPosition.y - centerY, currentPosition.x - centerX);
  const endAngle = Math.atan2(targetY - centerY, targetX - centerX);

  // 根据方向确定角度增量
  let angleIncrement = clockwise ? -0.1 : 0.1;
  if (clockwise && endAngle > startAngle) angleIncrement = -0.1;
  if (!clockwise && endAngle < startAngle) angleIncrement = 0.1;

  // 生成圆弧上的点
  let currentAngle = startAngle;
  while (true) {
    currentAngle += angleIncrement;
    
    const x = centerX + radius * Math.cos(currentAngle);
    const y = centerY + radius * Math.sin(currentAngle);
    
    // 检查是否到达终点
    const dx = x - targetX;
    const dy = y - targetY;
    const dz = targetZ - currentPosition.z;
    
    segment.points.push({
      x,
      y,
      z: currentPosition.z + (dz * (1 - Math.sqrt(dx*dx + dy*dy) / radius)),
      isRapid: false,
    });

    // 如果接近终点，添加终点并停止
    if (Math.sqrt(dx*dx + dy*dy) < 1) {
      segment.points.push({
        x: targetX,
        y: targetY,
        z: targetZ,
        isRapid: false,
      });
      break;
    }
  }
}

/**
 * 生成示例G代码
 */
export function generateSampleGCode(): string {
  return `; CNC Sample G-Code
; Simple drilling and contour example

G21 ; Metric units
G90 ; Absolute positioning
G17 ; XY plane selection

; Start position
G0 X0 Y0 Z10 ; Rapid move to start
M3 S1000 ; Spindle on clockwise

; Drill a hole at (20, 20)
G0 X20 Y20 Z10 ; Rapid to hole position
G1 Z-5 F100 ; Drill down
G0 Z10 ; Retract

; Drill a hole at (50, 50)
G0 X50 Y50 Z10 ; Rapid to hole position
G1 Z-5 F100 ; Drill down
G0 Z10 ; Retract

; Drill a hole at (80, 20)
G0 X80 Y20 Z10 ; Rapid to hole position
G1 Z-5 F100 ; Drill down
G0 Z10 ; Retract

; Contour cut - square
G0 X10 Y10 Z5 ; Rapid to start position
G1 Z-2 F100 ; Plunge
G1 X90 Y10 F500 ; Cut edge 1
G1 X90 Y90 F500 ; Cut edge 2
G1 X10 Y90 F500 ; Cut edge 3
G1 X10 Y10 F500 ; Cut edge 4
G0 Z10 ; Retract

; Surface milling - face top
G0 X0 Y0 Z2 ; Rapid to start
G1 Z-1 F100 ; Plunge
G1 X100 F800 ; First pass
G1 Y5 F500 ; Step over
G1 X0 F800 ; Second pass
G1 Y10 F500 ; Step over
G1 X100 F800 ; Third pass
G0 Z10 ; Retract

; End of program
M5 ; Spindle off
G0 Z50 ; Retract to safe height
G0 X0 Y0 ; Return to origin
M30 ; Program end`;
}