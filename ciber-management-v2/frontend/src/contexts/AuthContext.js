import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/api';

// Estado inicial
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
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
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
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
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Crear contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
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

  // Verificar si hay datos guardados en localStorage al cargar la app
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('🔍 Verificando localStorage:', { token, user });
    
    // Solo restaurar la sesión si hay datos válidos
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        // Verificar que el token sea válido
        if (token && token !== 'null' && token !== 'undefined' && token.length > 10) {
          console.log('✅ Restaurando sesión:', userData);
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user: userData, token },
          });
        } else {
          console.log('❌ Token inválido, limpiando localStorage');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.log('❌ Error al parsear user data:', error);
        // Si hay error al parsear, limpiar localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      console.log('❌ No hay datos en localStorage');
    }
  }, []);

  // Función de login
  const login = async (username, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      // Simular login con credenciales mock
      if (username === 'admin' && password === 'admin123') {
        const mockUser = {
          id: '1',
          username: 'admin',
          email: 'admin@multiciber.com',
          role: 'admin',
          full_name: 'Administrador'
        };
        
        const mockToken = 'mock-jwt-token-' + Date.now();
        
        // Guardar en localStorage
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: mockUser, token: mockToken },
        });
        
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: 'Usuario o contraseña incorrectos',
        });
        return { success: false, error: 'Usuario o contraseña incorrectos' };
      }
    } catch (error) {
      const errorMessage = 'Error de conexión';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Función de registro
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const response = await authService.register(userData);
      
      if (response.success) {
        const { user, token } = response.data;
        
        // Guardar en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token },
        });
        
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: response.message || 'Error en el registro',
        });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error de conexión';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      // Limpiar localStorage completamente
      localStorage.clear();
      
      // Actualizar el estado
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
      // Esperar un momento para que el estado se actualice
      setTimeout(() => {
        // Forzar recarga de la página para ir al login
        window.location.href = '/';
      }, 100);
      
      // Opcional: llamar a la API si está disponible
      try {
        await authService.logout();
      } catch (apiError) {
        // Si la API falla, no importa, ya limpiamos el estado local
        console.log('API logout falló, pero el logout local fue exitoso');
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aún así, limpiar el estado local
      localStorage.clear();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      // Forzar recarga de la página
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  };

  // Función para limpiar errores
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};