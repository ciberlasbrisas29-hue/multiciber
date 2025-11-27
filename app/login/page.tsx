"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Logo from '@/components/Logo';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Contenedor principal */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo y título */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-40 h-40 md:w-44 md:h-44 bg-white/20 backdrop-blur-md rounded-full p-2 shadow-2xl mb-4 border-2 border-white/30 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <Logo width={140} height={140} alt="Logo Multiciber" className="object-contain" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 drop-shadow-lg">
            Bienvenido
          </h1>
          <p className="text-white/80 text-sm">Inicia sesión para continuar</p>
        </div>

        {/* Formulario con glassmorphism */}
        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20 animate-scale-in">
          {/* Mensaje de error mejorado */}
          {error && (
            <div className="mb-6 bg-red-500/20 backdrop-blur-sm border-2 border-red-400/50 text-red-100 p-4 rounded-xl flex items-start space-x-3 animate-shake" role="alert">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium flex-1">{error}</p>
            </div>
          )}

          {/* Input Email con icono */}
          <div className="mb-6">
            <label 
              htmlFor="email" 
              className="block text-white/90 text-sm font-semibold mb-2"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="email"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) clearError();
                }}
                placeholder="Ingresa tu email"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 shadow-lg transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Input Password con icono y toggle */}
          <div className="mb-8">
            <label 
              htmlFor="password" 
              className="block text-white/90 text-sm font-semibold mb-2"
            >
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
                placeholder="Ingresa tu contraseña"
                className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 shadow-lg transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Botón Login mejorado */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-white to-white/90 text-purple-600 font-bold py-4 px-6 rounded-xl shadow-2xl hover:shadow-white/50 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-4 focus:ring-white/30 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent mr-2"></div>
                <span>Iniciando sesión...</span>
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>

        </form>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
