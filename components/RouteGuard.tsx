"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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
        router.replace('/login');
      }
      setAuthorized(false);
      return;
    }
    
    // User is authorized to view the page
    setAuthorized(true);
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Show loading spinner while redirecting
  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // User is authorized, render the page
  return <>{children}</>;
};

export default RouteGuard;