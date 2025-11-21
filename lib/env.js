/**
 * Validación y carga de variables de entorno
 */
import logger from './logger';

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
];

const optionalEnvVars = {
  JWT_EXPIRE: '7d',
  NODE_ENV: 'development',
};

/**
 * Valida que todas las variables de entorno requeridas estén presentes
 */
export function validateEnv() {
  const missing = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    const error = `Faltan variables de entorno requeridas: ${missing.join(', ')}`;
    logger.error(error);
    throw new Error(error);
  }
  
  // Validar JWT_SECRET tiene suficiente longitud
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET es demasiado corto. Se recomienda al menos 32 caracteres para producción.');
  }
  
  // Establecer valores por defecto para variables opcionales
  for (const [key, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  }
  
  logger.info('Variables de entorno validadas correctamente');
}

// Validar al cargar el módulo
if (typeof window === 'undefined') {
  // Solo validar en el servidor
  try {
    validateEnv();
  } catch (error) {
    // En desarrollo, solo mostrar advertencia
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Advertencia de variables de entorno:', error.message);
    } else {
      throw error;
    }
  }
}

