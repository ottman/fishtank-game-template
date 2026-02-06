import { useState, useEffect, useCallback, RefObject } from 'react';

interface MouseState {
  x: number;
  y: number;
  isDown: boolean;
}

export function useMouse(elementRef?: RefObject<HTMLElement>) {
  const [mouse, setMouse] = useState<MouseState>({ x: 0, y: 0, isDown: false });

  useEffect(() => {
    const element = elementRef?.current || window;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const target = elementRef?.current;
      let x: number, y: number;

      if ('touches' in e) {
        const touch = e.touches[0];
        if (target) {
          const rect = target.getBoundingClientRect();
          x = touch.clientX - rect.left;
          y = touch.clientY - rect.top;
        } else {
          x = touch.clientX;
          y = touch.clientY;
        }
      } else {
        if (target) {
          const rect = target.getBoundingClientRect();
          x = e.clientX - rect.left;
          y = e.clientY - rect.top;
        } else {
          x = e.clientX;
          y = e.clientY;
        }
      }

      setMouse(prev => ({ ...prev, x, y }));
    };

    const handleDown = () => setMouse(prev => ({ ...prev, isDown: true }));
    const handleUp = () => setMouse(prev => ({ ...prev, isDown: false }));

    element.addEventListener('mousemove', handleMove as EventListener);
    element.addEventListener('touchmove', handleMove as EventListener);
    element.addEventListener('mousedown', handleDown);
    element.addEventListener('touchstart', handleDown);
    element.addEventListener('mouseup', handleUp);
    element.addEventListener('touchend', handleUp);

    return () => {
      element.removeEventListener('mousemove', handleMove as EventListener);
      element.removeEventListener('touchmove', handleMove as EventListener);
      element.removeEventListener('mousedown', handleDown);
      element.removeEventListener('touchstart', handleDown);
      element.removeEventListener('mouseup', handleUp);
      element.removeEventListener('touchend', handleUp);
    };
  }, [elementRef]);

  return mouse;
}
