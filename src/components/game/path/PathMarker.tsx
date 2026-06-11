import React from 'react';
import { getPathColor } from './colorUtils';

export interface PathMarkerProps {
  displayStep: number;
  colorIndex: number;
  totalColors: number;
  isStart?: boolean;
  isLatest?: boolean;
  visitCount?: number;
}

export const PathMarker: React.FC<PathMarkerProps> = ({
  displayStep,
  colorIndex,
  totalColors,
  isStart = false,
  isLatest = false,
  visitCount = 1,
}) => {
  const mainColor = getPathColor(colorIndex, totalColors, 'main');
  const darkColor = getPathColor(colorIndex, totalColors, 'dark');

  return (
    <div
      className={`absolute inset-1.5 rounded-full flex items-center justify-center z-5 transition-all duration-300 select-none ${
        isLatest
          ? 'scale-110 ring-2 ring-white ring-offset-1'
          : ''
      }`}
      style={{
        backgroundColor: mainColor,
        border: `2px solid ${darkColor}`,
        opacity: isStart && displayStep === 0 ? 0.4 : 0.85,
        boxShadow: isLatest
          ? `0 0 12px ${mainColor}aa, 0 2px 8px rgba(0,0,0,0.3)`
          : '0 1px 4px rgba(0,0,0,0.25)',
        backdropFilter: 'blur(1px)',
      }}
    >
      {displayStep > 0 && (
        <span
          className="text-[11px] font-bold leading-none"
          style={{
            color: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {displayStep}
        </span>
      )}

      {visitCount > 1 && (
        <div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
          style={{
            backgroundColor: darkColor,
            border: '1px solid white',
          }}
        >
          {visitCount}
        </div>
      )}

      {isLatest && (
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-40"
          style={{ backgroundColor: mainColor }}
        />
      )}
    </div>
  );
};

export default PathMarker;
