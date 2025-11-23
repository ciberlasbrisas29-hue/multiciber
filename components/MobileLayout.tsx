"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import BottomNavbar from './BottomNavbar';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  
  // Rutas públicas que no deben mostrar el layout móvil
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname?.startsWith('/catalog');

  // Si es una ruta pública, renderizar sin el layout móvil
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Para rutas autenticadas, mostrar el layout móvil completo
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 pb-20">
      <Header />
      <div className="px-6 -mt-4">
        {children}
      </div>
      <BottomNavbar />
    </div>
  );
};

export default MobileLayout;

