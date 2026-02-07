'use client';

/**
 * FISHTANK GAME TEMPLATE
 *
 * This is the main game component. Modify this file to create your game.
 *
 * Available hooks:
 * - useGameState(): Manages game lifecycle (play, pause, reset, end)
 * - useGameLoop(callback, active): Runs at 60fps with delta time
 * - useKeyboard(): Tracks keyboard input
 * - useMouse(ref): Tracks mouse/touch input
 * - useCanvas(config): Provides canvas utilities
 * - useSound(src): Plays audio files
 *
 * Available utilities (from lib/utils.ts):
 * - Collision: rectsCollide, circlesCollide, pointInRect, entitiesCollide
 * - Math: clamp, lerp, random, randomInt, randomItem
 * - Vector: addVectors, subtractVectors, scaleVector, normalizeVector
 */

import { useRef, useCallback } from 'react';
import { useGameState } from '@/lib/hooks/useGameState';
import { useGameLoop } from '@/lib/hooks/useGameLoop';
import { useKeyboard } from '@/lib/hooks/useKeyboard';
import { useMouse } from '@/lib/hooks/useMouse';
import { useCanvas } from '@/lib/hooks/useCanvas';
import { GameState, Vector2D } from '@/lib/types';
import { clamp, circlesCollide, random, randomInt } from '@/lib/utils';
import GameWindow from './GameWindow';
import GameControls from './GameControls';
import styles from './Game.module.css';

// =============================================================================
// GAME CONFIGURATION
// Customize these values for your game
// =============================================================================

const CONFIG = {
  width: 800,
  height: 600,
  playerSpeed: 300,      // pixels per second
  playerSize: 20,
  targetSize: 15,
  targetSpawnRate: 1000, // ms between spawns
  maxTargets: 10,
};

// =============================================================================
// GAME STATE
// Define your game's state here using useRef for mutable game data
// =============================================================================

interface Target {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface PlayerState {
  x: number;
  y: number;
}

// =============================================================================
// MAIN GAME COMPONENT
// =============================================================================

export default function Game() {
  // Game lifecycle management
  const {
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
    isPlaying,
  } = useGameState();

  // Input handling
  const { isPressed } = useKeyboard();

  // Canvas setup
  const {
    canvasRef,
    containerRef,
    scale,
    width,
    height,
    clear,
    drawCircle,
    drawText,
  } = useCanvas(CONFIG);

  // Mouse/touch input (relative to canvas)
  const mouse = useMouse(canvasRef as React.RefObject<HTMLElement>);

  // Mutable game state (useRef to avoid re-renders during game loop)
  const player = useRef<PlayerState>({ x: width / 2, y: height / 2 });
  const targets = useRef<Target[]>([]);
  const lastSpawn = useRef<number>(0);
  const targetIdCounter = useRef<number>(0);

  // =========================================================================
  // GAME LOGIC
  // Implement your game mechanics here
  // =========================================================================

  const spawnTarget = useCallback(() => {
    if (targets.current.length >= CONFIG.maxTargets) return;

    const colors = ['#00d4ff', '#00ff88', '#ff4444', '#ffaa00', '#aa44ff'];
    const target: Target = {
      id: targetIdCounter.current++,
      x: randomInt(CONFIG.targetSize, width - CONFIG.targetSize),
      y: randomInt(CONFIG.targetSize, height - CONFIG.targetSize),
      radius: CONFIG.targetSize,
      color: colors[randomInt(0, colors.length - 1)],
    };
    targets.current.push(target);
  }, [width, height]);

  const resetGameState = useCallback(() => {
    player.current = { x: width / 2, y: height / 2 };
    targets.current = [];
    lastSpawn.current = 0;
    targetIdCounter.current = 0;
  }, [width, height]);

  // Handle play button - reset state when starting new game
  const handlePlay = useCallback(() => {
    resetGameState();
    play();
  }, [resetGameState, play]);

  // =========================================================================
  // GAME LOOP
  // This runs every frame (~60fps) while the game is playing
  // =========================================================================

  useGameLoop((deltaTime) => {
    // --- UPDATE PHASE ---

    // Player movement (keyboard)
    const speed = CONFIG.playerSpeed * (deltaTime / 1000);
    if (isPressed('ArrowLeft') || isPressed('KeyA')) {
      player.current.x -= speed;
    }
    if (isPressed('ArrowRight') || isPressed('KeyD')) {
      player.current.x += speed;
    }
    if (isPressed('ArrowUp') || isPressed('KeyW')) {
      player.current.y -= speed;
    }
    if (isPressed('ArrowDown') || isPressed('KeyS')) {
      player.current.y += speed;
    }

    // Player movement (mouse/touch) - move toward click/touch position
    if (mouse.isDown) {
      const dx = mouse.position.x - player.current.x;
      const dy = mouse.position.y - player.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        player.current.x += (dx / dist) * speed;
        player.current.y += (dy / dist) * speed;
      }
    }

    // Keep player in bounds
    player.current.x = clamp(player.current.x, CONFIG.playerSize, width - CONFIG.playerSize);
    player.current.y = clamp(player.current.y, CONFIG.playerSize, height - CONFIG.playerSize);

    // Spawn targets periodically
    lastSpawn.current += deltaTime;
    if (lastSpawn.current >= CONFIG.targetSpawnRate) {
      spawnTarget();
      lastSpawn.current = 0;
    }

    // Check collisions with targets
    targets.current = targets.current.filter(target => {
      const hit = circlesCollide(
        player.current,
        CONFIG.playerSize,
        target,
        target.radius
      );
      if (hit) {
        addScore(10);
        return false; // Remove target
      }
      return true;
    });

    // --- RENDER PHASE ---

    // Clear canvas
    clear('#0a0a0f');

    // Draw targets
    for (const target of targets.current) {
      drawCircle(target.x, target.y, target.radius, target.color);
    }

    // Draw player
    drawCircle(player.current.x, player.current.y, CONFIG.playerSize, '#ffffff');

    // Draw score
    drawText(`Score: ${score}`, 20, 20, {
      color: '#00d4ff',
      font: 'bold 24px system-ui',
    });

    // Draw high score
    if (highScore > 0) {
      drawText(`Best: ${highScore}`, 20, 50, {
        color: '#8b8b9e',
        font: '16px system-ui',
      });
    }

    // Draw instructions
    drawText('Arrow keys or WASD to move • Click/tap to move toward pointer', width / 2, height - 20, {
      color: '#8b8b9e',
      font: '14px system-ui',
      align: 'center',
    });

  }, isPlaying);

  // =========================================================================
  // RENDER UI
  // =========================================================================

  return (
    <div className={styles.container}>
      <GameWindow>
        {/* IDLE STATE - Start screen */}
        {state === GameState.IDLE && (
          <div className={styles.overlay}>
            <h2>If you build it, they will come</h2>
            <p className={styles.subtitle}>Collect the orbs!</p>
            <button onClick={handlePlay}>Start Game</button>
          </div>
        )}

        {/* PAUSED STATE */}
        {state === GameState.PAUSED && (
          <div className={styles.overlay}>
            <h2>Paused</h2>
            <button onClick={resume}>Resume</button>
          </div>
        )}

        {/* GAME OVER STATE */}
        {state === GameState.GAME_OVER && result && (
          <div className={styles.overlay}>
            <h2>Game Over!</h2>
            {result.score !== undefined && (
              <p className={styles.score}>Score: {result.score}</p>
            )}
            {result.highScore !== undefined && result.highScore > (result.score ?? 0) && (
              <p className={styles.highScore}>Best: {result.highScore}</p>
            )}
            <button onClick={handlePlay}>Play Again</button>
          </div>
        )}

        {/* GAME CANVAS */}
        <div ref={containerRef} className={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            width={CONFIG.width}
            height={CONFIG.height}
            className={styles.canvas}
            style={{ transform: `scale(${scale})` }}
          />
        </div>
      </GameWindow>

      {/* GAME CONTROLS */}
      <GameControls
        state={state}
        onPause={pause}
        onResume={resume}
        onReset={reset}
      />
    </div>
  );
}
