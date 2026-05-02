/**
 * Centralized Logging Utility
 */

const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

class Logger {
  constructor(prefix = 'APP') {
    this.prefix = prefix;
    const env = globalThis.process?.env?.NODE_ENV || 'development';
    this.isDevelopment = env !== 'production';
  }

  _formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this.prefix}] [${level}] ${message}`;
  }

  debug(message, data = null) {
    if (!this.isDevelopment) return;
    const formatted = this._formatMessage(LogLevel.DEBUG, message);
    console.log(formatted, data || '');
  }

  info(message, data = null) {
    const formatted = this._formatMessage(LogLevel.INFO, message);
    console.info(formatted, data || '');
  }

  warn(message, data = null) {
    const formatted = this._formatMessage(LogLevel.WARN, message);
    console.warn(formatted, data || '');
  }

  error(message, error = null) {
    const formatted = this._formatMessage(LogLevel.ERROR, message);
    console.error(formatted, error || '');
  }

  success(message, data = null) {
    const formatted = this._formatMessage('SUCCESS', message);
    console.log(formatted, data || '');
  }
}

export default Logger;
