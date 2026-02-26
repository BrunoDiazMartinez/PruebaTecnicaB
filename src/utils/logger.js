const config = require('../config');

const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logObject = {
    timestamp,
    level,
    message,
    ...(Object.keys(meta).length > 0 && { meta })
  };
  return JSON.stringify(logObject);
};

class Logger {
  error(message, error = {}) {
    const meta = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...(error.code && { code: error.code }),
          ...(error.statusCode && { statusCode: error.statusCode })
        }
      : error;
    
    console.error(formatLog(LogLevel.ERROR, message, meta));
  }

  warn(message, meta = {}) {
    console.warn(formatLog(LogLevel.WARN, message, meta));
  }

  info(message, meta = {}) {
    console.log(formatLog(LogLevel.INFO, message, meta));
  }

  debug(message, meta = {}) {
    if (config.server.isDevelopment) {
      console.log(formatLog(LogLevel.DEBUG, message, meta));
    }
  }

  request(req) {
    this.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  }

  response(req, res, responseTime) {
    this.info('HTTP Response', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`
    });
  }
}

module.exports = new Logger();
