const PALETTE: [number, number, number][] = [
  [231, 76, 60],
  [41, 128, 185],
  [39, 174, 96],
  [243, 156, 18],
  [142, 68, 173],
  [230, 126, 34],
  [22, 160, 133],
  [211, 84, 0],
  [52, 73, 94],
  [192, 57, 43],
  [26, 188, 156],
  [44, 62, 80],
];

const PALETTE_LIGHT: [number, number, number][] = [
  [241, 148, 138],
  [133, 193, 233],
  [130, 224, 170],
  [249, 200, 100],
  [195, 155, 211],
  [245, 176, 118],
  [118, 215, 195],
  [240, 148, 82],
  [133, 163, 185],
  [231, 138, 131],
  [118, 237, 211],
  [133, 160, 182],
];

const PALETTE_DARK: [number, number, number][] = [
  [176, 48, 38],
  [28, 90, 140],
  [25, 130, 75],
  [190, 120, 8],
  [105, 45, 130],
  [178, 95, 18],
  [12, 120, 100],
  [160, 60, 0],
  [30, 52, 70],
  [148, 38, 25],
  [15, 140, 115],
  [28, 42, 58],
];

function rgbStr(c: [number, number, number]): string {
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

export interface PathColor {
  main: string;
  light: string;
  dark: string;
  glow: string;
}

function pick<T>(arr: T[], index: number): T {
  return arr[((index % arr.length) + arr.length) % arr.length];
}

export function getPathColor(
  index: number,
  _total: number,
  variant: 'main' | 'light' | 'dark' = 'main'
): string {
  const palette =
    variant === 'light'
      ? PALETTE_LIGHT
      : variant === 'dark'
      ? PALETTE_DARK
      : PALETTE;
  return rgbStr(pick(palette, index));
}

export function getPathColorSet(index: number, total: number): PathColor {
  return {
    main: getPathColor(index, total, 'main'),
    light: getPathColor(index, total, 'light'),
    dark: getPathColor(index, total, 'dark'),
    glow: getPathColor(index, total, 'main') + '99',
  };
}

export function getLinearGradientColor(
  fromIndex: number,
  toIndex: number,
  t: number
): string {
  return lerpColor(pick(PALETTE_LIGHT, fromIndex), pick(PALETTE_LIGHT, toIndex), t);
}

export function getPerceptualDistance(_color1: string, _color2: string): number {
  return 0;
}
