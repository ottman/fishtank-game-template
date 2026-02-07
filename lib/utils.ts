import { Vector2D, Rect, Entity } from './types';

/**
 * Collision Detection Utilities
 */

/** Check if two rectangles overlap */
export function rectsCollide(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Check if two entities collide */
export function entitiesCollide(a: Entity, b: Entity): boolean {
  return rectsCollide(
    { x: a.position.x, y: a.position.y, width: a.width, height: a.height },
    { x: b.position.x, y: b.position.y, width: b.width, height: b.height }
  );
}

/** Check if a point is inside a rectangle */
export function pointInRect(point: Vector2D, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/** Get distance between two points */
export function distance(a: Vector2D, b: Vector2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Check if two circles collide */
export function circlesCollide(
  a: Vector2D,
  radiusA: number,
  b: Vector2D,
  radiusB: number
): boolean {
  return distance(a, b) < radiusA + radiusB;
}

/**
 * Math Utilities
 */

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Linear interpolation */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/** Get a random number between min and max */
export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Get a random integer between min and max (inclusive) */
export function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max + 1));
}

/** Get a random item from an array */
export function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Vector Utilities
 */

/** Add two vectors */
export function addVectors(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

/** Subtract vector b from vector a */
export function subtractVectors(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

/** Multiply a vector by a scalar */
export function scaleVector(v: Vector2D, scalar: number): Vector2D {
  return { x: v.x * scalar, y: v.y * scalar };
}

/** Normalize a vector to unit length */
export function normalizeVector(v: Vector2D): Vector2D {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/**
 * ID Generation
 */
let idCounter = 0;
export function generateId(): string {
  return `entity_${++idCounter}_${Date.now()}`;
}
