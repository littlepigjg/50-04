const GOLDEN_ANGLE = 137.508;

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function labF(t: number): number {
  const delta = 6 / 29;
  return t > delta * delta * delta ? Math.cbrt(t) : t / (3 * delta * delta) + 4 / 29;
}

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  let rn = r / 255;
  let gn = g / 255;
  let bn = b / 255;

  rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
  gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
  bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;

  const x = (rn * 0.4124564 + gn * 0.3575761 + bn * 0.1804375) / 0.95047;
  const y = rn * 0.2126729 + gn * 0.7151522 + bn * 0.0721750;
  const z = (rn * 0.0193339 + gn * 0.1191920 + bn * 0.9503041) / 1.08883;

  const fx = labF(x);
  const fy = labF(y);
  const fz = labF(z);

  return [
    116 * fy - 16,
    500 * (fx - fy),
    200 * (fy - fz),
  ];
}

export interface PathColor {
  main: string;
  light: string;
  dark: string;
  glow: string;
}

export function getPathColor(index: number, total: number, variant: 'main' | 'light' | 'dark' = 'main'): string {
  if (total <= 1) {
    const hue = 0;
    const lightness = variant === 'light' ? 70 : variant === 'dark' ? 35 : 52;
    return `hsl(${hue}, 75%, ${lightness}%)`;
  }

  const hue = (index * GOLDEN_ANGLE) % 360;
  const lightness = variant === 'light' ? 70 : variant === 'dark' ? 38 : 55;
  const saturation = 78;

  return `hsl(${hue.toFixed(1)}, ${saturation}%, ${lightness}%)`;
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
  const fromHue = (fromIndex * GOLDEN_ANGLE) % 360;
  const toHue = (toIndex * GOLDEN_ANGLE) % 360;

  let diff = toHue - fromHue;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  const hue = (fromHue + diff * t + 360) % 360;
  return `hsl(${hue.toFixed(1)}, 78%, 65%)`;
}

export function getPerceptualDistance(color1: string, color2: string): number {
  const parseHsl = (s: string) => {
    const match = s.match(/hsl\(([-\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
    if (!match) return [0, 0, 0];
    return [parseFloat(match[1]), parseFloat(match[2]) / 100, parseFloat(match[3]) / 100];
  };

  const [h1, s1, l1] = parseHsl(color1);
  const [h2, s2, l2] = parseHsl(color2);

  const [r1, g1, b1] = hslToRgb(h1, s1, l1);
  const [r2, g2, b2] = hslToRgb(h2, s2, l2);

  const [L1, a1, b1lab] = rgbToLab(r1, g1, b1);
  const [L2, a2, b2lab] = rgbToLab(r2, g2, b2);

  return Math.sqrt(
    (L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1lab - b2lab) ** 2
  );
}
