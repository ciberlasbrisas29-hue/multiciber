/**
 * Middleware de autenticación y autorización
 */
import { verifyAuth } from './auth';
import { AuthenticationError, AuthorizationError } from './errors';
import { NextResponse } from 'next/server';
import logger from './logger';

/**
 * Middleware para verificar autenticación
 * Retorna el userId si está autenticado, null si no
 */
export async function requireAuth(req) {
  const userId = await verifyAuth();
  
  if (!userId) {
    logger.warn('Intento de acceso no autorizado', { url: req.url });
    throw new AuthenticationError('Debes iniciar sesión para acceder a este recurso');
  }
  
  return userId;
}

/**
 * Middleware para verificar roles
 * @param {Array<string>} allowedRoles - Roles permitidos
 */
export function requireRole(allowedRoles) {
  return async (req, user) => {
    if (!user) {
      user = await requireAuth(req);
      // Obtener el usuario completo para verificar el rol
      const User = (await import('./models/User')).default;
      const userDoc = await User.findById(user);
      
      if (!userDoc) {
        throw new AuthenticationError('Usuario no encontrado');
      }
      
      if (!allowedRoles.includes(userDoc.role)) {
        logger.warn('Intento de acceso sin permisos', { 
          userId: user.toString(), 
          role: userDoc.role,
          requiredRoles: allowedRoles,
          url: req.url 
        });
        throw new AuthorizationError('No tienes permisos para realizar esta acción');
      }
      
      return userDoc;
    }
    
    return user;
  };
}

/**
 * Wrapper para rutas API que requieren autenticación
 */
export function withAuth(handler, options = {}) {
  return async (req, context) => {
    try {
      const userId = await requireAuth(req);
      
      // Si se requiere un rol específico
      if (options.roles && options.roles.length > 0) {
        const User = (await import('./models/User')).default;
        const user = await User.findById(userId);
        
        if (!user) {
          throw new AuthenticationError('Usuario no encontrado');
        }
        
        if (!options.roles.includes(user.role)) {
          throw new AuthorizationError('No tienes permisos para realizar esta acción');
        }
        
        // Pasar el usuario al handler
        return handler(req, context, userId, user);
      }
      
      return handler(req, context, userId);
    } catch (error) {
      const { handleError } = await import('./errors');
      const errorResponse = handleError(error, req);
      
      return NextResponse.json(
        {
          success: errorResponse.success,
          message: errorResponse.message,
          ...(errorResponse.errors && { errors: errorResponse.errors }),
        },
        { status: errorResponse.statusCode }
      );
    }
  };
}

