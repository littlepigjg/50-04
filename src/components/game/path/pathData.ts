import type { PathPoint, Position } from '../../../engine/types';

export interface PathMarkerData {
  key: string;
  x: number;
  y: number;
  displayStep: number;
  colorIndex: number;
  visitCount: number;
  isStart: boolean;
  isLatest: boolean;
}

export interface PathLineData {
  key: string;
  from: Position;
  to: Position;
  fromColorIndex: number;
  toColorIndex: number;
}

export interface PathVisualizationData {
  markers: PathMarkerData[];
  lines: PathLineData[];
  totalColors: number;
}

function posKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function buildPathVisualizationData(
  pathHistory: PathPoint[]
): PathVisualizationData {
  const markers: PathMarkerData[] = [];
  const lines: PathLineData[] = [];

  if (pathHistory.length === 0) {
    return { markers, lines, totalColors: 0 };
  }

  const firstPoint = pathHistory[0];
  const lastPoint = pathHistory[pathHistory.length - 1];

  const visitInfo = new Map<
    string,
    { colorIndex: number; displayStep: number; visitCount: number }
  >();

  const posFirstColorIndex = new Map<string, number>();

  let currentColorIndex = 0;

  const firstKey = posKey(firstPoint.position.x, firstPoint.position.y);
  visitInfo.set(firstKey, {
    colorIndex: 0,
    displayStep: firstPoint.step,
    visitCount: 1,
  });
  posFirstColorIndex.set(firstKey, 0);

  for (let i = 1; i < pathHistory.length; i++) {
    const point = pathHistory[i];
    const key = posKey(point.position.x, point.position.y);
    const prevPoint = pathHistory[i - 1];
    const prevKey = posKey(prevPoint.position.x, prevPoint.position.y);

    const positionChanged = key !== prevKey;

    if (positionChanged) {
      currentColorIndex++;

      const toColorIndex = posFirstColorIndex.has(key)
        ? posFirstColorIndex.get(key)!
        : currentColorIndex;

      lines.push({
        key: `line-${lines.length}`,
        from: { ...prevPoint.position },
        to: { ...point.position },
        fromColorIndex: currentColorIndex - 1,
        toColorIndex,
      });

      const existing = visitInfo.get(key);
      if (existing) {
        existing.displayStep = point.step;
        existing.visitCount++;
      } else {
        visitInfo.set(key, {
          colorIndex: currentColorIndex,
          displayStep: point.step,
          visitCount: 1,
        });
        posFirstColorIndex.set(key, currentColorIndex);
      }
    } else {
      const existing = visitInfo.get(key);
      if (existing) {
        existing.displayStep = point.step;
      }
    }
  }

  const totalColors = currentColorIndex + 1;

  const lastKey = posKey(lastPoint.position.x, lastPoint.position.y);
  const startKey = firstKey;

  visitInfo.forEach((info, key) => {
    const [x, y] = key.split(',').map(Number);
    markers.push({
      key,
      x,
      y,
      displayStep: info.displayStep,
      colorIndex: info.colorIndex,
      visitCount: info.visitCount,
      isStart: key === startKey,
      isLatest: key === lastKey,
    });
  });

  markers.sort((a, b) => a.colorIndex - b.colorIndex);

  return { markers, lines, totalColors };
}

export function buildMarkerMap(data: PathVisualizationData): Map<string, PathMarkerData> {
  const map = new Map<string, PathMarkerData>();
  data.markers.forEach((m) => map.set(m.key, m));
  return map;
}
