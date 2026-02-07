import { useRef, useCallback } from 'react';
import { random } from '../utils';

/**
 * Particle for visual effects
 */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity?: number;
  friction?: number;
  shrink?: boolean;
  fade?: boolean;
}

/**
 * Options for spawning particles
 */
export interface ParticleOptions {
  /** Number of particles to spawn */
  count?: number;
  /** Particle colors (random selection) */
  colors?: string[];
  /** Minimum initial speed */
  speedMin?: number;
  /** Maximum initial speed */
  speedMax?: number;
  /** Particle lifetime in ms */
  life?: number;
  /** Lifetime variance in ms */
  lifeVariance?: number;
  /** Minimum particle size */
  sizeMin?: number;
  /** Maximum particle size */
  sizeMax?: number;
  /** Gravity applied to particles */
  gravity?: number;
  /** Friction (0-1, lower = more friction) */
  friction?: number;
  /** Shrink particles over lifetime */
  shrink?: boolean;
  /** Fade particles over lifetime */
  fade?: boolean;
  /** Direction in radians (undefined = all directions) */
  direction?: number;
  /** Spread angle in radians */
  spread?: number;
}

const DEFAULT_OPTIONS: Required<ParticleOptions> = {
  count: 10,
  colors: ['#00d4ff', '#00ff88', '#ffaa00', '#ff4444', '#ffffff'],
  speedMin: 50,
  speedMax: 200,
  life: 500,
  lifeVariance: 200,
  sizeMin: 2,
  sizeMax: 6,
  gravity: 200,
  friction: 0.98,
  shrink: true,
  fade: true,
  direction: 0,
  spread: Math.PI * 2,
};

/**
 * Particle system hook for visual effects
 *
 * Usage:
 * ```
 * const { particles, emit, update, render } = useParticles();
 *
 * // Emit particles at position
 * emit(x, y, { count: 20, colors: ['#ff0000'] });
 *
 * // In game loop
 * update(deltaTime);
 * render(ctx);
 * ```
 */
export function useParticles() {
  const particles = useRef<Particle[]>([]);

  /**
   * Emit particles at a position
   */
  const emit = useCallback((x: number, y: number, options: ParticleOptions = {}) => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    for (let i = 0; i < opts.count; i++) {
      const angle = opts.spread === Math.PI * 2
        ? random(0, Math.PI * 2)
        : opts.direction + random(-opts.spread / 2, opts.spread / 2);

      const speed = random(opts.speedMin, opts.speedMax);
      const life = opts.life + random(-opts.lifeVariance, opts.lifeVariance);

      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: random(opts.sizeMin, opts.sizeMax),
        color: opts.colors[Math.floor(random(0, opts.colors.length))],
        gravity: opts.gravity,
        friction: opts.friction,
        shrink: opts.shrink,
        fade: opts.fade,
      });
    }
  }, []);

  /**
   * Emit a trail of particles (for moving objects)
   */
  const trail = useCallback((x: number, y: number, options: ParticleOptions = {}) => {
    emit(x, y, {
      count: 1,
      speedMin: 10,
      speedMax: 30,
      life: 300,
      sizeMin: 2,
      sizeMax: 4,
      gravity: 0,
      ...options,
    });
  }, [emit]);

  /**
   * Explosion effect
   */
  const explode = useCallback((x: number, y: number, options: ParticleOptions = {}) => {
    emit(x, y, {
      count: 30,
      speedMin: 100,
      speedMax: 300,
      life: 600,
      sizeMin: 3,
      sizeMax: 8,
      ...options,
    });
  }, [emit]);

  /**
   * Sparkle effect (upward)
   */
  const sparkle = useCallback((x: number, y: number, options: ParticleOptions = {}) => {
    emit(x, y, {
      count: 5,
      speedMin: 50,
      speedMax: 150,
      direction: -Math.PI / 2,
      spread: Math.PI / 3,
      gravity: -50,
      life: 400,
      colors: ['#ffff00', '#ffaa00', '#ffffff'],
      ...options,
    });
  }, [emit]);

  /**
   * Update all particles (call in game loop)
   */
  const update = useCallback((deltaTime: number) => {
    const dt = deltaTime / 1000;

    particles.current = particles.current.filter(p => {
      p.life -= deltaTime;
      if (p.life <= 0) return false;

      p.vy += (p.gravity ?? 0) * dt;
      p.vx *= p.friction ?? 1;
      p.vy *= p.friction ?? 1;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      return true;
    });
  }, []);

  /**
   * Render all particles (call in game loop after clearing)
   */
  const render = useCallback((ctx: CanvasRenderingContext2D) => {
    for (const p of particles.current) {
      const lifeRatio = p.life / p.maxLife;
      const size = p.shrink ? p.size * lifeRatio : p.size;
      const alpha = p.fade ? lifeRatio : 1;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, []);

  /**
   * Clear all particles
   */
  const clear = useCallback(() => {
    particles.current = [];
  }, []);

  return {
    particles: particles.current,
    emit,
    trail,
    explode,
    sparkle,
    update,
    render,
    clear,
    count: particles.current.length,
  };
}
