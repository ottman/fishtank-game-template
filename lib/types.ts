export enum GameState {
  IDLE = 'idle',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
}

export interface GameResult {
  score?: number;
  metadata?: Record<string, any>;
}
