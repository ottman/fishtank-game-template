/**
 * Game State Machine
 * The game progresses through these states:
 * IDLE -> PLAYING -> (PAUSED) -> GAME_OVER -> IDLE
 */
export enum GameState {
  IDLE = 'idle',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
}

/**
 * Result returned when game ends
 * Extend metadata for custom game-specific data
 */
export interface GameResult {
  score?: number;
  highScore?: number;
  level?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Game configuration - customize these for your game
 */
export interface GameConfig {
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Target frames per second */
  targetFPS?: number;
  /** Enable touch controls */
  touchEnabled?: boolean;
  /** Enable keyboard controls */
  keyboardEnabled?: boolean;
  /** Enable sound effects */
  soundEnabled?: boolean;
}

/**
 * Default game configuration
 */
export const DEFAULT_CONFIG: GameConfig = {
  width: 800,
  height: 600,
  targetFPS: 60,
  touchEnabled: true,
  keyboardEnabled: true,
  soundEnabled: true,
};

/**
 * Vector2D for positions, velocities, etc.
 */
export interface Vector2D {
  x: number;
  y: number;
}

/**
 * Rectangle for collision detection, bounds, etc.
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Base entity interface for game objects
 */
export interface Entity {
  id: string;
  position: Vector2D;
  velocity?: Vector2D;
  width: number;
  height: number;
  active: boolean;
}

/**
 * Messages sent to parent frame (fishtank)
 */
export type GameMessage =
  | { type: 'GAME_READY' }
  | { type: 'GAME_START' }
  | { type: 'GAME_PAUSE' }
  | { type: 'GAME_RESUME' }
  | { type: 'GAME_OVER'; result: GameResult }
  | { type: 'SCORE_UPDATE'; score: number };
