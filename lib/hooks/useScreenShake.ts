import { useRef, useCallback } from 'react';
import { random } from '../utils';

/**
 * Screen shake state
 */
interface ShakeState {
  intensity: number;
  duration: number;
  elapsed: number;
  offsetX: number;
  offsetY: number;
  decay: number;
}

/**
 * Screen shake options
 */
export interface ShakeOptions {
  /** Shake intensity in pixels */
  intensity?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Decay rate (0-1, higher = faster decay) */
  decay?: number;
}

/**
 * Screen shake hook for impact feedback
 *
 * Usage:
 * ```
 * const { shake, update, offsetX, offsetY } = useScreenShake();
 *
 * // Trigger shake
 * shake({ intensity: 10, duration: 200 });
 *
 * // In game loop
 * update(deltaTime);
 *
 * // Apply offset to canvas
 * ctx.save();
 * ctx.translate(offsetX, offsetY);
 * // ... render game ...
 * ctx.restore();
 * ```
 */
export function useScreenShake() {
  const state = useRef<ShakeState>({
    intensity: 0,
    duration: 0,
    elapsed: 0,
    offsetX: 0,
    offsetY: 0,
    decay: 0.9,
  });

  /**
   * Trigger a screen shake
   */
  const shake = useCallback((options: ShakeOptions = {}) => {
    const {
      intensity = 10,
      duration = 200,
      decay = 0.9,
    } = options;

    // If new shake is stronger, use it; otherwise stack
    if (intensity > state.current.intensity) {
      state.current.intensity = intensity;
      state.current.duration = duration;
      state.current.elapsed = 0;
      state.current.decay = decay;
    } else {
      // Add to existing shake
      state.current.intensity = Math.min(state.current.intensity + intensity * 0.5, intensity * 2);
    }
  }, []);

  /**
   * Small shake for minor impacts
   */
  const shakeSmall = useCallback(() => {
    shake({ intensity: 3, duration: 100 });
  }, [shake]);

  /**
   * Medium shake for hits
   */
  const shakeMedium = useCallback(() => {
    shake({ intensity: 8, duration: 200 });
  }, [shake]);

  /**
   * Large shake for explosions
   */
  const shakeLarge = useCallback(() => {
    shake({ intensity: 15, duration: 300 });
  }, [shake]);

  /**
   * Update shake state (call in game loop)
   */
  const update = useCallback((deltaTime: number) => {
    const s = state.current;

    if (s.intensity <= 0.1) {
      s.intensity = 0;
      s.offsetX = 0;
      s.offsetY = 0;
      return;
    }

    s.elapsed += deltaTime;

    // Decay intensity
    s.intensity *= s.decay;

    // Random offset within intensity
    s.offsetX = random(-s.intensity, s.intensity);
    s.offsetY = random(-s.intensity, s.intensity);

    // Stop after duration
    if (s.elapsed >= s.duration) {
      s.intensity = 0;
      s.offsetX = 0;
      s.offsetY = 0;
    }
  }, []);

  /**
   * Apply shake transform to canvas context
   */
  const apply = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.translate(state.current.offsetX, state.current.offsetY);
  }, []);

  return {
    shake,
    shakeSmall,
    shakeMedium,
    shakeLarge,
    update,
    apply,
    offsetX: state.current.offsetX,
    offsetY: state.current.offsetY,
    isShaking: state.current.intensity > 0.1,
  };
}
