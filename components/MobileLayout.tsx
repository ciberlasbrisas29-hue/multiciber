"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { useScanner } from '@/contexts/ScannerContext';
import Header from './Header';
import BottomNavbar from './BottomNavbar';
import GlobalSearch from './GlobalSearch';
import PageTransition from './PageTransition';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { isScannerOpen } = useScanner();
  
  // Rutas públicas que no deben mostrar el layout móvil
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname?.startsWith('/catalog');

  // Si es una ruta pública, renderizar sin el layout móvil
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Para rutas autenticadas, mostrar el layout móvil completo
  // Ocultar Header y BottomNavbar cuando el escáner está abierto
  return (
    <>
      <GlobalSearch />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50">
        <PageTransition>
          <div className="min-h-screen pb-20 md:pb-0">
      {!isScannerOpen && <Header />}
      {/* Contenedor principal: móvil sin límite, desktop centrado con max-width */}
      <div className="px-6 -mt-4 md:px-0 md:-mt-0">
        {/* En desktop: contenedor centrado con max-width y padding adecuado */}
        <div className="md:max-w-7xl md:mx-auto md:px-8 lg:px-12 xl:px-16 md:py-8">
          {children}
        </div>
      </div>
      {!isScannerOpen && <BottomNavbar />}
    </div>
        </PageTransition>
      </div>
    </>
  );
};

export default MobileLayout;

