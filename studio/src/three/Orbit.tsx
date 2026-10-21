import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { ComponentProps, useEffect } from 'react';

const isTouch = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

/**
 * OrbitControls that don't trap the page on phones: vertical swipes scroll the page,
 * horizontal drags rotate. Pinch-zoom is off on touch so it can't fight scrolling.
 */
export default function Orbit(props: ComponentProps<typeof OrbitControls>) {
  const gl = useThree((s) => s.gl);
  const touch = isTouch();
  useEffect(() => {
    const el = gl.domElement;
    const fix = () => { el.style.touchAction = 'pan-y'; };
    fix();
    const t = setTimeout(fix, 50);
    return () => clearTimeout(t);
  }, [gl]);
  return <OrbitControls {...props} enableZoom={touch ? false : props.enableZoom} />;
}

export const narrow = () => typeof window !== 'undefined' && window.innerWidth < 640;
