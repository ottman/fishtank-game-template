# Fishtank Game Template - AI Instructions

You are building a client-side browser game using the Fishtank game template. This is a Next.js app with canvas-based rendering, particle effects, screen shake, and synthesized audio.

## Architecture

- **Pure client-side** - No backend, no database, no API calls during gameplay
- **Canvas rendering** - Games draw to an HTML5 canvas at 60fps
- **Iframe embedded** - Games run inside fishtank's arcade iframe
- **Juicy by default** - Particles, screen shake, and sounds built-in

## Example Games

Study these complete implementations in the `examples/` folder:

| Example | File | Input | Features |
|---------|------|-------|----------|
| **Flappy Bird** | `flappy-bird.tsx` | Tap/Space | Gravity, pipes, particle trails |
| **Space Shooter** | `space-shooter.tsx` | WASD + Space | Enemies, power-ups, bullet patterns |
| **Brick Breaker** | `brick-breaker.tsx` | Mouse | Ball physics, paddle, combos |

Copy any example to `components/game/Game.tsx` to use it.

## Key Files

| File | Purpose |
|------|---------|
| `components/game/Game.tsx` | **MAIN FILE** - All game logic goes here |
| `lib/hooks/useGameState.ts` | Game lifecycle (play, pause, end, score) |
| `lib/hooks/useGameLoop.ts` | 60fps loop with delta time |
| `lib/hooks/useKeyboard.ts` | Keyboard input |
| `lib/hooks/useMouse.ts` | Mouse/touch input |
| `lib/hooks/useCanvas.ts` | Canvas drawing helpers |
| `lib/hooks/useParticles.ts` | Particle effects |
| `lib/hooks/useScreenShake.ts` | Screen shake |
| `lib/hooks/useSound.ts` | Synthesized sounds |
| `lib/utils.ts` | Collision, math, vector utilities |
| `lib/types.ts` | TypeScript interfaces |

## Quick Start Template

```typescript
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
import { clamp, circlesCollide, random } from '@/lib/utils';

const CONFIG = {
  width: 800,
  height: 600,
  // Add your config here
};

export default function Game() {
  const { state, score, play, pause, resume, reset, end, addScore, isPlaying } = useGameState();
  const { isPressed } = useKeyboard();
  const { canvasRef, containerRef, scale, clear, drawCircle, drawRect, drawText, ctx } = useCanvas(CONFIG);
  const mouse = useMouse(canvasRef);
  const particles = useParticles();
  const shake = useScreenShake();
  const sound = useSynthSound();

  // Game state (useRef for frame-by-frame data)
  const player = useRef({ x: 400, y: 300 });

  useGameLoop((deltaTime) => {
    const dt = deltaTime / 1000;

    // 1. INPUT
    if (isPressed('Space')) { /* action */ }

    // 2. UPDATE
    player.current.x += 100 * dt;

    // 3. EFFECTS
    particles.update(deltaTime);
    shake.update(deltaTime);

    // 4. RENDER
    ctx.save();
    shake.apply(ctx);
    clear('#0a0a15');
    drawCircle(player.current.x, player.current.y, 20, '#ffffff');
    particles.render(ctx);
    ctx.restore();

  }, isPlaying);

  // ... rest of component
}
```

## Particle System

```typescript
const particles = useParticles();

// Explosion - great for destroying enemies/collectibles
particles.explode(x, y, {
  count: 20,
  colors: ['#ff4444', '#ffaa00', '#ffffff'],
  speedMin: 100,
  speedMax: 300,
});

// Trail - for moving objects
particles.trail(x, y, {
  colors: ['#00d4ff'],
  gravity: 0,
});

// Sparkle - upward burst for pickups
particles.sparkle(x, y);

// Custom emit
particles.emit(x, y, {
  count: 10,
  colors: ['#ffffff'],
  speedMin: 50,
  speedMax: 200,
  life: 500,
  gravity: 200,
  direction: Math.PI / 2,  // down
  spread: Math.PI / 4,     // cone width
  shrink: true,
  fade: true,
});

// In game loop
particles.update(deltaTime);
particles.render(ctx);
```

## Screen Shake

```typescript
const shake = useScreenShake();

// Preset shakes
shake.shakeSmall();   // Light tap
shake.shakeMedium();  // Hit
shake.shakeLarge();   // Explosion

// Custom shake
shake.shake({ intensity: 15, duration: 300 });

// In game loop
shake.update(deltaTime);
ctx.save();
shake.apply(ctx);
// ... render game ...
ctx.restore();
```

## Synthesized Sounds

No audio files needed! Sounds are generated with Web Audio API:

```typescript
const sound = useSynthSound();

sound.coin();       // Pickup/collect
sound.hit();        // Take damage
sound.explosion();  // Big impact
sound.jump();       // Jump/hop
sound.powerup();    // Power-up collected
sound.gameOver();   // Death/fail
sound.laser();      // Shoot/fire
sound.beep(freq, duration, volume);  // Custom beep
```

## Input Handling

### Keyboard
```typescript
const { isPressed } = useKeyboard();

if (isPressed('ArrowLeft') || isPressed('KeyA')) moveLeft();
if (isPressed('ArrowRight') || isPressed('KeyD')) moveRight();
if (isPressed('Space')) jump();
```

### Mouse/Touch
```typescript
const mouse = useMouse(canvasRef);

mouse.position.x, mouse.position.y  // Current position
mouse.isDown       // Button/finger held
mouse.justPressed  // Just clicked this frame
mouse.justReleased // Just released this frame
```

## Collision Detection

```typescript
import { rectsCollide, circlesCollide, pointInRect } from '@/lib/utils';

// Rectangle vs Rectangle
if (rectsCollide(
  { x: 10, y: 10, width: 50, height: 50 },
  { x: 40, y: 40, width: 50, height: 50 }
)) { /* collision */ }

// Circle vs Circle
if (circlesCollide(
  { x: 100, y: 100 }, 20,  // center, radius
  { x: 130, y: 100 }, 15
)) { /* collision */ }

// Point in Rectangle
if (pointInRect(
  { x: mouse.x, y: mouse.y },
  { x: 0, y: 0, width: 100, height: 100 }
)) { /* clicked in rect */ }
```

## Math Utilities

```typescript
import { clamp, lerp, random, randomInt, randomItem } from '@/lib/utils';

clamp(value, 0, 100);           // Keep between 0-100
lerp(0, 100, 0.5);              // Returns 50
random(0, 100);                 // Float between 0-100
randomInt(1, 6);                // Integer 1-6 (dice roll)
randomItem(['a', 'b', 'c']);    // Random array element
```

## Game Loop Structure

```typescript
useGameLoop((deltaTime) => {
  const dt = deltaTime / 1000; // Convert to seconds

  // 1. HANDLE INPUT
  // 2. UPDATE PHYSICS/POSITIONS
  // 3. CHECK COLLISIONS
  // 4. SPAWN/REMOVE ENTITIES
  // 5. UPDATE EFFECTS (particles, shake)
  // 6. RENDER (clear, draw, particles)
  // 7. DRAW HUD (outside shake transform)

}, isPlaying);
```

## Common Game Patterns

### Spawning Enemies Over Time
```typescript
const lastSpawn = useRef(0);
const SPAWN_RATE = 1000; // ms

// In game loop:
lastSpawn.current += deltaTime;
if (lastSpawn.current >= SPAWN_RATE) {
  enemies.current.push({
    id: generateId(),
    x: CONFIG.width + 50,
    y: random(50, CONFIG.height - 50),
  });
  lastSpawn.current = 0;
}
```

### Increasing Difficulty
```typescript
const difficulty = useRef(1);

// In game loop:
difficulty.current = 1 + score / 500;
const spawnRate = 1000 / difficulty.current;
const enemySpeed = 100 * difficulty.current;
```

### Invincibility Frames
```typescript
const player = useRef({ x: 0, y: 0, invincible: 0 });

// When hit:
if (player.current.invincible <= 0) {
  player.current.lives--;
  player.current.invincible = 2000; // 2 seconds
}

// In game loop:
if (player.current.invincible > 0) {
  player.current.invincible -= deltaTime;
}

// When rendering (flicker effect):
if (player.current.invincible <= 0 || Math.floor(player.current.invincible / 100) % 2 === 0) {
  drawPlayer();
}
```

### Combo System
```typescript
const combo = useRef(0);
const comboTimer = useRef(0);
const COMBO_TIMEOUT = 2000;

// When scoring:
combo.current++;
comboTimer.current = COMBO_TIMEOUT;
const points = 10 * combo.current;
addScore(points);

// In game loop:
if (combo.current > 0) {
  comboTimer.current -= deltaTime;
  if (comboTimer.current <= 0) {
    combo.current = 0;
  }
}
```

## Theme Colors

```
--ft-bg-primary: #0a0a0f    (darkest)
--ft-bg-secondary: #12121a  (canvas bg)
--ft-accent: #00d4ff        (cyan)
--ft-text: #ffffff          (white)
--ft-text-muted: #8b8b9e    (gray)
--ft-success: #00ff88       (green)
--ft-error: #ff4444         (red)
```

## Don'ts

- **Don't use `useState` for game state** - causes re-renders, use `useRef`
- **Don't make API calls** - games are pure client-side
- **Don't use `setInterval`** - use `useGameLoop`
- **Don't forget `deltaTime`** - movement will be inconsistent without it
- **Don't render outside the shake transform** for game objects (HUD is OK)

## Game Ideas

- **Clicker/Tap**: Use `mouse.justPressed`, add particles on click
- **Endless Runner**: Auto-scroll, spawn obstacles, jump with tap
- **Shooter**: Bullet arrays, enemy waves, power-ups
- **Puzzle**: Grid state, click to interact, match mechanics
- **Physics**: Gravity, velocity, bouncing off walls
- **Snake**: Array of segments, grow on eat, collide with self
- **Breakout**: Paddle, ball physics, brick grid
- **Asteroids**: Rotation, thrust, wrap-around screen
