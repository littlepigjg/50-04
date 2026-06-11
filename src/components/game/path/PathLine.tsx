import React from 'react';
import type { Position } from '../../../engine/types';
import { getPathColor } from './colorUtils';

export interface PathLineProps {
  from: Position;
  to: Position;
  colorIndex: number;
  totalColors: number;
  cellSize: number;
  lineWidth?: number;
}

export const PathLine: React.FC<PathLineProps> = ({
  from,
  to,
  colorIndex,
  totalColors,
  cellSize,
  lineWidth = 5,
}) => {
  const isHorizontal = from.y === to.y;

  const fromColor = getPathColor(colorIndex - 1, totalColors, 'light');
  const toColor = getPathColor(colorIndex, totalColors, 'main');

  const startX = from.x * cellSize + cellSize / 2;
  const startY = from.y * cellSize + cellSize / 2;
  const endX = to.x * cellSize + cellSize / 2;
  const endY = to.y * cellSize + cellSize / 2;

  const length = isHorizontal
    ? Math.abs(endX - startX)
    : Math.abs(endY - startY);

  const left = isHorizontal
    ? Math.min(startX, endX)
    : startX - lineWidth / 2;
  const top = isHorizontal
    ? startY - lineWidth / 2
    : Math.min(startY, endY);
  const width = isHorizontal ? length : lineWidth;
  const height = isHorizontal ? lineWidth : length;

  const gradientDirection = isHorizontal
    ? endX > startX ? '90deg' : '270deg'
    : endY > startY ? '180deg' : '0deg';

  return (
    <div
      className="absolute z-4 transition-all duration-300 pointer-events-none"
      style={{
        left,
        top,
        width,
        height,
        borderRadius: lineWidth / 2,
        background: `linear-gradient(${gradientDirection}, ${fromColor} 0%, ${toColor} 100%)`,
        opacity: 0.75,
        boxShadow: `0 0 6px ${toColor}80`,
      }}
    />
  );
};

export default PathLine;
