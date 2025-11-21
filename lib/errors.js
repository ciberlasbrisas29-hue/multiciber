/**
 * Clases de error personalizadas y utilidades para manejo de errores
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = {}) {
    super(message, 400);
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'No tienes permisos para realizar esta acción') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Error de conexión a la base de datos') {
    super(message, 503);
  }
}

/**
 * Maneja errores y retorna respuesta apropiada
 */
export function handleError(error, req = null) {
  // Si es un error operacional conocido, retornar mensaje específico
  if (error instanceof AppError) {
    return {
      success: false,
      message: error.message,
      ...(error.errors && { errors: error.errors }),
      statusCode: error.statusCode,
    };
  }

  // Errores de validación de Mongoose
  if (error.name === 'ValidationError') {
    const errors = {};
    Object.keys(error.errors || {}).forEach((key) => {
      errors[key] = error.errors[key].message;
    });
    return {
      success: false,
      message: 'Error de validación en los datos',
      errors,
      statusCode: 400,
    };
  }

  // Errores de MongoDB
  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    return {
      success: false,
      message: 'Error de conexión a la base de datos',
      statusCode: 503,
    };
  }

  // Error de JWT
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return {
      success: false,
      message: 'Token inválido o expirado',
      statusCode: 401,
    };
  }

  // Error desconocido - no exponer detalles en producción
  const isDevelopment = process.env.NODE_ENV === 'development';
  return {
    success: false,
    message: isDevelopment 
      ? error.message 
      : 'Error interno del servidor',
    ...(isDevelopment && { stack: error.stack }),
    statusCode: 500,
  };
}

