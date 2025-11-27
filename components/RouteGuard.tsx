"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import PacmanLoader from '@/components/PacmanLoader';

interface RouteGuardProps {
  children: React.ReactNode;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pwaInitialLoad, setPwaInitialLoad] = useState(true);
  const hasRedirected = useRef(false);
  const lastPathname = useRef(pathname);
  const wasAuthenticated = useRef(isAuthenticated);

  // Detectar si es PWA iOS y manejar carga inicial
  useEffect(() => {
    const isPWAiOS = () => {
      if (typeof window === 'undefined') return false;
      // Detectar iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      // Detectar PWA (standalone mode)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      return isIOS && isStandalone;
    };

    if (isPWAiOS() && pwaInitialLoad) {
      // Esperar a que la animación del Pacman se complete (2.5s) + tiempo de autenticación
      // La animación completa un ciclo en 2.5s, esperamos al menos 3s para que se vea completo
      const minLoadTime = 3000; // Mínimo 3 segundos para la animación
      const startTime = Date.now();

      const checkReady = () => {
        const elapsed = Date.now() - startTime;
        const authReady = !isLoading;
        
        // Esperar al menos 3s Y que la autenticación esté lista
        if (elapsed >= minLoadTime && authReady) {
          setPwaInitialLoad(false);
        } else {
          // Revisar cada 100ms
          setTimeout(checkReady, 100);
        }
      };

      checkReady();
    } else {
      setPwaInitialLoad(false);
    }
  }, [pwaInitialLoad, isLoading]);

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/register'];
  
  useEffect(() => {
    // Detectar si se está cerrando sesión (cambió de autenticado a no autenticado)
    if (wasAuthenticated.current && !isAuthenticated && !isLoading) {
      setIsLoggingOut(true);
    }
    wasAuthenticated.current = isAuthenticated;

    // Solo procesar si el pathname cambió o si es la primera carga
    if (lastPathname.current !== pathname) {
      hasRedirected.current = false;
      lastPathname.current = pathname;
    }
    
    // Check if auth is still loading
    if (isLoading) {
      setAuthorized(false);
      return;
    }

    const isPublicRoute = publicRoutes.includes(pathname);
    
    if (isAuthenticated && isPublicRoute) {
      // If user is authenticated and trying to access login/register, redirect to home
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        router.replace('/');
      }
      setAuthorized(false);
      return;
    }
    
    if (!isAuthenticated && !isPublicRoute) {
      // If user is not authenticated and trying to access protected route, redirect to login
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        // Usar window.location para evitar problemas con RSC durante logout
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      setAuthorized(false);
      return;
    }
    
    // User is authorized to view the page
    setAuthorized(true);
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show simple message when logging out
  if (isLoggingOut) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#7130f8' }}>
        <div className="flex flex-col items-center space-y-4">
          <p className="text-white text-xl font-semibold">Cerrando sesión...</p>
        </div>
      </div>
    );
  }

  // Show Pacman loader while checking authentication or during PWA iOS initial load
  if (isLoading || pwaInitialLoad) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#7130f8' }}>
        <div className="flex flex-col items-center space-y-4">
          <PacmanLoader />
          <p className="text-white">{pwaInitialLoad ? 'Cargando...' : 'Verificando autenticación...'}</p>
        </div>
      </div>
    );
  }

  // Show simple message while redirecting (no Pacman)
  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#7130f8' }}>
        <div className="flex flex-col items-center space-y-4">
          <p className="text-white text-xl font-semibold">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // User is authorized, render the page
  return <>{children}</>;
};

export default RouteGuard;