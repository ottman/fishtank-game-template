'use client';
import { useRef } from 'react';
import { useGameState } from '@/lib/hooks/useGameState';
import { useGameLoop } from '@/lib/hooks/useGameLoop';
import { useKeyboard } from '@/lib/hooks/useKeyboard';
import { GameState } from '@/lib/types';
import GameWindow from './GameWindow';
import GameControls from './GameControls';
import styles from './Game.module.css';

export default function Game() {
  const { state, result, play, pause, resume, reset, end } = useGameState();
  const { isPressed } = useKeyboard();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game loop - only runs when PLAYING
  useGameLoop((delta) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // TODO: Update game state based on delta time
    // TODO: Check for game over conditions
    // TODO: Render to canvas

  }, state === GameState.PLAYING);

  return (
    <div className={styles.container}>
      <GameWindow>
        {state === GameState.IDLE && (
          <div className={styles.overlay}>
            <h2>Ready to Play?</h2>
            <button onClick={play}>Start Game</button>
          </div>
        )}

        {state === GameState.PAUSED && (
          <div className={styles.overlay}>
            <h2>Paused</h2>
            <button onClick={resume}>Resume</button>
          </div>
        )}

        {state === GameState.GAME_OVER && result && (
          <div className={styles.overlay}>
            <h2>Game Over!</h2>
            {result.score !== undefined && <p>Score: {result.score}</p>}
            <button onClick={reset}>Play Again</button>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className={styles.canvas}
        />
      </GameWindow>

      <GameControls
        state={state}
        onPause={pause}
        onResume={resume}
        onReset={reset}
      />
    </div>
  );
}
