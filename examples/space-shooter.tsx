/**
 * SPACE SHOOTER
 *
 * A complete example game demonstrating:
 * - Keyboard movement (arrows/WASD)
 * - Shooting with spacebar
 * - Enemy waves with increasing difficulty
 * - Particles and screen shake
 * - Power-ups
 * - Synthesized sounds
 *
 * Copy this file to components/game/Game.tsx to use it.
 */

'use client';

import { useRef, useCallback } from 'react';
import { useGameState } from '@/lib/hooks/useGameState';
import { useGameLoop } from '@/lib/hooks/useGameLoop';
import { useKeyboard } from '@/lib/hooks/useKeyboard';
import { useCanvas } from '@/lib/hooks/useCanvas';
import { useParticles } from '@/lib/hooks/useParticles';
import { useScreenShake } from '@/lib/hooks/useScreenShake';
import { useSynthSound } from '@/lib/hooks/useSound';
import { GameState } from '@/lib/types';
import { clamp, rectsCollide, random, randomInt, generateId } from '@/lib/utils';
import GameWindow from '@/components/game/GameWindow';
import GameControls from '@/components/game/GameControls';
import styles from '@/components/game/Game.module.css';

// =============================================================================
// GAME CONFIGURATION
// =============================================================================

const CONFIG = {
  width: 600,
  height: 800,
  playerSpeed: 400,
  playerWidth: 40,
  playerHeight: 30,
  bulletSpeed: 600,
  bulletWidth: 4,
  bulletHeight: 12,
  fireRate: 150,
  enemySpeed: 150,
  enemySpawnRate: 800,
  powerupChance: 0.1,
};

// =============================================================================
// GAME STATE TYPES
// =============================================================================

interface Player {
  x: number;
  y: number;
  lives: number;
  powerLevel: number;
  invincible: number;
}

interface Bullet {
  id: string;
  x: number;
  y: number;
  vy: number;
  isEnemy: boolean;
}

interface Enemy {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  type: 'basic' | 'fast' | 'big';
}

interface Powerup {
  id: string;
  x: number;
  y: number;
  type: 'power' | 'life';
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
  const { canvasRef, containerRef, scale, width, height, clear, ctx } = useCanvas(CONFIG);
  const particles = useParticles();
  const shake = useScreenShake();
  const sound = useSynthSound();

  // Game state refs
  const player = useRef<Player>({
    x: CONFIG.width / 2,
    y: CONFIG.height - 80,
    lives: 3,
    powerLevel: 1,
    invincible: 0,
  });
  const bullets = useRef<Bullet[]>([]);
  const enemies = useRef<Enemy[]>([]);
  const powerups = useRef<Powerup[]>([]);
  const lastFire = useRef(0);
  const lastSpawn = useRef(0);
  const difficulty = useRef(1);
  const stars = useRef<{ x: number; y: number; speed: number }[]>([]);

  // Initialize stars
  const initStars = useCallback(() => {
    stars.current = [];
    for (let i = 0; i < 50; i++) {
      stars.current.push({
        x: random(0, CONFIG.width),
        y: random(0, CONFIG.height),
        speed: random(50, 150),
      });
    }
  }, []);

  // Reset game state
  const resetGameState = useCallback(() => {
    player.current = {
      x: CONFIG.width / 2,
      y: CONFIG.height - 80,
      lives: 3,
      powerLevel: 1,
      invincible: 0,
    };
    bullets.current = [];
    enemies.current = [];
    powerups.current = [];
    lastFire.current = 0;
    lastSpawn.current = 0;
    difficulty.current = 1;
    particles.clear();
    initStars();
  }, [particles, initStars]);

  const handlePlay = useCallback(() => {
    resetGameState();
    play();
  }, [resetGameState, play]);

  // Fire bullet
  const fire = useCallback(() => {
    const p = player.current;
    sound.laser();

    if (p.powerLevel >= 3) {
      // Triple shot
      bullets.current.push(
        { id: generateId(), x: p.x - 15, y: p.y - 20, vy: -CONFIG.bulletSpeed, isEnemy: false },
        { id: generateId(), x: p.x, y: p.y - 20, vy: -CONFIG.bulletSpeed, isEnemy: false },
        { id: generateId(), x: p.x + 15, y: p.y - 20, vy: -CONFIG.bulletSpeed, isEnemy: false }
      );
    } else if (p.powerLevel >= 2) {
      // Double shot
      bullets.current.push(
        { id: generateId(), x: p.x - 10, y: p.y - 20, vy: -CONFIG.bulletSpeed, isEnemy: false },
        { id: generateId(), x: p.x + 10, y: p.y - 20, vy: -CONFIG.bulletSpeed, isEnemy: false }
      );
    } else {
      bullets.current.push(
        { id: generateId(), x: p.x, y: p.y - 20, vy: -CONFIG.bulletSpeed, isEnemy: false }
      );
    }
  }, [sound]);

  // Spawn enemy
  const spawnEnemy = useCallback(() => {
    const types: Enemy['type'][] = ['basic', 'basic', 'fast', 'big'];
    const type = types[randomInt(0, Math.min(types.length - 1, Math.floor(difficulty.current)))];

    let enemy: Enemy;
    switch (type) {
      case 'fast':
        enemy = { id: generateId(), x: random(30, CONFIG.width - 30), y: -30, width: 25, height: 25, health: 1, type };
        break;
      case 'big':
        enemy = { id: generateId(), x: random(40, CONFIG.width - 40), y: -50, width: 50, height: 50, health: 3, type };
        break;
      default:
        enemy = { id: generateId(), x: random(25, CONFIG.width - 25), y: -30, width: 30, height: 30, health: 1, type };
    }
    enemies.current.push(enemy);
  }, []);

  // Game loop
  useGameLoop((deltaTime) => {
    const dt = deltaTime / 1000;
    const p = player.current;

    // --- INPUT ---
    const speed = CONFIG.playerSpeed * dt;
    if (isPressed('ArrowLeft') || isPressed('KeyA')) p.x -= speed;
    if (isPressed('ArrowRight') || isPressed('KeyD')) p.x += speed;
    if (isPressed('ArrowUp') || isPressed('KeyW')) p.y -= speed;
    if (isPressed('ArrowDown') || isPressed('KeyS')) p.y += speed;

    // Clamp player position
    p.x = clamp(p.x, CONFIG.playerWidth / 2, CONFIG.width - CONFIG.playerWidth / 2);
    p.y = clamp(p.y, CONFIG.height / 2, CONFIG.height - CONFIG.playerHeight / 2);

    // Firing
    lastFire.current += deltaTime;
    if (isPressed('Space') && lastFire.current >= CONFIG.fireRate) {
      fire();
      lastFire.current = 0;
    }

    // Update invincibility
    if (p.invincible > 0) p.invincible -= deltaTime;

    // --- SPAWN ENEMIES ---
    lastSpawn.current += deltaTime;
    const spawnRate = CONFIG.enemySpawnRate / difficulty.current;
    if (lastSpawn.current >= spawnRate) {
      spawnEnemy();
      lastSpawn.current = 0;
    }

    // Increase difficulty over time
    difficulty.current = 1 + score / 500;

    // --- UPDATE STARS ---
    for (const star of stars.current) {
      star.y += star.speed * dt;
      if (star.y > CONFIG.height) {
        star.y = 0;
        star.x = random(0, CONFIG.width);
      }
    }

    // --- UPDATE BULLETS ---
    bullets.current = bullets.current.filter(b => {
      b.y += b.vy * dt;
      return b.y > -20 && b.y < CONFIG.height + 20;
    });

    // --- UPDATE ENEMIES ---
    enemies.current = enemies.current.filter(e => {
      const speed = e.type === 'fast' ? CONFIG.enemySpeed * 1.5 : CONFIG.enemySpeed;
      e.y += speed * dt * difficulty.current;

      // Enemy passed bottom
      if (e.y > CONFIG.height + 50) {
        return false;
      }

      return true;
    });

    // --- UPDATE POWERUPS ---
    powerups.current = powerups.current.filter(pu => {
      pu.y += 100 * dt;
      return pu.y < CONFIG.height + 30;
    });

    // --- COLLISION: BULLETS vs ENEMIES ---
    for (const bullet of bullets.current) {
      if (bullet.isEnemy) continue;

      for (const enemy of enemies.current) {
        const bulletRect = { x: bullet.x - CONFIG.bulletWidth / 2, y: bullet.y - CONFIG.bulletHeight / 2, width: CONFIG.bulletWidth, height: CONFIG.bulletHeight };
        const enemyRect = { x: enemy.x - enemy.width / 2, y: enemy.y - enemy.height / 2, width: enemy.width, height: enemy.height };

        if (rectsCollide(bulletRect, enemyRect)) {
          bullet.vy = 0; // Mark for removal
          bullet.y = -100;
          enemy.health--;

          if (enemy.health <= 0) {
            // Destroy enemy
            sound.explosion();
            shake.shakeSmall();
            particles.explode(enemy.x, enemy.y, {
              count: 15,
              colors: ['#ff4444', '#ff8800', '#ffff00'],
            });
            addScore(enemy.type === 'big' ? 30 : enemy.type === 'fast' ? 20 : 10);

            // Maybe spawn powerup
            if (Math.random() < CONFIG.powerupChance) {
              powerups.current.push({
                id: generateId(),
                x: enemy.x,
                y: enemy.y,
                type: Math.random() < 0.3 ? 'life' : 'power',
              });
            }

            enemy.y = -1000; // Mark for removal
          } else {
            sound.hit();
            particles.emit(bullet.x, bullet.y, { count: 3, colors: ['#ffffff'] });
          }
        }
      }
    }

    // Clean up destroyed enemies
    enemies.current = enemies.current.filter(e => e.y > -500);
    bullets.current = bullets.current.filter(b => b.y > -50);

    // --- COLLISION: PLAYER vs ENEMIES ---
    if (p.invincible <= 0) {
      const playerRect = {
        x: p.x - CONFIG.playerWidth / 2,
        y: p.y - CONFIG.playerHeight / 2,
        width: CONFIG.playerWidth,
        height: CONFIG.playerHeight,
      };

      for (const enemy of enemies.current) {
        const enemyRect = { x: enemy.x - enemy.width / 2, y: enemy.y - enemy.height / 2, width: enemy.width, height: enemy.height };

        if (rectsCollide(playerRect, enemyRect)) {
          p.lives--;
          p.powerLevel = Math.max(1, p.powerLevel - 1);
          p.invincible = 2000;
          sound.hit();
          shake.shakeMedium();
          particles.explode(p.x, p.y, { count: 10, colors: ['#00d4ff', '#ffffff'] });

          // Remove enemy
          enemy.y = -1000;

          if (p.lives <= 0) {
            sound.gameOver();
            shake.shakeLarge();
            particles.explode(p.x, p.y, { count: 50, colors: ['#00d4ff', '#00ff88', '#ffffff'] });
            end({ score });
            return;
          }
        }
      }
    }

    // --- COLLISION: PLAYER vs POWERUPS ---
    const playerRect = {
      x: p.x - CONFIG.playerWidth / 2,
      y: p.y - CONFIG.playerHeight / 2,
      width: CONFIG.playerWidth,
      height: CONFIG.playerHeight,
    };

    powerups.current = powerups.current.filter(pu => {
      const puRect = { x: pu.x - 15, y: pu.y - 15, width: 30, height: 30 };

      if (rectsCollide(playerRect, puRect)) {
        if (pu.type === 'power') {
          p.powerLevel = Math.min(3, p.powerLevel + 1);
          sound.powerup();
        } else {
          p.lives = Math.min(5, p.lives + 1);
          sound.coin();
        }
        particles.sparkle(pu.x, pu.y);
        return false;
      }
      return true;
    });

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

    // Stars
    c.fillStyle = '#ffffff';
    for (const star of stars.current) {
      c.globalAlpha = 0.3 + star.speed / 200;
      c.fillRect(star.x, star.y, 2, 2);
    }
    c.globalAlpha = 1;

    // Powerups
    for (const pu of powerups.current) {
      c.fillStyle = pu.type === 'power' ? '#ffaa00' : '#00ff88';
      c.beginPath();
      c.arc(pu.x, pu.y, 12, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#ffffff';
      c.font = 'bold 14px system-ui';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(pu.type === 'power' ? 'P' : '+', pu.x, pu.y);
    }

    // Enemies
    for (const enemy of enemies.current) {
      const colors = { basic: '#ff4444', fast: '#ff8800', big: '#aa00ff' };
      c.fillStyle = colors[enemy.type];
      c.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height);
    }

    // Bullets
    c.fillStyle = '#00d4ff';
    for (const bullet of bullets.current) {
      if (!bullet.isEnemy) {
        c.fillRect(bullet.x - CONFIG.bulletWidth / 2, bullet.y - CONFIG.bulletHeight / 2, CONFIG.bulletWidth, CONFIG.bulletHeight);
      }
    }

    // Player
    if (p.invincible <= 0 || Math.floor(p.invincible / 100) % 2 === 0) {
      c.fillStyle = '#00d4ff';
      c.beginPath();
      c.moveTo(p.x, p.y - CONFIG.playerHeight / 2);
      c.lineTo(p.x - CONFIG.playerWidth / 2, p.y + CONFIG.playerHeight / 2);
      c.lineTo(p.x + CONFIG.playerWidth / 2, p.y + CONFIG.playerHeight / 2);
      c.closePath();
      c.fill();

      // Engine glow
      c.fillStyle = '#00ff88';
      c.beginPath();
      c.moveTo(p.x - 8, p.y + CONFIG.playerHeight / 2);
      c.lineTo(p.x, p.y + CONFIG.playerHeight / 2 + 10 + Math.random() * 5);
      c.lineTo(p.x + 8, p.y + CONFIG.playerHeight / 2);
      c.closePath();
      c.fill();
    }

    // Particles
    particles.render(c);

    c.restore();

    // HUD
    c.fillStyle = '#ffffff';
    c.font = 'bold 24px system-ui';
    c.textAlign = 'left';
    c.fillText(`Score: ${score}`, 20, 35);

    // Lives
    c.fillStyle = '#ff4444';
    for (let i = 0; i < p.lives; i++) {
      c.beginPath();
      c.arc(CONFIG.width - 30 - i * 25, 30, 8, 0, Math.PI * 2);
      c.fill();
    }

    // Power level
    c.fillStyle = '#ffaa00';
    c.font = '16px system-ui';
    c.textAlign = 'right';
    c.fillText(`Power: ${'★'.repeat(p.powerLevel)}`, CONFIG.width - 20, 60);

  }, isPlaying);

  return (
    <div className={styles.container}>
      <GameWindow>
        {state === GameState.IDLE && (
          <div className={styles.overlay}>
            <h2>Space Shooter</h2>
            <p className={styles.subtitle}>Arrow keys to move, Space to shoot!</p>
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
