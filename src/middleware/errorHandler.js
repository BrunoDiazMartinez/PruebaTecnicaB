const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const config = require('../config');

const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred', {
    error: err,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  let statusCode = 500;
  let errorResponse = {
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  };

  if (err.isOperational && err instanceof AppError) {
    statusCode = err.statusCode;
    errorResponse = err.toJSON();
  }
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorResponse = {
      error: {
        message: err.message,
        code: 'VALIDATION_ERROR',
        details: err.errors || null
      }
    };
  }
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    errorResponse = {
      error: {
        message: 'Invalid JSON payload',
        code: 'INVALID_JSON'
      }
    };
  }
  else {
    if (config.server.isProduction) {
      errorResponse = {
        error: {
          message: 'An unexpected error occurred',
          code: 'INTERNAL_ERROR'
        }
      };
    } else {
      errorResponse = {
        error: {
          message: err.message || 'Internal server error',
          code: 'INTERNAL_ERROR',
          stack: err.stack
        }
      };
    }

    logger.error('Unexpected error', {
      error: err,
      stack: err.stack
    });
  }

  if (req.id) {
    errorResponse.error.requestId = req.id;
  }

  errorResponse.error.timestamp = new Date().toISOString();

  res.status(statusCode).json(errorResponse);
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    res.setTimeout(timeout, () => {
      const error = new AppError(
        'Request timeout',
        408,
        'REQUEST_TIMEOUT'
      );
      next(error);
    });
    next();
  };
};

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  logger.request(req);

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.response(req, res, responseTime);
  });

  next();
};

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler,
  requestTimeout,
  requestLogger
};
