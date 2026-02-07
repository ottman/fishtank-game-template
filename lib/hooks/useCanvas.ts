import { useRef, useEffect, useState, useCallback } from 'react';
import { DEFAULT_CONFIG, GameConfig } from '../types';

/**
 * Canvas management hook with responsive scaling
 * Handles high-DPI displays and container resizing
 */
export function useCanvas(config: Partial<GameConfig> = {}) {
  const { width, height } = { ...DEFAULT_CONFIG, ...config };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (context) {
      // Handle high-DPI displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.scale(dpr, dpr);
      setCtx(context);
    }
  }, [width, height]);

  // Handle responsive scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const scaleX = containerWidth / width;
      const scaleY = containerHeight / height;
      setScale(Math.min(scaleX, scaleY, 1));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [width, height]);

  // Clear the canvas
  const clear = useCallback((color = '#12121a') => {
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  }, [ctx, width, height]);

  // Draw a rectangle
  const drawRect = useCallback((
    x: number,
    y: number,
    w: number,
    h: number,
    color: string
  ) => {
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }, [ctx]);

  // Draw a circle
  const drawCircle = useCallback((
    x: number,
    y: number,
    radius: number,
    color: string
  ) => {
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [ctx]);

  // Draw text
  const drawText = useCallback((
    text: string,
    x: number,
    y: number,
    options: {
      color?: string;
      font?: string;
      align?: CanvasTextAlign;
      baseline?: CanvasTextBaseline;
    } = {}
  ) => {
    if (!ctx) return;
    const {
      color = '#ffffff',
      font = '16px system-ui',
      align = 'left',
      baseline = 'top',
    } = options;
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(text, x, y);
  }, [ctx]);

  return {
    canvasRef,
    containerRef,
    ctx,
    scale,
    width,
    height,
    clear,
    drawRect,
    drawCircle,
    drawText,
  };
}
