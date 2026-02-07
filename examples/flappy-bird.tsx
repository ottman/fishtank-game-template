/**
 * FLAPPY BIRD CLONE
 *
 * A complete example game demonstrating:
 * - Tap/click/space to jump
 * - Gravity and physics
 * - Pipe obstacles with gap
 * - Score tracking
 * - Particles and screen shake
 * - Synthesized sounds
 *
 * Copy this file to components/game/Game.tsx to use it.
 */

'use client';

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
import { clamp, rectsCollide } from '@/lib/utils';
import GameWindow from '@/components/game/GameWindow';
import GameControls from '@/components/game/GameControls';
import styles from '@/components/game/Game.module.css';

// =============================================================================
// GAME CONFIGURATION
// =============================================================================

const CONFIG = {
  width: 400,
  height: 600,
  gravity: 1500,
  jumpForce: -400,
  pipeSpeed: 200,
  pipeWidth: 60,
  pipeGap: 150,
  pipeSpawnInterval: 1500,
  birdSize: 24,
  birdX: 80,
};

// =============================================================================
// GAME STATE TYPES
// =============================================================================

interface Bird {
  y: number;
  vy: number;
  rotation: number;
}

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

// =============================================================================
// MAIN GAME COMPONENT
// =============================================================================

export default function Game() {
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

  const { isPressed } = useKeyboard();
  const { canvasRef, containerRef, scale, width, height, clear, drawRect, drawCircle, drawText, ctx } = useCanvas(CONFIG);
  const mouse = useMouse(canvasRef as React.RefObject<HTMLElement>);
  const particles = useParticles();
  const shake = useScreenShake();
  const sound = useSynthSound();

  // Game state refs
  const bird = useRef<Bird>({ y: CONFIG.height / 2, vy: 0, rotation: 0 });
  const pipes = useRef<Pipe[]>([]);
  const lastPipeSpawn = useRef(0);
  const justJumped = useRef(false);

  // Reset game state
  const resetGameState = useCallback(() => {
    bird.current = { y: CONFIG.height / 2, vy: 0, rotation: 0 };
    pipes.current = [];
    lastPipeSpawn.current = 0;
    justJumped.current = false;
    particles.clear();
  }, [particles]);

  const handlePlay = useCallback(() => {
    resetGameState();
    play();
  }, [resetGameState, play]);

  // Jump logic
  const jump = useCallback(() => {
    if (!isPlaying) return;
    bird.current.vy = CONFIG.jumpForce;
    sound.jump();
    // Trail particles on jump
    particles.emit(CONFIG.birdX, bird.current.y, {
      count: 5,
      colors: ['#ffff00', '#ffffff'],
      speedMin: 20,
      speedMax: 50,
      direction: Math.PI,
      spread: Math.PI / 4,
      life: 200,
      gravity: 0,
    });
  }, [isPlaying, sound, particles]);

  // Game loop
  useGameLoop((deltaTime) => {
    const dt = deltaTime / 1000;

    // --- INPUT ---
    const jumpPressed = isPressed('Space') || isPressed('ArrowUp') || isPressed('KeyW') || mouse.justPressed;
    if (jumpPressed && !justJumped.current) {
      jump();
      justJumped.current = true;
    }
    if (!jumpPressed) {
      justJumped.current = false;
    }

    // --- UPDATE BIRD ---
    bird.current.vy += CONFIG.gravity * dt;
    bird.current.y += bird.current.vy * dt;
    bird.current.rotation = clamp(bird.current.vy / 400, -0.5, 0.5) * Math.PI / 4;

    // --- SPAWN PIPES ---
    lastPipeSpawn.current += deltaTime;
    if (lastPipeSpawn.current >= CONFIG.pipeSpawnInterval) {
      const gapY = 100 + Math.random() * (CONFIG.height - 200 - CONFIG.pipeGap);
      pipes.current.push({ x: CONFIG.width, gapY, passed: false });
      lastPipeSpawn.current = 0;
    }

    // --- UPDATE PIPES ---
    pipes.current = pipes.current.filter(pipe => {
      pipe.x -= CONFIG.pipeSpeed * dt;

      // Score when passing pipe
      if (!pipe.passed && pipe.x + CONFIG.pipeWidth < CONFIG.birdX) {
        pipe.passed = true;
        addScore(1);
        sound.coin();
        particles.sparkle(CONFIG.birdX, bird.current.y);
      }

      return pipe.x > -CONFIG.pipeWidth;
    });

    // --- COLLISION DETECTION ---
    const birdRect = {
      x: CONFIG.birdX - CONFIG.birdSize / 2,
      y: bird.current.y - CONFIG.birdSize / 2,
      width: CONFIG.birdSize,
      height: CONFIG.birdSize,
    };

    // Ground/ceiling collision
    if (bird.current.y < CONFIG.birdSize / 2 || bird.current.y > CONFIG.height - CONFIG.birdSize / 2) {
      sound.explosion();
      shake.shakeLarge();
      particles.explode(CONFIG.birdX, bird.current.y, { colors: ['#ffff00', '#ff8800', '#ff0000'] });
      end({ score });
      return;
    }

    // Pipe collision
    for (const pipe of pipes.current) {
      const topPipe = { x: pipe.x, y: 0, width: CONFIG.pipeWidth, height: pipe.gapY };
      const bottomPipe = { x: pipe.x, y: pipe.gapY + CONFIG.pipeGap, width: CONFIG.pipeWidth, height: CONFIG.height };

      if (rectsCollide(birdRect, topPipe) || rectsCollide(birdRect, bottomPipe)) {
        sound.explosion();
        shake.shakeLarge();
        particles.explode(CONFIG.birdX, bird.current.y, { colors: ['#ffff00', '#ff8800', '#ff0000'] });
        end({ score });
        return;
      }
    }

    // --- UPDATE EFFECTS ---
    particles.update(deltaTime);
    shake.update(deltaTime);

    // --- RENDER ---
    const c = ctx;
    if (!c) return;

    c.save();
    shake.apply(c);

    // Background
    clear('#1a1a2e');

    // Pipes
    c.fillStyle = '#00ff88';
    for (const pipe of pipes.current) {
      // Top pipe
      c.fillRect(pipe.x, 0, CONFIG.pipeWidth, pipe.gapY);
      // Bottom pipe
      c.fillRect(pipe.x, pipe.gapY + CONFIG.pipeGap, CONFIG.pipeWidth, CONFIG.height);
      // Pipe caps
      c.fillStyle = '#00cc66';
      c.fillRect(pipe.x - 4, pipe.gapY - 20, CONFIG.pipeWidth + 8, 20);
      c.fillRect(pipe.x - 4, pipe.gapY + CONFIG.pipeGap, CONFIG.pipeWidth + 8, 20);
      c.fillStyle = '#00ff88';
    }

    // Bird
    c.save();
    c.translate(CONFIG.birdX, bird.current.y);
    c.rotate(bird.current.rotation);
    c.fillStyle = '#ffdd00';
    c.beginPath();
    c.arc(0, 0, CONFIG.birdSize / 2, 0, Math.PI * 2);
    c.fill();
    // Eye
    c.fillStyle = '#000000';
    c.beginPath();
    c.arc(6, -4, 4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(7, -5, 2, 0, Math.PI * 2);
    c.fill();
    // Beak
    c.fillStyle = '#ff6600';
    c.beginPath();
    c.moveTo(CONFIG.birdSize / 2, 0);
    c.lineTo(CONFIG.birdSize / 2 + 10, 4);
    c.lineTo(CONFIG.birdSize / 2, 8);
    c.closePath();
    c.fill();
    c.restore();

    // Particles
    particles.render(c);

    // Ground
    c.fillStyle = '#2a2a4e';
    c.fillRect(0, CONFIG.height - 2, CONFIG.width, 2);

    c.restore();

    // Score (outside shake transform)
    drawText(`${score}`, CONFIG.width / 2, 50, {
      color: '#ffffff',
      font: 'bold 48px system-ui',
      align: 'center',
    });

  }, isPlaying);

  return (
    <div className={styles.container}>
      <GameWindow>
        {state === GameState.IDLE && (
          <div className={styles.overlay}>
            <h2>Flappy Bird</h2>
            <p className={styles.subtitle}>Tap or press Space to fly!</p>
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
            <p className={styles.score}>Score: {result.score}</p>
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

      <GameControls state={state} onPause={pause} onResume={resume} onReset={reset} />
    </div>
  );
}
