import { useEffect, useRef } from 'react';

export function useGameLoop(callback: (deltaTime: number) => void, active = true) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!active) return;

    let lastTime = performance.now();
    let animationId: number;

    const loop = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      callbackRef.current(delta);
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [active]);
}
