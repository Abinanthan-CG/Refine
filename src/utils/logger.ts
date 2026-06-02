/**
 * Global Logging System
 * Provides structured, styled logging across the application.
 * Suppresses verbose output in production.
 */

const isProd = import.meta.env.PROD;

export const logger = {
  logError: (context: string, error: unknown) => {
    if (isProd) {
      console.error(`[${context}]`, error);
      return;
    }
    console.error(
      `%c[Error: ${context}]`,
      'color: white; background-color: #ef4444; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
      error
    );
  },

  logWarning: (context: string, message: string) => {
    if (isProd) {
      console.warn(`[${context}]`, message);
      return;
    }
    console.warn(
      `%c[Warning: ${context}]`,
      'color: black; background-color: #f59e0b; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
      message
    );
  },

  logInfo: (context: string, message: string, data?: unknown) => {
    if (isProd) return;
    console.log(
      `%c[Info: ${context}]`,
      'color: white; background-color: #3b82f6; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
      message,
      data !== undefined ? data : ''
    );
  }
};
