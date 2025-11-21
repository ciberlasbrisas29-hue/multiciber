"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Limpiar errores cuando el usuario empieza a escribir
  const hasClearedError = useRef(false);
  useEffect(() => {
    if (error && !hasClearedError.current) {
      hasClearedError.current = true;
      const timer = setTimeout(() => {
        clearError();
        hasClearedError.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };
  
  if (isAuthenticated) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Fondo superior con bloque morado y ondas degradadas */}
      <div className="relative w-full h-64 md:h-80 overflow-hidden">
        {/* Bloque morado principal */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700"></div>
        
        {/* Ondas degradadas */}
        <div className="absolute bottom-0 left-0 right-0">
          {/* Onda 1 - Morado claro */}
          <svg 
            className="absolute bottom-0 w-full h-24 md:h-32" 
            viewBox="0 0 1440 120" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path 
              d="M0,60 C240,100 480,20 720,40 C960,60 1200,80 1440,40 L1440,120 L0,120 Z" 
              fill="#a78bfa" 
              fillOpacity="0.8"
            />
          </svg>
          
          {/* Onda 2 - Morado más claro */}
          <svg 
            className="absolute bottom-0 w-full h-20 md:h-28" 
            viewBox="0 0 1440 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path 
              d="M0,50 C240,80 480,30 720,50 C960,70 1200,50 1440,30 L1440,100 L0,100 Z" 
              fill="#c4b5fd" 
              fillOpacity="0.6"
            />
          </svg>
        </div>

        {/* Logo centrado en la parte superior */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white rounded-full p-3 shadow-2xl">
            <Logo width={100} height={100} alt="Logo Multiciber" />
          </div>
        </div>
      </div>

      {/* Formulario sobre fondo blanco */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 -mt-16 md:-mt-20 relative z-20">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6" role="alert">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Input Email */}
            <div className="mb-6">
              <label 
                htmlFor="email" 
                className="block text-gray-600 text-sm font-medium mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu email"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                required
              />
            </div>

            {/* Input Password */}
            <div className="mb-8">
              <label 
                htmlFor="password" 
                className="block text-gray-600 text-sm font-medium mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200"
                required
              />
            </div>

            {/* Botón Login con degradado morado */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-4 focus:ring-purple-300"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                </div>
              ) : (
                'Login'
              )}
            </button>

            {/* Enlace Sign Up */}
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="text-blue-400 hover:text-blue-500 text-sm font-medium transition-colors duration-200"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
