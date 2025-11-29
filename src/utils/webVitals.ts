// src/utils/webVitals.ts
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';
import type { Metric } from 'web-vitals';

/**
 * Web Vitals monitoring utility
 * Tracks Core Web Vitals and sends them to analytics or console
 */

// Configuration
const DEBUG_MODE = import.meta.env.DEV; // Only log in development
const ANALYTICS_ENDPOINT = import.meta.env.VITE_ANALYTICS_ENDPOINT;

/**
 * Threshold values for good/needs improvement/poor
 * Based on Google's Core Web Vitals thresholds
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift (score)
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
  INP: { good: 200, poor: 500 },   // Interaction to Next Paint (ms)
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte (ms)
};

/**
 * Get rating based on metric value and thresholds
 */
function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metricName as keyof typeof THRESHOLDS];
  if (!threshold) return 'needs-improvement';

  if (value <= threshold.good) return 'good';
  if (value > threshold.poor) return 'poor';
  return 'needs-improvement';
}

/**
 * Format metric value for display
 */
function formatValue(metricName: string, value: number): string {
  if (metricName === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}

/**
 * Send metric to analytics endpoint
 */
async function sendToAnalytics(metric: Metric) {
  const body = {
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
  };

  // If you have an analytics endpoint, send data there
  if (ANALYTICS_ENDPOINT) {
    try {
      await fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error('Failed to send metrics to analytics:', error);
    }
  }

  // In development, always log to console
  if (DEBUG_MODE) {
    const rating = getRating(metric.name, metric.value);
    const emoji = rating === 'good' ? '✅' : rating === 'poor' ? '❌' : '⚠️';
    const formattedValue = formatValue(metric.name, metric.value);

    console.log(
      `${emoji} ${metric.name}: ${formattedValue} (${rating})`,
      {
        value: metric.value,
        rating,
        delta: metric.delta,
        entries: metric.entries,
        navigationType: metric.navigationType,
      }
    );
  }
}

/**
 * Initialize Web Vitals monitoring
 * Call this once when the app loads
 */
export function initWebVitals(): void {
  // Core Web Vitals (affect SEO rankings)
  onLCP(sendToAnalytics);  // Largest Contentful Paint
  onCLS(sendToAnalytics);  // Cumulative Layout Shift
  onINP(sendToAnalytics);  // Interaction to Next Paint (replaced FID)

  // Additional metrics
  onFCP(sendToAnalytics);  // First Contentful Paint
  onTTFB(sendToAnalytics); // Time to First Byte

  if (DEBUG_MODE) {
    console.log('🚀 Web Vitals monitoring initialized');
    console.log('📊 Metrics will appear as users interact with the page');
  }
}

/**
 * Get current Web Vitals for display in UI
 * Returns a promise that resolves with current metrics
 */
export async function getCurrentVitals(): Promise<Record<string, any>> {
  const vitals: Record<string, any> = {};

  // Capture current values
  await new Promise(resolve => {
    onLCP(metric => { vitals.LCP = metric; });
    onCLS(metric => { vitals.CLS = metric; });
    onFCP(metric => { vitals.FCP = metric; });
    onINP(metric => { vitals.INP = metric; });
    onTTFB(metric => { vitals.TTFB = metric; });
    setTimeout(resolve, 100); // Wait briefly for metrics to be captured
  });

  return vitals;
}

/**
 * Create a performance mark for custom timing
 */
export function markPerformance(markName: string): void {
  if ('performance' in window && 'mark' in performance) {
    performance.mark(markName);
    if (DEBUG_MODE) {
      console.log(`⏱️ Performance mark: ${markName}`);
    }
  }
}

/**
 * Measure time between two marks
 */
export function measurePerformance(
  measureName: string,
  startMark: string,
  endMark?: string
): number | null {
  if (!('performance' in window && 'measure' in performance)) {
    return null;
  }

  try {
    performance.measure(measureName, startMark, endMark);
    const measures = performance.getEntriesByName(measureName);
    const duration = measures[measures.length - 1]?.duration || 0;

    if (DEBUG_MODE) {
      console.log(`⏱️ ${measureName}: ${Math.round(duration)}ms`);
    }

    return duration;
  } catch (error) {
    console.error('Failed to measure performance:', error);
    return null;
  }
}

/**
 * Report custom app-specific metrics
 */
export function reportCustomMetric(name: string, value: number, unit: string = 'ms'): void {
  if (DEBUG_MODE) {
    console.log(`📈 Custom metric - ${name}: ${value}${unit}`);
  }

  // Send to analytics if configured
  if (ANALYTICS_ENDPOINT) {
    fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: `custom_${name}`,
        value,
        unit,
        url: window.location.href,
        timestamp: Date.now(),
      }),
    }).catch(console.error);
  }
}