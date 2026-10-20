import * as THREE from 'three';

let _dot: THREE.Texture | null = null;
/** Soft round sprite for point clouds. */
export function dotTexture() {
  if (_dot) return _dot;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.85)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  _dot = new THREE.CanvasTexture(c);
  return _dot;
}

export const COL = {
  safe: new THREE.Color('#2ee6c8'),
  risk: new THREE.Color('#ff4d6d'),
  warn: new THREE.Color('#ffb547'),
  volt: new THREE.Color('#8b7dff'),
  sky: new THREE.Color('#4cc3ff'),
};

export function riskColor3(t: number) {
  t = Math.max(0, Math.min(1, t));
  const stops = [COL.safe, new THREE.Color('#beeb5a'), COL.warn, COL.risk];
  const seg = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(seg));
  return stops[i].clone().lerp(stops[i + 1], seg - i);
}

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

// Local fonts for 3D text (no CDN, works offline in the review hall)
export const FONT = 'fonts/Inter-700.ttf';
export const MONO = 'fonts/GeistMono-Regular.ttf';
