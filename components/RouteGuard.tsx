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
  const hasRedirected = useRef(false);
  const lastPathname = useRef(pathname);

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/register'];
  
  useEffect(() => {
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

  // Show Pacman loader while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#7130f8' }}>
        <div className="flex flex-col items-center space-y-4">
          <PacmanLoader />
          <p className="text-white">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Show Pacman loader while redirecting
  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#7130f8' }}>
        <div className="flex flex-col items-center space-y-4">
          <PacmanLoader />
          <p className="text-white">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // User is authorized, render the page
  return <>{children}</>;
};

export default RouteGuard;