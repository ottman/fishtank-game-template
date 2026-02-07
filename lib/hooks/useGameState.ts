import { useState, useCallback, useEffect } from 'react';
import { GameState, GameResult, GameMessage } from '../types';

/**
 * Game state machine hook
 * Manages game lifecycle and communicates with parent frame
 */
export function useGameState() {
  const [state, setState] = useState<GameState>(GameState.IDLE);
  const [result, setResult] = useState<GameResult | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Send message to parent frame (fishtank)
  const postMessage = useCallback((message: GameMessage) => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage(message, '*');
    }
  }, []);

  // Load high score from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('highScore');
      if (saved) setHighScore(parseInt(saved, 10));
      postMessage({ type: 'GAME_READY' });
    }
  }, [postMessage]);

  const play = useCallback(() => {
    setState(GameState.PLAYING);
    setScore(0);
    setResult(null);
    postMessage({ type: 'GAME_START' });
  }, [postMessage]);

  const pause = useCallback(() => {
    setState(GameState.PAUSED);
    postMessage({ type: 'GAME_PAUSE' });
  }, [postMessage]);

  const resume = useCallback(() => {
    setState(GameState.PLAYING);
    postMessage({ type: 'GAME_RESUME' });
  }, [postMessage]);

  const reset = useCallback(() => {
    setState(GameState.IDLE);
    setScore(0);
    setResult(null);
  }, []);

  const end = useCallback((gameResult: GameResult) => {
    const finalScore = gameResult.score ?? score;
    const newHighScore = Math.max(finalScore, highScore);

    if (newHighScore > highScore) {
      setHighScore(newHighScore);
      if (typeof window !== 'undefined') {
        localStorage.setItem('highScore', newHighScore.toString());
      }
    }

    const finalResult = { ...gameResult, score: finalScore, highScore: newHighScore };
    setResult(finalResult);
    setState(GameState.GAME_OVER);
    postMessage({ type: 'GAME_OVER', result: finalResult });
  }, [score, highScore, postMessage]);

  const addScore = useCallback((points: number) => {
    setScore(prev => {
      const newScore = prev + points;
      postMessage({ type: 'SCORE_UPDATE', score: newScore });
      return newScore;
    });
  }, [postMessage]);

  return {
    state,
    result,
    score,
    highScore,
    play,
    pause,
    resume,
    reset,
    end,
    addScore,
    isPlaying: state === GameState.PLAYING,
    isPaused: state === GameState.PAUSED,
    isGameOver: state === GameState.GAME_OVER,
    isIdle: state === GameState.IDLE,
  };
}
