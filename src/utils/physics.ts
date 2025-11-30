// src/utils/physics.ts
/**
 * Physics utilities for iOS-quality animations
 *
 * Provides spring animations and rubber-band overscroll effects
 * that match the feel of native mobile apps.
 */

/**
 * Spring configuration for animations
 */
export interface SpringConfig {
  stiffness: number;  // Spring stiffness (higher = snappier)
  damping: number;    // Damping coefficient (higher = less oscillation)
  mass: number;       // Mass of the animated object
}

/**
 * Pre-configured spring presets matching iOS feel
 */
export const SPRING_PRESETS = {
  /** Default snap animation - balanced feel */
  default: { stiffness: 300, damping: 30, mass: 1 },
  /** Bouncy animation - for playful feedback */
  bouncy: { stiffness: 400, damping: 20, mass: 1 },
  /** Gentle animation - for subtle transitions */
  gentle: { stiffness: 150, damping: 20, mass: 1 },
  /** Stiff animation - for quick snaps */
  stiff: { stiffness: 500, damping: 40, mass: 1 },
  /** Carousel snap - tuned for card navigation */
  carouselSnap: { stiffness: 300, damping: 28, mass: 1 },
} as const;

/**
 * Calculate spring physics step using semi-implicit Euler integration
 *
 * This is the core physics equation that powers all spring animations.
 * Uses the equation: F = -kx - cv where k is stiffness, x is displacement, c is damping, v is velocity
 *
 * @param position - Current position
 * @param velocity - Current velocity
 * @param target - Target position
 * @param config - Spring configuration
 * @param dt - Time delta in seconds (typically 1/60 for 60fps)
 * @returns New position and velocity
 */
export function springStep(
  position: number,
  velocity: number,
  target: number,
  config: SpringConfig,
  dt: number = 1 / 60
): { position: number; velocity: number } {
  const { stiffness, damping, mass } = config;

  // Calculate spring force: F = -k * (position - target)
  const displacement = position - target;
  const springForce = -stiffness * displacement;

  // Calculate damping force: F = -c * velocity
  const dampingForce = -damping * velocity;

  // Total force
  const force = springForce + dampingForce;

  // Acceleration: a = F / m
  const acceleration = force / mass;

  // Semi-implicit Euler integration (more stable than explicit Euler)
  const newVelocity = velocity + acceleration * dt;
  const newPosition = position + newVelocity * dt;

  return { position: newPosition, velocity: newVelocity };
}

/**
 * Check if spring animation has settled (stopped moving)
 *
 * @param position - Current position
 * @param velocity - Current velocity
 * @param target - Target position
 * @param positionThreshold - Position threshold for "at rest" (default: 0.1px)
 * @param velocityThreshold - Velocity threshold for "at rest" (default: 0.1px/s)
 */
export function isSpringAtRest(
  position: number,
  velocity: number,
  target: number,
  positionThreshold: number = 0.1,
  velocityThreshold: number = 0.1
): boolean {
  return (
    Math.abs(position - target) < positionThreshold &&
    Math.abs(velocity) < velocityThreshold
  );
}

/**
 * Spring animation controller
 *
 * Animates a value from one position to another using spring physics.
 * Uses requestAnimationFrame for smooth 60fps updates.
 *
 * @param from - Starting value
 * @param to - Target value
 * @param config - Spring configuration
 * @param onUpdate - Called each frame with the current value
 * @param onComplete - Called when animation settles
 * @returns Object with cancel function
 *
 * @example
 * const anim = springAnimation(
 *   0,
 *   100,
 *   SPRING_PRESETS.default,
 *   (value) => element.style.transform = `translateX(${value}px)`,
 *   () => console.log('Animation complete')
 * );
 *
 * // To cancel:
 * anim.cancel();
 */
export function springAnimation(
  from: number,
  to: number,
  config: SpringConfig,
  onUpdate: (value: number) => void,
  onComplete?: () => void
): { cancel: () => void } {
  let position = from;
  let velocity = 0;
  let animationId: number | null = null;
  let lastTime = performance.now();
  let isCancelled = false;

  const animate = (currentTime: number) => {
    if (isCancelled) return;

    // Calculate time delta, capped to prevent large jumps
    const dt = Math.min((currentTime - lastTime) / 1000, 1 / 30);
    lastTime = currentTime;

    // Step the spring physics
    const result = springStep(position, velocity, to, config, dt);
    position = result.position;
    velocity = result.velocity;

    // Update the consumer
    onUpdate(position);

    // Check if animation is complete
    if (isSpringAtRest(position, velocity, to)) {
      // Snap to exact target to prevent floating point drift
      onUpdate(to);
      onComplete?.();
      return;
    }

    // Continue animation
    animationId = requestAnimationFrame(animate);
  };

  // Start animation
  animationId = requestAnimationFrame(animate);

  return {
    cancel: () => {
      isCancelled = true;
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
  };
}

/**
 * Spring animation with initial velocity
 *
 * Useful for continuing momentum after a gesture ends.
 *
 * @param from - Starting value
 * @param to - Target value
 * @param initialVelocity - Starting velocity (e.g., from a swipe gesture)
 * @param config - Spring configuration
 * @param onUpdate - Called each frame with the current value
 * @param onComplete - Called when animation settles
 */
export function springAnimationWithVelocity(
  from: number,
  to: number,
  initialVelocity: number,
  config: SpringConfig,
  onUpdate: (value: number) => void,
  onComplete?: () => void
): { cancel: () => void } {
  let position = from;
  let velocity = initialVelocity;
  let animationId: number | null = null;
  let lastTime = performance.now();
  let isCancelled = false;

  const animate = (currentTime: number) => {
    if (isCancelled) return;

    const dt = Math.min((currentTime - lastTime) / 1000, 1 / 30);
    lastTime = currentTime;

    const result = springStep(position, velocity, to, config, dt);
    position = result.position;
    velocity = result.velocity;

    onUpdate(position);

    if (isSpringAtRest(position, velocity, to)) {
      onUpdate(to);
      onComplete?.();
      return;
    }

    animationId = requestAnimationFrame(animate);
  };

  animationId = requestAnimationFrame(animate);

  return {
    cancel: () => {
      isCancelled = true;
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
  };
}

/**
 * Rubber band effect for overscroll
 *
 * Creates the iOS-style resistance when dragging past boundaries.
 * The further you drag, the more resistance you feel.
 *
 * Formula: offset * (1 - 1 / ((offset / maxDistance) * tension + 1))
 *
 * @param offset - How far past the boundary (always positive)
 * @param maxDistance - Maximum visual distance for overscroll
 * @param tension - How "tight" the rubber band feels (0.55 is iOS-like)
 * @returns The damped offset to display
 *
 * @example
 * // User drags 100px past edge with maxDistance of 100
 * rubberBand(100, 100, 0.55) // Returns ~35px (damped)
 */
export function rubberBand(
  offset: number,
  maxDistance: number,
  tension: number = 0.55
): number {
  // Handle zero or negative offset
  if (offset <= 0) return 0;

  // Calculate damped value using rubber band formula
  const resistance = 1 - 1 / ((offset / maxDistance) * tension + 1);
  return maxDistance * resistance;
}

/**
 * Apply rubber band effect considering direction
 *
 * @param offset - Current offset (can be negative or positive)
 * @param minBound - Minimum allowed offset (typically 0 or negative)
 * @param maxBound - Maximum allowed offset
 * @param maxOverscroll - Maximum visual overscroll distance
 * @param tension - Rubber band tension
 * @returns Adjusted offset with rubber band applied at boundaries
 */
export function rubberBandClamp(
  offset: number,
  minBound: number,
  maxBound: number,
  maxOverscroll: number,
  tension: number = 0.55
): number {
  if (offset < minBound) {
    // Overscrolling past minimum (typically left/top edge)
    const overscroll = minBound - offset;
    return minBound - rubberBand(overscroll, maxOverscroll, tension);
  }

  if (offset > maxBound) {
    // Overscrolling past maximum (typically right/bottom edge)
    const overscroll = offset - maxBound;
    return maxBound + rubberBand(overscroll, maxOverscroll, tension);
  }

  // Within bounds
  return offset;
}

/**
 * Calculate deceleration for momentum scrolling
 *
 * Used to determine where a flick gesture should settle.
 *
 * @param velocity - Current velocity in px/s
 * @param deceleration - Deceleration rate (0.998 is iOS-like)
 * @returns Final position offset from current position
 */
export function calculateMomentumOffset(
  velocity: number,
  deceleration: number = 0.998
): number {
  // Using physics formula: displacement = v² / (2 * a)
  // where a is derived from deceleration rate
  const acceleration = (1 - deceleration) * 1000; // Convert to px/s²
  return (velocity * Math.abs(velocity)) / (2 * acceleration);
}

/**
 * Interpolate between two values
 *
 * @param from - Start value
 * @param to - End value
 * @param progress - Progress from 0 to 1
 * @returns Interpolated value
 */
export function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

/**
 * Clamp a value between min and max
 *
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
