import axios from 'axios';

// Configuración base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Suprimir errores de consola para rutas públicas
  validateStatus: function (status) {
    // Permitir que axios maneje todos los códigos de estado
    // pero marcar 401 en rutas públicas como "no error" para evitar logs
    return status >= 200 && status < 600;
  },
});

// Interceptor para agregar token de autenticación
// Las cookies httpOnly se envían automáticamente, pero mantenemos compatibilidad con localStorage
// para transición gradual
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Verificar si estamos en una ruta pública y la petición es a /auth/me
      // En este caso, evitar la petición para prevenir el error 401 en consola
      const currentPath = window.location.pathname;
      const publicRoutes = ['/login', '/register'];
      const isPublicRoute = publicRoutes.includes(currentPath);
      
      if (isPublicRoute && config.url?.includes('/auth/me')) {
        // Marcar la petición para que el interceptor de respuesta la maneje
        config._skipAuthCheck = true;
      }
      
      // Intentar obtener token de localStorage (para compatibilidad durante transición)
      const token = localStorage.getItem('token');
      
      // Si hay token en localStorage, agregarlo al header (para compatibilidad)
      // Nota: Las cookies httpOnly se envían automáticamente por el navegador
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // El header x-user-id ya no es necesario ya que el servidor verifica el token de la cookie
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
// Este código solo se ejecutará en el lado del cliente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      // Limpiar localStorage si existe (compatibilidad)
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      // Solo redirigir si no estamos ya en login o register
      // Esto previene bucles infinitos
      const currentPath = window.location.pathname;
      const publicRoutes = ['/login', '/register'];
      const isPublicRoute = publicRoutes.includes(currentPath);
      
      // Para rutas públicas, el 401 es esperado y no debe mostrarse como error
      // Especialmente para /auth/me que se llama al cargar la página
      if ((isPublicRoute && error.config?.url?.includes('/auth/me')) || error.config?._skipAuthCheck) {
        // En lugar de rechazar la promesa (que causa que se muestre en consola),
        // retornar una respuesta exitosa con datos vacíos
        // Esto evita que axios muestre el error en la consola
        // IMPORTANTE: Esto debe hacerse ANTES de que axios muestre el error
        return Promise.resolve({
          data: {
            success: false,
            message: 'No autenticado',
            data: { user: null }
          },
          status: 200,
          statusText: 'OK',
          headers: error.response?.headers || {},
          config: error.config
        });
      }
      
      if (!isPublicRoute) {
        // Solo redirigir si no estamos en una ruta pública
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      return response.data;
    } catch (error) {
      // Si es un error 401 (credenciales inválidas), devolver el mensaje de error
      if (error.response?.status === 401) {
        return {
          success: false,
          message: error.response?.data?.message || 'Credenciales inválidas',
          data: null
        };
      }
      // Para otros errores, lanzar normalmente
      throw error;
    }
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      // Si es un 401, es esperado cuando no hay sesión (ej: en página de login)
      // Retornar respuesta silenciosa sin lanzar error
      if (error.response?.status === 401 || error.silent) {
        return {
          success: false,
          message: 'No autenticado',
          data: { user: null }
        };
      }
      // Para otros errores, lanzar normalmente
      throw error;
    }
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// Servicios del dashboard
export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getRecentSales: async (limit = 10) => {
    const response = await api.get(`/dashboard/recent-sales?limit=${limit}`);
    return response.data;
  },

  getRecentExpenses: async (limit = 10) => {
    const response = await api.get(`/dashboard/recent-expenses?limit=${limit}`);
    return response.data;
  },
};

// Servicios de productos
export const productsService = {
    getProducts: async (params = {}) => {
        const response = await api.get('/products', { params });
        return response.data;
    },
    getProduct: async (id) => {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },
    createProduct: async (productData) => {
        const response = await api.post('/products', productData);
        return response.data;
    },
    updateProduct: async (id, productData) => {
        const response = await api.put(`/products/${id}`, productData);
        return response.data;
    },
    deleteProduct: async (id) => {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    },
    getStats: async () => {
        const response = await api.get('/products/stats/overview');
        return response.data;
    }
};


// Servicios de ventas
export const salesService = {
  getSales: async (params = {}) => {
    const response = await api.get('/sales', { params });
    return response.data;
  },

  getSale: async (id) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  createSale: async (saleData) => {
    const response = await api.post('/sales', saleData);
    return response.data;
  },

  updateSale: async (id, saleData) => {
    const response = await api.put(`/sales/${id}`, saleData);
    return response.data;
  },

  deleteSale: async (id) => {
    const response = await api.delete(`/sales/${id}`);
    return response.data;
  },
};

// Servicios de gastos
export const expensesService = {
  getExpenses: async (params = {}) => {
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  getExpense: async (id) => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  createExpense: async (expenseData) => {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },

  updateExpense: async (id, expenseData) => {
    const response = await api.put(`/expenses/${id}`, expenseData);
    return response.data;
  },

  deleteExpense: async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/expenses/categories');
    return response.data;
  },
};

export default api;
