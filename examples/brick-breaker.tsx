/**
 * BRICK BREAKER
 *
 * A complete example game demonstrating:
 * - Mouse/touch paddle control
 * - Ball physics with bouncing
 * - Breakable bricks with colors
 * - Particles on brick destruction
 * - Power-ups (multi-ball, wide paddle)
 * - Synthesized sounds
 *
 * Copy this file to components/game/Game.tsx to use it.
 */

'use client';

import { useRef, useCallback } from 'react';
import { useGameState } from '@/lib/hooks/useGameState';
import { useGameLoop } from '@/lib/hooks/useGameLoop';
import { useMouse } from '@/lib/hooks/useMouse';
import { useCanvas } from '@/lib/hooks/useCanvas';
import { useParticles } from '@/lib/hooks/useParticles';
import { useScreenShake } from '@/lib/hooks/useScreenShake';
import { useSynthSound } from '@/lib/hooks/useSound';
import { GameState } from '@/lib/types';
import { clamp, rectsCollide, generateId } from '@/lib/utils';
import GameWindow from '@/components/game/GameWindow';
import GameControls from '@/components/game/GameControls';
import styles from '@/components/game/Game.module.css';

// =============================================================================
// GAME CONFIGURATION
// =============================================================================

const CONFIG = {
  width: 600,
  height: 700,
  paddleWidth: 100,
  paddleHeight: 15,
  paddleY: 650,
  ballRadius: 8,
  ballSpeed: 400,
  brickRows: 6,
  brickCols: 10,
  brickWidth: 54,
  brickHeight: 20,
  brickPadding: 4,
  brickOffsetTop: 60,
  brickOffsetLeft: 22,
};

// =============================================================================
// GAME STATE TYPES
// =============================================================================

interface Paddle {
  x: number;
  width: number;
}

interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Brick {
  id: string;
  x: number;
  y: number;
  color: string;
  health: number;
  active: boolean;
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

  const { canvasRef, containerRef, scale, width, height, clear, ctx } = useCanvas(CONFIG);
  const mouse = useMouse(canvasRef as React.RefObject<HTMLElement>);
  const particles = useParticles();
  const shake = useScreenShake();
  const sound = useSynthSound();

  // Game state refs
  const paddle = useRef<Paddle>({ x: CONFIG.width / 2, width: CONFIG.paddleWidth });
  const balls = useRef<Ball[]>([]);
  const bricks = useRef<Brick[]>([]);
  const lives = useRef(3);
  const level = useRef(1);
  const combo = useRef(0);

  // Initialize bricks
  const initBricks = useCallback(() => {
    const colors = ['#ff4444', '#ff8844', '#ffcc44', '#44ff44', '#44ccff', '#aa44ff'];
    bricks.current = [];

    for (let row = 0; row < CONFIG.brickRows; row++) {
      for (let col = 0; col < CONFIG.brickCols; col++) {
        bricks.current.push({
          id: generateId(),
          x: CONFIG.brickOffsetLeft + col * (CONFIG.brickWidth + CONFIG.brickPadding),
          y: CONFIG.brickOffsetTop + row * (CONFIG.brickHeight + CONFIG.brickPadding),
          color: colors[row % colors.length],
          health: row < 2 ? 2 : 1,
          active: true,
        });
      }
    }
  }, []);

  // Spawn initial ball
  const spawnBall = useCallback(() => {
    balls.current.push({
      id: generateId(),
      x: CONFIG.width / 2,
      y: CONFIG.paddleY - 30,
      vx: (Math.random() - 0.5) * CONFIG.ballSpeed * 0.5,
      vy: -CONFIG.ballSpeed,
      radius: CONFIG.ballRadius,
    });
  }, []);

  // Reset game state
  const resetGameState = useCallback(() => {
    paddle.current = { x: CONFIG.width / 2, width: CONFIG.paddleWidth };
    balls.current = [];
    lives.current = 3;
    level.current = 1;
    combo.current = 0;
    particles.clear();
    initBricks();
    spawnBall();
  }, [particles, initBricks, spawnBall]);

  const handlePlay = useCallback(() => {
    resetGameState();
    play();
  }, [resetGameState, play]);

  // Game loop
  useGameLoop((deltaTime) => {
    const dt = deltaTime / 1000;
    const p = paddle.current;

    // --- INPUT: Move paddle with mouse ---
    p.x = clamp(mouse.position.x, p.width / 2, CONFIG.width - p.width / 2);

    // --- UPDATE BALLS ---
    balls.current = balls.current.filter(ball => {
      // Move ball
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      // Wall collisions
      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx);
        sound.beep(300, 50, 0.1);
      }
      if (ball.x + ball.radius > CONFIG.width) {
        ball.x = CONFIG.width - ball.radius;
        ball.vx = -Math.abs(ball.vx);
        sound.beep(300, 50, 0.1);
      }
      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy);
        sound.beep(300, 50, 0.1);
      }

      // Paddle collision
      const paddleRect = {
        x: p.x - p.width / 2,
        y: CONFIG.paddleY,
        width: p.width,
        height: CONFIG.paddleHeight,
      };
      const ballRect = {
        x: ball.x - ball.radius,
        y: ball.y - ball.radius,
        width: ball.radius * 2,
        height: ball.radius * 2,
      };

      if (ball.vy > 0 && rectsCollide(ballRect, paddleRect)) {
        ball.y = CONFIG.paddleY - ball.radius;
        ball.vy = -Math.abs(ball.vy);

        // Angle based on where ball hits paddle
        const hitPos = (ball.x - p.x) / (p.width / 2);
        ball.vx = hitPos * CONFIG.ballSpeed * 0.8;

        // Speed up slightly
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        const newSpeed = Math.min(speed * 1.02, CONFIG.ballSpeed * 1.5);
        const angle = Math.atan2(ball.vy, ball.vx);
        ball.vx = Math.cos(angle) * newSpeed;
        ball.vy = Math.sin(angle) * newSpeed;

        sound.beep(500, 50, 0.2);
        combo.current = 0;
        particles.emit(ball.x, ball.y, { count: 5, colors: ['#00d4ff'], life: 200 });
      }

      // Ball fell off bottom
      if (ball.y > CONFIG.height + ball.radius) {
        return false; // Remove ball
      }

      return true;
    });

    // Check if all balls lost
    if (balls.current.length === 0) {
      lives.current--;
      combo.current = 0;

      if (lives.current <= 0) {
        sound.gameOver();
        shake.shakeLarge();
        end({ score, level: level.current });
        return;
      }

      // Respawn ball
      spawnBall();
    }

    // --- BRICK COLLISIONS ---
    for (const ball of balls.current) {
      for (const brick of bricks.current) {
        if (!brick.active) continue;

        const brickRect = {
          x: brick.x,
          y: brick.y,
          width: CONFIG.brickWidth,
          height: CONFIG.brickHeight,
        };
        const ballRect = {
          x: ball.x - ball.radius,
          y: ball.y - ball.radius,
          width: ball.radius * 2,
          height: ball.radius * 2,
        };

        if (rectsCollide(ballRect, brickRect)) {
          // Determine collision side
          const overlapLeft = (ball.x + ball.radius) - brick.x;
          const overlapRight = (brick.x + CONFIG.brickWidth) - (ball.x - ball.radius);
          const overlapTop = (ball.y + ball.radius) - brick.y;
          const overlapBottom = (brick.y + CONFIG.brickHeight) - (ball.y - ball.radius);

          const minOverlapX = Math.min(overlapLeft, overlapRight);
          const minOverlapY = Math.min(overlapTop, overlapBottom);

          if (minOverlapX < minOverlapY) {
            ball.vx = -ball.vx;
          } else {
            ball.vy = -ball.vy;
          }

          brick.health--;
          if (brick.health <= 0) {
            brick.active = false;
            combo.current++;
            const points = 10 * combo.current;
            addScore(points);

            sound.coin();
            shake.shakeSmall();
            particles.explode(brick.x + CONFIG.brickWidth / 2, brick.y + CONFIG.brickHeight / 2, {
              count: 12,
              colors: [brick.color, '#ffffff'],
            });
          } else {
            sound.hit();
            particles.emit(ball.x, ball.y, { count: 5, colors: [brick.color] });
          }

          break; // Only one brick collision per frame
        }
      }
    }

    // Check win condition
    const activeBricks = bricks.current.filter(b => b.active).length;
    if (activeBricks === 0) {
      level.current++;
      sound.powerup();
      shake.shakeMedium();
      initBricks();
      balls.current = [];
      spawnBall();
      paddle.current.width = CONFIG.paddleWidth; // Reset paddle size
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
    clear('#0a0a15');

    // Bricks
    for (const brick of bricks.current) {
      if (!brick.active) continue;

      c.fillStyle = brick.color;
      c.fillRect(brick.x, brick.y, CONFIG.brickWidth, CONFIG.brickHeight);

      // Brick highlight
      c.fillStyle = 'rgba(255, 255, 255, 0.3)';
      c.fillRect(brick.x, brick.y, CONFIG.brickWidth, 3);

      // Show health indicator for multi-hit bricks
      if (brick.health > 1) {
        c.fillStyle = 'rgba(0, 0, 0, 0.3)';
        c.fillRect(brick.x, brick.y, CONFIG.brickWidth, CONFIG.brickHeight);
      }
    }

    // Paddle
    c.fillStyle = '#00d4ff';
    c.fillRect(p.x - p.width / 2, CONFIG.paddleY, p.width, CONFIG.paddleHeight);
    // Paddle highlight
    c.fillStyle = 'rgba(255, 255, 255, 0.5)';
    c.fillRect(p.x - p.width / 2, CONFIG.paddleY, p.width, 3);

    // Balls
    c.fillStyle = '#ffffff';
    for (const ball of balls.current) {
      c.beginPath();
      c.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      c.fill();

      // Ball glow
      c.shadowColor = '#00d4ff';
      c.shadowBlur = 10;
      c.beginPath();
      c.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
    }

    // Particles
    particles.render(c);

    c.restore();

    // HUD
    c.fillStyle = '#ffffff';
    c.font = 'bold 20px system-ui';
    c.textAlign = 'left';
    c.fillText(`Score: ${score}`, 20, 30);
    c.textAlign = 'center';
    c.fillText(`Level ${level.current}`, CONFIG.width / 2, 30);
    c.textAlign = 'right';

    // Lives
    for (let i = 0; i < lives.current; i++) {
      c.fillStyle = '#00d4ff';
      c.beginPath();
      c.arc(CONFIG.width - 20 - i * 25, 25, 8, 0, Math.PI * 2);
      c.fill();
    }

    // Combo
    if (combo.current > 1) {
      c.fillStyle = '#ffaa00';
      c.font = 'bold 16px system-ui';
      c.textAlign = 'center';
      c.fillText(`${combo.current}x COMBO!`, CONFIG.width / 2, 50);
    }

  }, isPlaying);

  return (
    <div className={styles.container}>
      <GameWindow>
        {state === GameState.IDLE && (
          <div className={styles.overlay}>
            <h2>Brick Breaker</h2>
            <p className={styles.subtitle}>Move mouse/finger to control paddle!</p>
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
            <p className={styles.subtitle}>Reached Level {result.level}</p>
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
