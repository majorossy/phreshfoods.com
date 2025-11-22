// src/utils/logger.ts

/**
 * Environment-aware logging utility
 *
 * Only logs in development mode to prevent:
 * - Performance degradation in production (console.log is blocking)
 * - Security concerns (sensitive data exposure)
 * - Cluttered production logs
 *
 * Usage:
 * import { logger } from './utils/logger';
 * logger.log('Debug info:', data);
 * logger.warn('Warning:', issue);
 * logger.error('Error:', error);
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Log general information (development only)
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (development only)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (always logged, but with context filtering in production)
   */
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, log errors but sanitize sensitive data
      // Only log the error message, not the full stack trace
      const sanitizedArgs = args.map(arg => {
        if (arg instanceof Error) {
          return { message: arg.message, name: arg.name };
        }
        return typeof arg === 'object' ? '[Object]' : arg;
      });
      console.error(...sanitizedArgs);
    }
  },

  /**
   * Log information messages (always logged)
   * Use for important user-facing information
   */
  info: (...args: any[]) => {
    console.info(...args);
  },

  /**
   * Performance timing helper (development only)
   */
  time: (label: string) => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },

  /**
   * Group logging (development only)
   */
  group: (label: string) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },
};

export default logger;
