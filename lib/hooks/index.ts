// Game hooks - import these in your Game.tsx
export { useGameState } from './useGameState';
export { useGameLoop } from './useGameLoop';
export { useKeyboard } from './useKeyboard';
export { useMouse } from './useMouse';
export { useCanvas } from './useCanvas';
export { useSound, useSoundManager, useSynthSound } from './useSound';
export { useParticles } from './useParticles';
export { useScreenShake } from './useScreenShake';

// Re-export types
export type { Particle, ParticleOptions } from './useParticles';
export type { ShakeOptions } from './useScreenShake';
