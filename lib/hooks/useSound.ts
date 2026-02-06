import { useRef, useCallback } from 'react';

export function useSound(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, [src]);

  return play;
}
