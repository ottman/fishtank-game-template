import { useState, useCallback } from 'react';
import { GameState, GameResult } from '../types';

export function useGameState() {
  const [state, setState] = useState<GameState>(GameState.IDLE);
  const [result, setResult] = useState<GameResult | null>(null);

  const play = useCallback(() => setState(GameState.PLAYING), []);
  const pause = useCallback(() => setState(GameState.PAUSED), []);
  const resume = useCallback(() => setState(GameState.PLAYING), []);
  const reset = useCallback(() => {
    setState(GameState.IDLE);
    setResult(null);
  }, []);
  const end = useCallback((gameResult: GameResult) => {
    setResult(gameResult);
    setState(GameState.GAME_OVER);
  }, []);

  return { state, result, play, pause, resume, reset, end };
}
