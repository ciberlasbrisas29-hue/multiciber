/**
 * Sistema de logging para la aplicación
 * Reemplaza console.log/error/warn con un sistema más robusto
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

class Logger {
  log(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (isDevelopment) {
      // En desarrollo, mostrar todo con colores
      switch (level) {
        case 'error':
          console.error(logMessage, ...args);
          break;
        case 'warn':
          console.warn(logMessage, ...args);
          break;
        case 'info':
          console.info(logMessage, ...args);
          break;
        default:
          console.log(logMessage, ...args);
      }
    } else if (isProduction) {
      // En producción, solo errores y warnings
      if (level === 'error' || level === 'warn') {
        // Aquí podrías enviar a un servicio de logging externo
        console.error(logMessage, ...args);
      }
    }
  }

  info(message, ...args) {
    this.log('info', message, ...args);
  }

  warn(message, ...args) {
    this.log('warn', message, ...args);
  }

  error(message, ...args) {
    this.log('error', message, ...args);
  }

  debug(message, ...args) {
    if (isDevelopment) {
      this.log('debug', message, ...args);
    }
  }
}

const logger = new Logger();

export default logger;

