/**
 * Simple logger utility
 * - Wraps console methods
 * - Suppresses output when NODE_ENV === 'test'
 * - Easy to extend with levels or remote logging
 */
const isTest = process.env.NODE_ENV === 'test';

const logger = {
  log: (...args) => {
    if (!isTest) console.log(...args);
  },
  info: (...args) => {
    if (!isTest) console.info(...args);
  },
  warn: (...args) => {
    if (!isTest) console.warn(...args);
  },
  error: (...args) => {
    if (!isTest) console.error(...args);
  },
  debug: (...args) => {
    if (!isTest && console.debug) console.debug(...args);
  },
  // Placeholder for future extension (levels, remote sinks, etc.)
  setLevel: () => {},
};

export default logger;
