# Fishtank Game Template - AI Instructions

You are building a client-side browser game using the Fishtank game template. This is a Next.js app with canvas-based rendering.

## Architecture

- **Pure client-side** - No backend, no database, no API calls during gameplay
- **Canvas rendering** - Games draw to an HTML5 canvas at 60fps
- **Iframe embedded** - Games run inside fishtank's arcade iframe

## Key Files

| File | Purpose |
|------|---------|
| `components/game/Game.tsx` | **MAIN FILE** - All game logic goes here |
| `components/game/Game.module.css` | Game-specific styles |
| `lib/types.ts` | TypeScript interfaces (extend as needed) |
| `lib/utils.ts` | Collision, math, vector utilities |
| `lib/hooks/*.ts` | Game hooks (state, loop, input, canvas, sound) |
| `metadata.json` | Game name, description, tags |

## How to Build a Game

### 1. Configure the Game

Edit the CONFIG object at the top of `Game.tsx`:

```typescript
const CONFIG = {
  width: 800,
  height: 600,
  playerSpeed: 300,
  gravity: 980,
  // Add game-specific settings here
};
```

### 2. Define Game State

Use `useRef` for data that changes every frame (avoids React re-renders):

```typescript
const player = useRef({ x: 400, y: 300, vx: 0, vy: 0 });
const enemies = useRef<Enemy[]>([]);
const projectiles = useRef<Projectile[]>([]);
const gameTime = useRef(0);
```

### 3. Implement the Game Loop

The game loop receives `deltaTime` in milliseconds:

```typescript
useGameLoop((deltaTime) => {
  const dt = deltaTime / 1000; // Convert to seconds

  // 1. HANDLE INPUT
  if (isPressed('Space')) player.current.vy = -500;

  // 2. UPDATE PHYSICS
  player.current.vy += CONFIG.gravity * dt;
  player.current.y += player.current.vy * dt;

  // 3. CHECK COLLISIONS
  for (const enemy of enemies.current) {
    if (circlesCollide(player.current, 20, enemy, enemy.radius)) {
      end({ score });
    }
  }

  // 4. SPAWN/REMOVE ENTITIES
  enemies.current = enemies.current.filter(e => e.active);

  // 5. RENDER
  clear();
  drawCircle(player.current.x, player.current.y, 20, '#fff');
  for (const enemy of enemies.current) {
    drawCircle(enemy.x, enemy.y, enemy.radius, '#ff4444');
  }

}, isPlaying);
```

### 4. Handle Game States

The template manages these states automatically:

- `IDLE` - Start screen, waiting for player
- `PLAYING` - Game loop is running
- `PAUSED` - Game loop stopped, can resume
- `GAME_OVER` - Show final score, can restart

Use these functions:
- `play()` - Start the game
- `pause()` - Pause the game
- `resume()` - Resume from pause
- `end({ score })` - End with final score
- `addScore(points)` - Add points during gameplay

## Available Hooks

```typescript
// Game lifecycle
const { state, score, highScore, play, pause, resume, reset, end, addScore, isPlaying } = useGameState();

// 60fps game loop with delta time
useGameLoop((deltaTime) => { ... }, isPlaying);

// Keyboard input
const { isPressed } = useKeyboard();
if (isPressed('ArrowLeft')) { }
if (isPressed('KeyA')) { }
if (isPressed('Space')) { }

// Mouse/touch input
const mouse = useMouse(canvasRef);
mouse.position.x, mouse.position.y  // Current position
mouse.isDown                         // Currently pressed
mouse.justPressed                    // Just started this frame
mouse.justReleased                   // Just released this frame

// Canvas utilities
const { canvasRef, clear, drawRect, drawCircle, drawText } = useCanvas(CONFIG);
clear('#000000');
drawRect(x, y, width, height, '#ff0000');
drawCircle(x, y, radius, '#00ff00');
drawText('Score: 100', x, y, { color: '#fff', font: '24px system-ui', align: 'center' });

// Sound effects
const playSound = useSound('/assets/explosion.mp3');
playSound();
```

## Utility Functions

```typescript
import {
  // Collision detection
  rectsCollide, circlesCollide, pointInRect, entitiesCollide,
  // Math
  clamp, lerp, random, randomInt, randomItem,
  // Vectors
  addVectors, subtractVectors, scaleVector, normalizeVector, distance,
  // IDs
  generateId
} from '@/lib/utils';
```

## Common Patterns

### Spawning Enemies

```typescript
const spawnEnemy = () => {
  enemies.current.push({
    id: generateId(),
    x: CONFIG.width + 50,
    y: random(50, CONFIG.height - 50),
    vx: -random(100, 300),
    radius: randomInt(15, 30),
    active: true,
  });
};
```

### Frame-Rate Independent Movement

```typescript
// Always multiply by deltaTime for consistent speed
const speed = 200 * (deltaTime / 1000); // 200 pixels per second
player.current.x += speed;
```

### Cleaning Up Off-Screen Entities

```typescript
bullets.current = bullets.current.filter(b =>
  b.x > 0 && b.x < CONFIG.width && b.y > 0 && b.y < CONFIG.height
);
```

### Collision Response

```typescript
// Bounce off walls
if (ball.x < radius || ball.x > CONFIG.width - radius) {
  ball.vx *= -1;
}
```

## Theme Colors

Use these CSS variables for consistent styling:

```
--ft-bg-primary: #0a0a0f    (darkest background)
--ft-bg-secondary: #12121a  (canvas background)
--ft-accent: #00d4ff        (cyan highlight)
--ft-text: #ffffff          (white text)
--ft-text-muted: #8b8b9e    (gray text)
--ft-success: #00ff88       (green)
--ft-error: #ff4444         (red)
```

## Don'ts

- **Don't use `useState` for game state** - It causes re-renders. Use `useRef` instead.
- **Don't make API calls** - Games are pure client-side
- **Don't use `setInterval`** - Use `useGameLoop` which handles timing correctly
- **Don't forget deltaTime** - Movement without it will be inconsistent across devices

## Game Ideas

- **Clicker/Tap games** - Use `mouse.justPressed` to detect clicks
- **Endless runners** - Scroll background, spawn obstacles
- **Shooters** - Track bullets array, check collisions
- **Puzzle games** - Grid-based state, click to interact
- **Physics games** - Apply gravity, velocity, bouncing
- **Snake/Growing games** - Array of segments, collision with self
