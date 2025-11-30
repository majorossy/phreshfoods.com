// src/utils/velocityTracker.ts
/**
 * Velocity Tracker for gesture recognition
 *
 * Tracks touch movement samples and calculates velocity using
 * weighted averaging for smooth, accurate gesture detection.
 *
 * This is essential for determining:
 * - Swipe direction and speed
 * - Whether a gesture is a tap, drag, or flick
 * - Momentum for spring animations after release
 */

interface VelocitySample {
  x: number;
  y: number;
  time: number;
}

export interface Velocity {
  x: number;  // Velocity in px/s (positive = right/down)
  y: number;  // Velocity in px/s (positive = right/down)
}

/**
 * Configuration for velocity tracking
 */
export interface VelocityTrackerConfig {
  /** Maximum number of samples to keep (default: 10) */
  maxSamples?: number;
  /** Maximum age of samples in ms (default: 100) */
  maxSampleAge?: number;
  /** Minimum samples needed for valid velocity (default: 2) */
  minSamples?: number;
}

const DEFAULT_CONFIG: Required<VelocityTrackerConfig> = {
  maxSamples: 10,
  maxSampleAge: 100,
  minSamples: 2,
};

/**
 * VelocityTracker class
 *
 * Collects position samples over time and calculates velocity
 * using a weighted average that prioritizes recent samples.
 *
 * @example
 * const tracker = new VelocityTracker();
 *
 * // During touch move:
 * tracker.addSample(touch.clientX, touch.clientY);
 *
 * // On touch end:
 * const velocity = tracker.getVelocity();
 * console.log(`Velocity: ${velocity.x}px/s horizontal, ${velocity.y}px/s vertical`);
 *
 * // Reset for next gesture:
 * tracker.reset();
 */
export class VelocityTracker {
  private samples: VelocitySample[] = [];
  private config: Required<VelocityTrackerConfig>;

  constructor(config: VelocityTrackerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add a position sample
   *
   * Call this on every touchmove event to track movement.
   *
   * @param x - Current X position (e.g., touch.clientX)
   * @param y - Current Y position (e.g., touch.clientY)
   */
  addSample(x: number, y: number): void {
    const now = performance.now();

    // Add new sample
    this.samples.push({ x, y, time: now });

    // Remove old samples
    this.pruneOldSamples(now);
  }

  /**
   * Remove samples that are too old or exceed max count
   */
  private pruneOldSamples(now: number): void {
    // Remove samples older than maxSampleAge
    const cutoff = now - this.config.maxSampleAge;
    while (this.samples.length > 0 && this.samples[0].time < cutoff) {
      this.samples.shift();
    }

    // Keep only maxSamples most recent
    while (this.samples.length > this.config.maxSamples) {
      this.samples.shift();
    }
  }

  /**
   * Calculate current velocity
   *
   * Uses weighted linear regression on recent samples to determine
   * velocity. More recent samples have higher weight.
   *
   * @returns Velocity in pixels per second { x, y }
   */
  getVelocity(): Velocity {
    if (this.samples.length < this.config.minSamples) {
      return { x: 0, y: 0 };
    }

    const now = performance.now();
    this.pruneOldSamples(now);

    if (this.samples.length < this.config.minSamples) {
      return { x: 0, y: 0 };
    }

    // Simple approach: calculate velocity between first and last valid samples
    // with time-based weighting
    const firstSample = this.samples[0];
    const lastSample = this.samples[this.samples.length - 1];

    const deltaTime = (lastSample.time - firstSample.time) / 1000; // Convert to seconds

    if (deltaTime <= 0) {
      return { x: 0, y: 0 };
    }

    // For more accuracy with noisy data, use weighted average of segment velocities
    if (this.samples.length >= 3) {
      return this.getWeightedVelocity();
    }

    // Simple two-point velocity
    return {
      x: (lastSample.x - firstSample.x) / deltaTime,
      y: (lastSample.y - firstSample.y) / deltaTime,
    };
  }

  /**
   * Calculate weighted velocity using all samples
   *
   * More recent samples contribute more to the final velocity.
   * This smooths out noise from touch jitter.
   */
  private getWeightedVelocity(): Velocity {
    let totalWeight = 0;
    let weightedVelocityX = 0;
    let weightedVelocityY = 0;

    // Calculate velocity between each consecutive pair of samples
    for (let i = 1; i < this.samples.length; i++) {
      const prev = this.samples[i - 1];
      const curr = this.samples[i];

      const deltaTime = (curr.time - prev.time) / 1000;

      if (deltaTime > 0) {
        const velocityX = (curr.x - prev.x) / deltaTime;
        const velocityY = (curr.y - prev.y) / deltaTime;

        // Weight: more recent samples have higher weight (exponential)
        // i ranges from 1 to samples.length-1
        // Weight increases quadratically towards the end
        const weight = i * i;

        weightedVelocityX += velocityX * weight;
        weightedVelocityY += velocityY * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight === 0) {
      return { x: 0, y: 0 };
    }

    return {
      x: weightedVelocityX / totalWeight,
      y: weightedVelocityY / totalWeight,
    };
  }

  /**
   * Get the direction of the gesture
   *
   * @returns Angle in degrees (0 = right, 90 = down, 180 = left, 270 = up)
   */
  getDirection(): number {
    const velocity = this.getVelocity();
    const angle = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI);
    return angle < 0 ? angle + 360 : angle;
  }

  /**
   * Get the speed (magnitude) of velocity
   *
   * @returns Speed in pixels per second
   */
  getSpeed(): number {
    const velocity = this.getVelocity();
    return Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  }

  /**
   * Check if the gesture is primarily horizontal
   *
   * @param threshold - Maximum angle deviation from horizontal (default: 30°)
   */
  isHorizontal(threshold: number = 30): boolean {
    const angle = this.getDirection();
    // Check if angle is close to 0° (right) or 180° (left)
    return (
      angle < threshold ||
      angle > 360 - threshold ||
      (angle > 180 - threshold && angle < 180 + threshold)
    );
  }

  /**
   * Check if the gesture is primarily vertical
   *
   * @param threshold - Maximum angle deviation from vertical (default: 30°)
   */
  isVertical(threshold: number = 30): boolean {
    const angle = this.getDirection();
    // Check if angle is close to 90° (down) or 270° (up)
    return (
      (angle > 90 - threshold && angle < 90 + threshold) ||
      (angle > 270 - threshold && angle < 270 + threshold)
    );
  }

  /**
   * Get total displacement from first sample
   */
  getDisplacement(): { x: number; y: number } {
    if (this.samples.length < 2) {
      return { x: 0, y: 0 };
    }

    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];

    return {
      x: last.x - first.x,
      y: last.y - first.y,
    };
  }

  /**
   * Check if this is a flick/swipe gesture (fast movement)
   *
   * @param threshold - Minimum velocity in px/s to count as flick (default: 300)
   */
  isFlick(threshold: number = 300): boolean {
    return this.getSpeed() > threshold;
  }

  /**
   * Reset the tracker for a new gesture
   */
  reset(): void {
    this.samples = [];
  }

  /**
   * Get the number of samples currently tracked
   */
  getSampleCount(): number {
    return this.samples.length;
  }
}

/**
 * Create a velocity tracker instance
 *
 * Factory function for convenience.
 */
export function createVelocityTracker(
  config?: VelocityTrackerConfig
): VelocityTracker {
  return new VelocityTracker(config);
}

/**
 * Determine gesture direction based on movement angle
 *
 * @param deltaX - Horizontal movement (positive = right)
 * @param deltaY - Vertical movement (positive = down)
 * @param horizontalThreshold - Angle threshold for horizontal (default: 30°)
 * @param verticalThreshold - Angle threshold for vertical (default: 60°)
 * @returns Direction classification
 */
export function determineDirection(
  deltaX: number,
  deltaY: number,
  horizontalThreshold: number = 30,
  verticalThreshold: number = 60
): 'horizontal' | 'vertical' | 'undetermined' {
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  // Need minimum movement to determine direction
  if (distance < 10) {
    return 'undetermined';
  }

  // Calculate angle from horizontal (0° = right, 90° = up/down)
  const angle = Math.atan2(Math.abs(deltaY), Math.abs(deltaX)) * (180 / Math.PI);

  if (angle < horizontalThreshold) {
    return 'horizontal';
  }

  if (angle > verticalThreshold) {
    return 'vertical';
  }

  return 'undetermined';
}
