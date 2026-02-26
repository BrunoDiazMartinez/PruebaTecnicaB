// Clases de Error personalizadas para manejo de errores

class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        ...(this.details && { details: this.details })
      }
    };
  }
}

class APIError extends AppError {
  constructor(message, statusCode = 503, code = 'API_ERROR', details = null) {
    super(message, statusCode, code, details);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class NotFoundError extends AppError {
  constructor(resource, identifier) {
    super(
      `${resource} with identifier '${identifier}' not found`,
      404,
      'NOT_FOUND'
    );
    this.resource = resource;
    this.identifier = identifier;
  }
}

class ServiceError extends AppError {
  constructor(message, statusCode = 500, code = 'SERVICE_ERROR', details = null) {
    super(message, statusCode, code, details);
  }
}

module.exports = {
  AppError,
  APIError,
  ValidationError,
  NotFoundError,
  ServiceError
};
