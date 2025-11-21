/**
 * Singleton para verificación de autenticación
 * Maneja la verificación de forma independiente del ciclo de vida de React
 */
import { authService } from '@/services/api';

let authCheckPromise = null;
let cachedAuthState = null;
let isChecking = false;
let hasBeenCalled = false; // Flag adicional para prevenir llamadas

/**
 * Verifica la autenticación una sola vez y cachea el resultado
 */
export async function checkAuthOnce() {
  // Si ya hay un resultado cacheado, retornarlo inmediatamente
  if (cachedAuthState !== null) {
    return Promise.resolve(cachedAuthState);
  }

  // Si ya hay una verificación en curso, esperar a que termine
  if (authCheckPromise) {
    return authCheckPromise;
  }

  // Si ya se está verificando, esperar
  if (isChecking) {
    return authCheckPromise || Promise.resolve(cachedAuthState);
  }

  // Si ya se llamó antes y no hay cache, retornar estado no autenticado
  if (hasBeenCalled && cachedAuthState === null) {
    return Promise.resolve({ user: null, token: null });
  }

  // Iniciar nueva verificación
  hasBeenCalled = true;
  isChecking = true;
  authCheckPromise = (async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success && response.data?.user) {
        const user = response.data.user;
        const token = localStorage.getItem('token');
        cachedAuthState = { user, token };
        return cachedAuthState;
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        cachedAuthState = { user: null, token: null };
        return cachedAuthState;
      }
    } catch (error) {
      // Si es un 401, es esperado cuando no hay sesión, no es un error crítico
      // Solo limpiar y retornar estado no autenticado
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      cachedAuthState = { user: null, token: null };
      return cachedAuthState;
    } finally {
      isChecking = false;
      authCheckPromise = null;
    }
  })();

  return authCheckPromise;
}

/**
 * Limpia el cache de autenticación
 */
export function clearAuthCache() {
  cachedAuthState = null;
  authCheckPromise = null;
  isChecking = false;
  hasBeenCalled = false; // Resetear también este flag
}

/**
 * Actualiza el cache de autenticación
 */
export function updateAuthCache(user, token) {
  cachedAuthState = { user, token };
}

