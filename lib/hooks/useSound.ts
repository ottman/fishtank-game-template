import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Simple sound hook for single audio file
 */
export function useSound(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, [src]);

  return play;
}

/**
 * Sound configuration
 */
interface SoundConfig {
  volume?: number;
  loop?: boolean;
  pitchVariation?: number;
}

/**
 * Preloaded sound with pooling for concurrent playback
 */
interface SoundPool {
  audios: HTMLAudioElement[];
  index: number;
  config: SoundConfig;
}

/**
 * Sound manager for multiple sounds with pooling
 *
 * Usage:
 * ```
 * const sound = useSoundManager({
 *   coin: '/assets/sounds/coin.mp3',
 *   hit: '/assets/sounds/hit.mp3',
 *   explosion: { src: '/assets/sounds/explosion.mp3', volume: 0.8 },
 * });
 *
 * // Play sounds
 * sound.play('coin');
 * sound.play('explosion');
 *
 * // With options
 * sound.play('hit', { volume: 0.5 });
 * ```
 */
export function useSoundManager(
  sounds: Record<string, string | { src: string } & SoundConfig>
) {
  const pools = useRef<Record<string, SoundPool>>({});
  const [ready, setReady] = useState(false);
  const masterVolume = useRef(1);
  const muted = useRef(false);

  // Preload all sounds
  useEffect(() => {
    const poolSize = 4; // Allow 4 concurrent plays of same sound

    Object.entries(sounds).forEach(([name, config]) => {
      const src = typeof config === 'string' ? config : config.src;
      const soundConfig = typeof config === 'string' ? {} : config;

      const audios: HTMLAudioElement[] = [];
      for (let i = 0; i < poolSize; i++) {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.volume = (soundConfig as SoundConfig).volume ?? 1;
        audio.loop = (soundConfig as SoundConfig).loop ?? false;
        audios.push(audio);
      }

      pools.current[name] = {
        audios,
        index: 0,
        config: soundConfig,
      };
    });

    setReady(true);
  }, [sounds]);

  /**
   * Play a sound by name
   */
  const play = useCallback((name: string, options: SoundConfig = {}) => {
    if (muted.current) return;

    const pool = pools.current[name];
    if (!pool) {
      console.warn(`Sound "${name}" not found`);
      return;
    }

    const audio = pool.audios[pool.index];
    pool.index = (pool.index + 1) % pool.audios.length;

    // Apply volume
    const baseVolume = options.volume ?? pool.config.volume ?? 1;
    audio.volume = baseVolume * masterVolume.current;

    // Apply pitch variation
    const pitchVariation = options.pitchVariation ?? pool.config.pitchVariation ?? 0;
    if (pitchVariation > 0) {
      audio.playbackRate = 1 + (Math.random() - 0.5) * pitchVariation;
    } else {
      audio.playbackRate = 1;
    }

    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  /**
   * Stop a sound
   */
  const stop = useCallback((name: string) => {
    const pool = pools.current[name];
    if (!pool) return;

    pool.audios.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }, []);

  /**
   * Stop all sounds
   */
  const stopAll = useCallback(() => {
    Object.values(pools.current).forEach(pool => {
      pool.audios.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    });
  }, []);

  /**
   * Set master volume (0-1)
   */
  const setVolume = useCallback((volume: number) => {
    masterVolume.current = Math.max(0, Math.min(1, volume));
  }, []);

  /**
   * Mute/unmute all sounds
   */
  const setMuted = useCallback((isMuted: boolean) => {
    muted.current = isMuted;
    if (isMuted) stopAll();
  }, [stopAll]);

  return {
    play,
    stop,
    stopAll,
    setVolume,
    setMuted,
    ready,
    isMuted: muted.current,
  };
}

/**
 * Generate simple sound effects using Web Audio API
 * Use this to create sounds without audio files
 */
export function useSynthSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  /**
   * Play a beep sound
   */
  const beep = useCallback((frequency = 440, duration = 100, volume = 0.3) => {
    const ctx = getContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'square';
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration / 1000);
  }, [getContext]);

  /**
   * Coin/pickup sound
   */
  const coin = useCallback(() => {
    const ctx = getContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(987.77, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
  }, [getContext]);

  /**
   * Hit/damage sound
   */
  const hit = useCallback(() => {
    const ctx = getContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);
  }, [getContext]);

  /**
   * Explosion sound
   */
  const explosion = useCallback(() => {
    const ctx = getContext();

    // Noise burst
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    noise.buffer = buffer;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    noise.start();
  }, [getContext]);

  /**
   * Jump sound
   */
  const jump = useCallback(() => {
    const ctx = getContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
  }, [getContext]);

  /**
   * Powerup sound
   */
  const powerup = useCallback(() => {
    const ctx = getContext();
    const frequencies = [523.25, 659.25, 783.99, 1046.50];

    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.15);

      oscillator.start(ctx.currentTime + i * 0.08);
      oscillator.stop(ctx.currentTime + i * 0.08 + 0.15);
    });
  }, [getContext]);

  /**
   * Game over sound
   */
  const gameOver = useCallback(() => {
    const ctx = getContext();
    const frequencies = [392, 349.23, 329.63, 293.66];

    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.type = 'triangle';
      oscillator.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.2 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.4);

      oscillator.start(ctx.currentTime + i * 0.2);
      oscillator.stop(ctx.currentTime + i * 0.2 + 0.4);
    });
  }, [getContext]);

  /**
   * Laser/shoot sound
   */
  const laser = useCallback(() => {
    const ctx = getContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
  }, [getContext]);

  return {
    beep,
    coin,
    hit,
    explosion,
    jump,
    powerup,
    gameOver,
    laser,
  };
}
