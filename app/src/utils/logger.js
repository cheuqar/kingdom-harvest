/**
 * Structured logging utility for the Monopoly Bible game
 * Provides consistent, timestamped logging with channels
 */

const CHANNELS = {
  GAME: 'Game',
  NETWORK: 'Network',
  FIREBASE: 'Firebase',
  STATE: 'State',
  UI: 'UI'
};

/**
 * Internal log function
 */
function log(channel, level, message, data) {
  const timestamp = new Date().toISOString().substr(11, 12);
  const prefix = `[${timestamp}][${channel}]`;

  const logFn = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;

  if (data !== undefined) {
    logFn(prefix, message, data);
  } else {
    logFn(prefix, message);
  }
}

/**
 * Logger API
 */
export const logger = {
  // Channel-specific info logging
  game: (msg, data) => log(CHANNELS.GAME, 'INFO', msg, data),
  network: (msg, data) => log(CHANNELS.NETWORK, 'INFO', msg, data),
  firebase: (msg, data) => log(CHANNELS.FIREBASE, 'INFO', msg, data),
  state: (msg, data) => log(CHANNELS.STATE, 'INFO', msg, data),
  ui: (msg, data) => log(CHANNELS.UI, 'INFO', msg, data),

  // Error and warning with channel parameter
  error: (channel, msg, error) => log(channel, 'ERROR', msg, error),
  warn: (channel, msg, data) => log(channel, 'WARN', msg, data),

  // Convenience methods for common patterns
  action: (actionName, payload) => {
    if (payload !== undefined) {
      log(CHANNELS.GAME, 'INFO', `Action: ${actionName}`, payload);
    } else {
      log(CHANNELS.GAME, 'INFO', `Action: ${actionName}`);
    }
  },

  phase: (from, to) => {
    log(CHANNELS.GAME, 'INFO', `Phase: ${from} -> ${to}`);
  }
};

export default logger;
