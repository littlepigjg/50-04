import React, { useMemo } from 'react';
import type { PathPoint, Position } from '../../engine/types';

export interface PathVisualizationData {
  markers: Array<{
    key: string;
    x: number;
    y: number;
    displayStep: number;
    colorIndex: number;
    totalCount: number;
    isFirst: boolean;
    isLast: boolean;
    isStart: boolean;
  }>;
  lines: Array<{
    key: string;
    from: Position;
    to: Position;
    colorIndex: number;
    totalCount: number;
  }>;
}

export function buildPathVisualizationData(
  pathHistory: PathPoint[]
): PathVisualizationData {
  const markers: PathVisualizationData['markers'] = [];
  const lines: PathVisualizationData['lines'] = [];
  const totalCount = Math.max(pathHistory.length, 1);

  const lastVisitAtPosition = new Map<string, { colorIndex: number; displayStep: number; isStart: boolean }>();

  pathHistory.forEach((point, index) => {
    const key = `${point.position.x},${point.position.y}`;
    lastVisitAtPosition.set(key, {
      colorIndex: index,
      displayStep: point.step,
      isStart: index === 0,
    });
  });

  lastVisitAtPosition.forEach((info, key) => {
    const [x, y] = key.split(',').map(Number);
    markers.push({
      key,
      x,
      y,
      displayStep: info.displayStep,
      colorIndex: info.colorIndex,
      totalCount,
      isFirst: info.isStart,
      isLast: info.colorIndex === totalCount - 1,
      isStart: info.isStart,
    });
  });

  markers.sort((a, b) => a.colorIndex - b.colorIndex);

  for (let i = 0; i < pathHistory.length - 1; i++) {
    const from = pathHistory[i].position;
    const to = pathHistory[i + 1].position;
    if (from.x !== to.x || from.y !== to.y) {
      lines.push({
        key: `line-${i}`,
        from,
        to,
        colorIndex: i + 1,
        totalCount,
      });
    }
  }

  return { markers, lines };
}

export function getPathColor(colorIndex: number, totalCount: number, lightness: number = 50): string {
  const ratio = totalCount <= 1 ? 0 : colorIndex / (totalCount - 1);
  const hue = ratio * 300;
  return `hsl(${hue}, 75%, ${lightness}%)`;
}

interface PathMarkerProps {
  displayStep: number;
  colorIndex: number;
  totalCount: number;
  isFirst?: boolean;
  isLast?: boolean;
}

export const PathMarker: React.FC<PathMarkerProps> = ({
  displayStep,
  colorIndex,
  totalCount,
  isFirst,
  isLast,
}) => {
  const color = getPathColor(colorIndex, totalCount, 52);
  const borderColor = getPathColor(colorIndex, totalCount, 35);

  return (
    <div
      className={`absolute inset-1.5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-md z-5 transition-all duration-300 ${
        isLast ? 'scale-110 animate-pulse ring-2 ring-white ring-offset-1' : ''
      }`}
      style={{
        backgroundColor: color,
        border: `2px solid ${borderColor}`,
        opacity: isFirst ? 0.35 : 0.8,
        backdropFilter: 'blur(1px)',
      }}
    >
      {displayStep > 0 && (
        <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] leading-none">
          {displayStep}
        </span>
      )}
    </div>
  );
};

interface PathLineProps {
  from: Position;
  to: Position;
  colorIndex: number;
  totalCount: number;
  cellSize: number;
}

export const PathLine: React.FC<PathLineProps> = ({
  from,
  to,
  colorIndex,
  totalCount,
  cellSize,
}) => {
  const isHorizontal = from.y === to.y;
  const color = getPathColor(colorIndex, totalCount, 62);

  const startX = from.x * cellSize + cellSize / 2;
  const startY = from.y * cellSize + cellSize / 2;
  const endX = to.x * cellSize + cellSize / 2;
  const endY = to.y * cellSize + cellSize / 2;

  const length = isHorizontal
    ? Math.abs(endX - startX)
    : Math.abs(endY - startY);

  const lineWidth = 5;
  const left = isHorizontal ? Math.min(startX, endX) : startX - lineWidth / 2;
  const top = isHorizontal ? startY - lineWidth / 2 : Math.min(startY, endY);
  const width = isHorizontal ? length : lineWidth;
  const height = isHorizontal ? lineWidth : length;

  return (
    <div
      className="absolute z-4 transition-all duration-300 rounded-full"
      style={{
        left,
        top,
        width,
        height,
        background: `linear-gradient(${
          isHorizontal
            ? endX > startX ? '90deg' : '270deg'
            : endY > startY ? '180deg' : '0deg'
        }, ${getPathColor(colorIndex - 1, totalCount, 65)} 0%, ${color} 100%)`,
        opacity: 0.7,
        boxShadow: `0 0 4px ${color}80`,
      }}
    />
  );
};

interface PathVisualizationProps {
  pathHistory?: PathPoint[];
  cellSize: number;
  showPath?: boolean;
}

export const PathVisualization: React.FC<PathVisualizationProps> = ({
  pathHistory = [],
  cellSize,
  showPath = false,
}) => {
  const { lines } = useMemo(
    () => buildPathVisualizationData(pathHistory),
    [pathHistory]
  );

  if (!showPath) return null;

  return (
    <>
      {lines.map((line) => (
        <PathLine
          key={line.key}
          from={line.from}
          to={line.to}
          colorIndex={line.colorIndex}
          totalCount={line.totalCount}
          cellSize={cellSize}
        />
      ))}
    </>
  );
};

export default PathVisualization;
