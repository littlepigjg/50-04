import React, { useMemo } from 'react';
import type { PathPoint } from '../../../engine/types';
import { PathMarker } from './PathMarker';
import { PathLine } from './PathLine';
import {
  buildPathVisualizationData,
  buildMarkerMap,
} from './pathData';
import type {
  PathVisualizationData,
  PathMarkerData,
  PathLineData,
} from './pathData';

export interface PathVisualizationProps {
  pathHistory?: PathPoint[];
  cellSize: number;
  showPath?: boolean;
  renderMarkers?: boolean;
}

export const PathVisualization: React.FC<PathVisualizationProps> = ({
  pathHistory = [],
  cellSize,
  showPath = false,
  renderMarkers = true,
}) => {
  const vizData = useMemo(
    () => buildPathVisualizationData(pathHistory),
    [pathHistory]
  );

  if (!showPath) return null;

  return (
    <>
      {vizData.lines.map((line) => (
        <PathLine
          key={line.key}
          from={line.from}
          to={line.to}
          fromColorIndex={line.fromColorIndex}
          toColorIndex={line.toColorIndex}
          totalColors={vizData.totalColors}
          cellSize={cellSize}
        />
      ))}

      {renderMarkers && vizData.markers.map((marker) => (
        <div
          key={marker.key}
          className="absolute z-5"
          style={{
            left: marker.x * cellSize,
            top: marker.y * cellSize,
            width: cellSize,
            height: cellSize,
            pointerEvents: 'none',
          }}
        >
          <PathMarker
            displayStep={marker.displayStep}
            colorIndex={marker.colorIndex}
            totalColors={vizData.totalColors}
            isStart={marker.isStart}
            isLatest={marker.isLatest}
            visitCount={marker.visitCount}
          />
        </div>
      ))}
    </>
  );
};

export {
  buildPathVisualizationData,
  buildMarkerMap,
  PathMarker,
  PathLine,
};

export type {
  PathVisualizationData,
  PathMarkerData,
  PathLineData,
};

export { getPathColor, getPathColorSet, getLinearGradientColor } from './colorUtils';

export default PathVisualization;
