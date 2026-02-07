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
 * - useParticles(): Particle effects (explosions, trails, sparkles)
 * - useScreenShake(): Screen shake for impacts
 * - useSynthSound(): Synthesized sound effects (no audio files needed)
 *
 * Available utilities (from lib/utils.ts):
 * - Collision: rectsCollide, circlesCollide, pointInRect, entitiesCollide
 * - Math: clamp, lerp, random, randomInt, randomItem
 * - Vector: addVectors, subtractVectors, scaleVector, normalizeVector
 *
 * See examples/ folder for complete game implementations:
 * - flappy-bird.tsx: Tap to fly, avoid pipes
 * - space-shooter.tsx: Keyboard shooter with power-ups
 * - brick-breaker.tsx: Mouse-controlled paddle game
 */

import { useRef, useCallback } from 'react';
import { useGameState } from '@/lib/hooks/useGameState';
import { useGameLoop } from '@/lib/hooks/useGameLoop';
import { useKeyboard } from '@/lib/hooks/useKeyboard';
import { useMouse } from '@/lib/hooks/useMouse';
import { useCanvas } from '@/lib/hooks/useCanvas';
import { useParticles } from '@/lib/hooks/useParticles';
import { useScreenShake } from '@/lib/hooks/useScreenShake';
import { useSynthSound } from '@/lib/hooks/useSound';
import { GameState } from '@/lib/types';
import { clamp, circlesCollide, randomInt } from '@/lib/utils';
import GameWindow from './GameWindow';
import GameControls from './GameControls';
import styles from './Game.module.css';

// =============================================================================
// GAME CONFIGURATION
// =============================================================================

const CONFIG = {
  width: 800,
  height: 600,
  playerSpeed: 300,
  playerSize: 20,
  targetSize: 15,
  targetSpawnRate: 800,
  maxTargets: 12,
};

// =============================================================================
// GAME STATE TYPES
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
    ctx,
  } = useCanvas(CONFIG);

  // Mouse/touch input (relative to canvas)
  const mouse = useMouse(canvasRef as React.RefObject<HTMLElement>);

  // Visual effects
  const particles = useParticles();
  const shake = useScreenShake();

  // Sound effects (synthesized - no audio files needed!)
  const sound = useSynthSound();

  // Mutable game state (useRef to avoid re-renders during game loop)
  const player = useRef<PlayerState>({ x: width / 2, y: height / 2 });
  const targets = useRef<Target[]>([]);
  const lastSpawn = useRef<number>(0);
  const targetIdCounter = useRef<number>(0);

  // =========================================================================
  // GAME LOGIC
  // =========================================================================

  const spawnTarget = useCallback(() => {
    if (targets.current.length >= CONFIG.maxTargets) return;

    const colors = ['#00d4ff', '#00ff88', '#ff4444', '#ffaa00', '#aa44ff'];
    const target: Target = {
      id: targetIdCounter.current++,
      x: randomInt(CONFIG.targetSize + 20, width - CONFIG.targetSize - 20),
      y: randomInt(CONFIG.targetSize + 20, height - CONFIG.targetSize - 20),
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
    particles.clear();
  }, [width, height, particles]);

  const handlePlay = useCallback(() => {
    resetGameState();
    play();
  }, [resetGameState, play]);

  // =========================================================================
  // GAME LOOP
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

    // Player movement (mouse/touch)
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

    // Player trail particles
    if (isPlaying && (isPressed('ArrowLeft') || isPressed('ArrowRight') || isPressed('ArrowUp') || isPressed('ArrowDown') || isPressed('KeyW') || isPressed('KeyA') || isPressed('KeyS') || isPressed('KeyD') || mouse.isDown)) {
      particles.trail(player.current.x, player.current.y, {
        colors: ['#00d4ff', '#ffffff'],
        gravity: 0,
      });
    }

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
        sound.coin();
        shake.shakeSmall();
        particles.explode(target.x, target.y, {
          count: 15,
          colors: [target.color, '#ffffff'],
        });
        return false;
      }
      return true;
    });

    // Update effects
    particles.update(deltaTime);
    shake.update(deltaTime);

    // --- RENDER PHASE ---
    const c = ctx;
    if (!c) return;

    c.save();
    shake.apply(c);

    // Clear canvas
    clear('#0a0a0f');

    // Draw targets with glow effect
    for (const target of targets.current) {
      // Glow
      c.shadowColor = target.color;
      c.shadowBlur = 15;
      drawCircle(target.x, target.y, target.radius, target.color);
      c.shadowBlur = 0;
    }

    // Draw particles
    particles.render(c);

    // Draw player with glow
    c.shadowColor = '#00d4ff';
    c.shadowBlur = 20;
    drawCircle(player.current.x, player.current.y, CONFIG.playerSize, '#ffffff');
    c.shadowBlur = 0;

    c.restore();

    // Draw HUD (outside shake transform)
    drawText(`Score: ${score}`, 20, 25, {
      color: '#00d4ff',
      font: 'bold 24px system-ui',
    });

    if (highScore > 0) {
      drawText(`Best: ${highScore}`, 20, 55, {
        color: '#8b8b9e',
        font: '16px system-ui',
      });
    }

    drawText('Arrow keys / WASD to move • Click/tap to move toward pointer', width / 2, height - 20, {
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
        {state === GameState.IDLE && (
          <div className={styles.overlay}>
            <h2>If you build it, they will come</h2>
            <p className={styles.subtitle}>Collect the glowing orbs!</p>
            <button onClick={handlePlay}>Start Game</button>
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
            {result.score !== undefined && (
              <p className={styles.score}>Score: {result.score}</p>
            )}
            {result.highScore !== undefined && result.highScore > (result.score ?? 0) && (
              <p className={styles.highScore}>Best: {result.highScore}</p>
            )}
            <button onClick={handlePlay}>Play Again</button>
          </div>
        )}

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

      <GameControls
        state={state}
        onPause={pause}
        onResume={resume}
        onReset={reset}
      />
    </div>
  );
}
