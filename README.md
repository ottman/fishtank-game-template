# Fishtank Game Template

A template for building client-side React games for the Fishtank arcade.

## Quick Start

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── page.tsx           # Entry point - renders <Game />
│   ├── layout.tsx         # HTML wrapper with metadata
│   └── globals.css        # Fishtank theme CSS variables
│
├── components/game/
│   ├── Game.tsx           # ⭐ MAIN FILE - your game logic goes here
│   ├── Game.module.css    # Game styles
│   ├── GameWindow.tsx     # Container wrapper (responsive)
│   └── GameControls.tsx   # Pause/Resume/Reset buttons
│
├── lib/
│   ├── types.ts           # TypeScript types & interfaces
│   ├── utils.ts           # Collision, math, vector utilities
│   └── hooks/
│       ├── useGameState.ts    # Game lifecycle management
│       ├── useGameLoop.ts     # 60fps animation loop
│       ├── useKeyboard.ts     # Keyboard input
│       ├── useMouse.ts        # Mouse & touch input
│       ├── useCanvas.ts       # Canvas drawing utilities
│       └── useSound.ts        # Audio playback
│
├── metadata.json          # Game info (name, description, tags)
└── public/assets/         # Static files (images, sounds)
```

## Building Your Game

Edit `components/game/Game.tsx`. The template includes a working demo game.

### Game Configuration

```typescript
const CONFIG = {
  width: 800,           // Canvas width
  height: 600,          // Canvas height
  playerSpeed: 300,     // Pixels per second
  // Add your game-specific config here
};
```

### Game State (useRef)

Use `useRef` for game data that changes every frame:

```typescript
const player = useRef({ x: 400, y: 300, health: 100 });
const enemies = useRef<Enemy[]>([]);
const bullets = useRef<Bullet[]>([]);
```

### Game Loop

The game loop runs at 60fps. Use `deltaTime` for smooth movement:

```typescript
useGameLoop((deltaTime) => {
  // Update (deltaTime is in milliseconds)
  const speed = 200 * (deltaTime / 1000);
  player.current.x += speed;

  // Check collisions
  if (enemyHit) addScore(10);
  if (playerDead) end({ score });

  // Render
  clear();
  drawCircle(player.current.x, player.current.y, 20, '#fff');
}, isPlaying);
```

### Input Handling

```typescript
// Keyboard
const { isPressed } = useKeyboard();
if (isPressed('Space')) shoot();
if (isPressed('ArrowLeft') || isPressed('KeyA')) moveLeft();

// Mouse/Touch
const mouse = useMouse(canvasRef);
if (mouse.isDown) moveToward(mouse.position);
if (mouse.justPressed) onClick(mouse.position);
```

### Score & Game Over

```typescript
const { score, highScore, addScore, end } = useGameState();

// During gameplay
addScore(10);

// End the game
end({ score: 1000 });
```

## Available Hooks

| Hook | Purpose |
|------|---------|
| `useGameState()` | Game lifecycle: play, pause, resume, reset, end |
| `useGameLoop(fn, active)` | 60fps loop with delta time |
| `useKeyboard()` | Keyboard input tracking |
| `useMouse(ref?)` | Mouse/touch position and clicks |
| `useCanvas(config)` | Canvas context and drawing helpers |
| `useSound(src)` | Audio playback |

## Utility Functions

```typescript
import { clamp, lerp, random, randomInt } from '@/lib/utils';
import { rectsCollide, circlesCollide, pointInRect } from '@/lib/utils';
import { addVectors, scaleVector, normalizeVector } from '@/lib/utils';
```

## Theme Variables

```css
--ft-bg-primary: #0a0a0f;
--ft-bg-secondary: #12121a;
--ft-accent: #00d4ff;
--ft-text: #ffffff;
--ft-text-muted: #8b8b9e;
--ft-border: #2a2a3e;
--ft-success: #00ff88;
--ft-error: #ff4444;
```

## Parent Frame Communication

Games automatically send messages to the parent fishtank frame:

```typescript
// Sent automatically
{ type: 'GAME_READY' }
{ type: 'GAME_START' }
{ type: 'GAME_PAUSE' }
{ type: 'GAME_RESUME' }
{ type: 'GAME_OVER', result: { score, highScore } }
{ type: 'SCORE_UPDATE', score: number }
```

## Building for Production

```bash
npm run build
```

Creates a static export in `out/` that can be embedded in fishtank.

## Tips

- Use `deltaTime` for frame-rate independent movement
- Use `useRef` for game state that changes every frame
- Use `useState` only for UI that needs React re-renders
- Test on mobile - touch controls are enabled by default
- Keep the game loop fast - heavy computation causes lag
