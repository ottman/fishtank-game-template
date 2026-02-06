import { useState, useEffect } from 'react';

export function useKeyboard() {
  const [keys, setKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set(prev).add(e.code));
    };
    const handleUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const next = new Set(prev);
        next.delete(e.code);
        return next;
      });
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  const isPressed = (code: string) => keys.has(code);
  return { keys, isPressed };
}
