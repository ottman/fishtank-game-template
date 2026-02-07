import { useState, useEffect, useCallback, RefObject } from 'react';
import { Vector2D } from '../types';

interface MouseState {
  /** Current mouse/touch position */
  position: Vector2D;
  /** Whether mouse button or touch is currently pressed */
  isDown: boolean;
  /** Whether mouse/touch just started this frame */
  justPressed: boolean;
  /** Whether mouse/touch just released this frame */
  justReleased: boolean;
}

/**
 * Mouse and touch input hook
 * Tracks position relative to element and press/release states
 */
export function useMouse(elementRef?: RefObject<HTMLElement | null>) {
  const [mouse, setMouse] = useState<MouseState>({
    position: { x: 0, y: 0 },
    isDown: false,
    justPressed: false,
    justReleased: false,
  });

  // Clear just pressed/released flags after a frame
  useEffect(() => {
    if (mouse.justPressed || mouse.justReleased) {
      const timeout = setTimeout(() => {
        setMouse(prev => ({ ...prev, justPressed: false, justReleased: false }));
      }, 16);
      return () => clearTimeout(timeout);
    }
  }, [mouse.justPressed, mouse.justReleased]);

  useEffect(() => {
    const getPosition = (clientX: number, clientY: number): Vector2D => {
      const target = elementRef?.current;
      if (target) {
        const rect = target.getBoundingClientRect();
        const scaleX = target.clientWidth / (target as HTMLCanvasElement).width || 1;
        const scaleY = target.clientHeight / (target as HTMLCanvasElement).height || 1;
        return {
          x: (clientX - rect.left) / scaleX,
          y: (clientY - rect.top) / scaleY,
        };
      }
      return { x: clientX, y: clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const position = getPosition(e.clientX, e.clientY);
      setMouse(prev => ({ ...prev, position }));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const position = getPosition(touch.clientX, touch.clientY);
        setMouse(prev => ({ ...prev, position }));
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const position = getPosition(e.clientX, e.clientY);
      setMouse(prev => ({ ...prev, position, isDown: true, justPressed: true }));
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const position = getPosition(touch.clientX, touch.clientY);
        setMouse(prev => ({ ...prev, position, isDown: true, justPressed: true }));
      }
    };

    const handleMouseUp = () => {
      setMouse(prev => ({ ...prev, isDown: false, justReleased: true }));
    };

    const handleTouchEnd = () => {
      setMouse(prev => ({ ...prev, isDown: false, justReleased: true }));
    };

    const element = elementRef?.current || window;

    element.addEventListener('mousemove', handleMouseMove as EventListener);
    element.addEventListener('touchmove', handleTouchMove as EventListener, { passive: true });
    element.addEventListener('mousedown', handleMouseDown as EventListener);
    element.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove as EventListener);
      element.removeEventListener('touchmove', handleTouchMove as EventListener);
      element.removeEventListener('mousedown', handleMouseDown as EventListener);
      element.removeEventListener('touchstart', handleTouchStart as EventListener);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef]);

  return mouse;
}
