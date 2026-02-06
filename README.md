# Fishtank Game Template

A template for building client-side React games that work with fishtank's Next.js app and social.dev-combined's AI app builder.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Visit [http://localhost:3000](http://localhost:3000) to see your game.

## Project Structure

```
fishtank-game-template/
├── app/
│   ├── page.tsx           # Entry point - renders <Game />
│   ├── layout.tsx         # HTML wrapper
│   └── globals.css        # Fishtank theme variables
│
├── components/game/
│   ├── Game.tsx           # MAIN FILE - your game logic goes here
│   ├── Game.module.css    # Game styles
│   ├── GameWindow.tsx     # Container wrapper
│   └── GameControls.tsx   # Play/Pause/Reset buttons
│
├── lib/
│   ├── types.ts           # GameState enum, interfaces
│   └── hooks/
│       ├── useGameState.ts    # State machine (idle/playing/paused/over)
│       ├── useGameLoop.ts     # requestAnimationFrame loop
│       ├── useKeyboard.ts     # Keyboard input tracking
│       ├── useMouse.ts        # Mouse/touch input
│       └── useSound.ts        # Audio playback
│
├── public/assets/         # Static assets (images, sounds)
└── metadata.json          # Game configuration
```

## Building Your Game

### 1. Edit `components/game/Game.tsx`

This is where your game logic lives. The template provides:

- **State management** via `useGameState()` - handles idle, playing, paused, and game over states
- **Game loop** via `useGameLoop()` - runs at 60fps with delta time
- **Input handling** via `useKeyboard()` and `useMouse()` - tracks user input
- **Canvas rendering** - an 800x600 canvas ready for your graphics

### 2. Implement the Game Loop

```typescript
useGameLoop((delta) => {
  const ctx = canvasRef.current?.getContext('2d');
  if (!ctx) return;

  // Clear the canvas
  ctx.fillStyle = '#12121a';
  ctx.fillRect(0, 0, 800, 600);

  // Update game objects based on delta time (in milliseconds)
  player.x += player.vx * (delta / 1000);

  // Check for input
  if (isPressed('ArrowLeft')) player.vx = -200;
  if (isPressed('ArrowRight')) player.vx = 200;

  // Draw game objects
  ctx.fillStyle = '#00d4ff';
  ctx.fillRect(player.x, player.y, 50, 50);

  // Check for game over
  if (gameOverCondition) {
    end({ score: currentScore });
  }
}, state === GameState.PLAYING);
```

### 3. Handle Game States

The template provides overlays for each state:

- **IDLE** - "Ready to Play?" with Start button
- **PAUSED** - "Paused" with Resume button
- **GAME_OVER** - "Game Over!" with score and Play Again button

Call `end({ score: 100 })` to trigger game over with a score.

## Available Hooks

### `useGameState()`

```typescript
const { state, result, play, pause, resume, reset, end } = useGameState();
```

- `state` - Current GameState (IDLE, PLAYING, PAUSED, GAME_OVER)
- `result` - GameResult after game ends (contains score)
- `play()` - Start the game
- `pause()` - Pause the game
- `resume()` - Resume from pause
- `reset()` - Reset to initial state
- `end(result)` - End game with result

### `useGameLoop(callback, active)`

```typescript
useGameLoop((deltaTime) => {
  // deltaTime is milliseconds since last frame
}, state === GameState.PLAYING);
```

### `useKeyboard()`

```typescript
const { keys, isPressed } = useKeyboard();

if (isPressed('Space')) jump();
if (isPressed('ArrowLeft')) moveLeft();
```

Common key codes: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`, `KeyW`, `KeyA`, `KeyS`, `KeyD`

### `useMouse(elementRef?)`

```typescript
const mouse = useMouse(canvasRef);

// mouse.x, mouse.y - position relative to canvas
// mouse.isDown - whether mouse/touch is pressed
```

### `useSound(src)`

```typescript
const playExplosion = useSound('/assets/explosion.mp3');

playExplosion(); // Play the sound
```

## Theme Variables

The template includes fishtank's dark theme:

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

## Metadata

Edit `metadata.json` to configure your game:

```json
{
  "name": "My Awesome Game",
  "description": "A fun arcade game",
  "version": "1.0.0",
  "tags": ["arcade", "action"],
  "thumbnail": "/assets/thumbnail.png"
}
```

## Deployment

The template is configured for static export:

```bash
npm run build
```

This creates an `out/` directory with static files that can be hosted anywhere or embedded in fishtank.

## Tips

- Use `delta` time for smooth animations regardless of frame rate
- Keep game state in `useRef` for values that change frequently
- Use `useState` only for values that should trigger re-renders
- Add sounds to `public/assets/` and load with `useSound`
- Test keyboard input with the browser dev tools console
