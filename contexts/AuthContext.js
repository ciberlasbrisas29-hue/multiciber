"use client";

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback, useMemo } from 'react';
import { authService } from '@/services/api';
import { checkAuthOnce, clearAuthCache, updateAuthCache } from '@/lib/auth-checker';

// Flag global para prevenir múltiples inicializaciones (persiste entre re-renders)
let globalAuthInitialized = false;

// Estado inicial
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Inicia en true para verificar el token
  error: null,
};

// Tipos de acciones
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  INITIALIZE: 'INITIALIZE',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.INITIALIZE:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!action.payload.user, // Verificar user, no token
        isLoading: false,
      };
    case AUTH_ACTIONS.LOGIN_START:
      return { ...state, isLoading: true, error: null };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return { ...state, isLoading: false, error: action.payload };
    case AUTH_ACTIONS.LOGOUT:
      return { ...initialState, isLoading: false };
    case AUTH_ACTIONS.CLEAR_ERROR:
        return { ...state, error: null };
    default:
      return state;
  }
};

// Crear contexto
const AuthContext = createContext();

// Hook personalizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

// Provider del contexto
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const hasInitializedRef = useRef(false);
  const initPromiseRef = useRef(null);

  useEffect(() => {
    // Si ya se inicializó globalmente, no hacer nada
    if (globalAuthInitialized) {
      if (!hasInitializedRef.current) {
        // Si el componente local no se ha inicializado pero globalmente sí,
        // usar el cache del singleton
        checkAuthOnce().then((result) => {
          if (!hasInitializedRef.current && result !== undefined) {
            hasInitializedRef.current = true;
            dispatch({ type: AUTH_ACTIONS.INITIALIZE, payload: result });
          }
        });
      }
      return;
    }

    // Si ya se inicializó este componente, no hacer nada
    if (hasInitializedRef.current) {
      return;
    }

    // Si ya hay una inicialización en curso, no hacer nada
    if (initPromiseRef.current) {
      return;
    }

    // Marcar como inicializado globalmente
    globalAuthInitialized = true;

    // Usar el singleton para verificar autenticación
    // Esto garantiza que solo se haga una llamada al servidor
    initPromiseRef.current = checkAuthOnce()
      .then((result) => {
        // Verificar nuevamente antes de hacer dispatch
        if (!hasInitializedRef.current && result !== undefined) {
          hasInitializedRef.current = true;
          dispatch({ type: AUTH_ACTIONS.INITIALIZE, payload: result });
        }
        initPromiseRef.current = null;
      })
      .catch(() => {
        if (!hasInitializedRef.current) {
          hasInitializedRef.current = true;
          dispatch({ type: AUTH_ACTIONS.INITIALIZE, payload: { user: null, token: null } });
        }
        initPromiseRef.current = null;
      });

    // Cleanup function
    return () => {
      // No hacer nada en cleanup, solo prevenir múltiples ejecuciones
    };
  }, []);

  const login = useCallback(async (username, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    try {
      const responseData = await authService.login(username, password);
      
      const { user, token } = responseData.data; 

      if (user) {
        // Guardar en localStorage para compatibilidad (se puede eliminar después de migración completa)
        if (token) {
          localStorage.setItem('token', token);
        }
        localStorage.setItem('user', JSON.stringify(user));
        
        // Actualizar el cache del singleton
        updateAuthCache(user, token);
        
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user, token: token || 'cookie' } });
        return { success: true };
      } else {
        throw new Error(responseData.message || 'Error de login: credenciales inválidas o respuesta inesperada del servidor.');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Llamar al endpoint de logout para limpiar la cookie
      await authService.logout();
    } catch (error) {
      // Continuar con el logout local incluso si falla la llamada
    } finally {
      // Limpiar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Limpiar el cache del singleton
      clearAuthCache();
      // Resetear los flags
      hasInitializedRef.current = false;
      globalAuthInitialized = false;
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Memoizar el valor del contexto para evitar re-renders innecesarios
  // Solo actualizar cuando cambien los valores relevantes
  const value = useMemo(() => ({
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    clearError,
  }), [
    state.user,
    state.token,
    state.isAuthenticated,
    state.isLoading,
    state.error,
    login,
    logout,
    clearError,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
