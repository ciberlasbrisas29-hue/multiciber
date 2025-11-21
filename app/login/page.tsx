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
      router.replace('/'); // Redirige al dashboard
    }
  }, [isAuthenticated, isLoading, router]);

  // Limpiar errores cuando el usuario empieza a escribir (solo una vez)
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
  
  // Si ya está autenticado, no mostrar nada mientras redirige
  if (isAuthenticated) {
    return null; 
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Panel izquierdo: Formulario */}
      <div className="w-full md:w-1/2 lg:w-1/3 bg-white flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-6">
             <Logo width={80} height={80} alt="Logo Multiciber" />
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Bienvenido
          </h1>
          <p className="text-center text-gray-500 mb-8">
            Inicia sesión para continuar
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg w-full focus:outline-none focus:shadow-outline transition-colors duration-300 disabled:bg-teal-400"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>
             <div className="text-center mt-4">
                <a href="#" className="inline-block align-baseline font-bold text-sm text-teal-600 hover:text-teal-800">
                    ¿Olvidaste tu contraseña?
                </a>
            </div>
          </form>
        </div>
      </div>

      {/* Panel derecho: Bienvenida */}
      <div className="hidden md:flex w-1/2 lg:w-2/3 bg-teal-600 items-center justify-center p-12 text-white relative overflow-hidden">
         <div 
            className="absolute top-0 left-0 w-full h-full"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
          ></div>
        <div className="z-10 text-center">
            <h1 className="text-5xl font-bold mb-4">Sistema de Gestión</h1>
            <p className="text-xl text-teal-100">Multiciber Las Brisas</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
