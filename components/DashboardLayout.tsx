"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await logout();
    router.push('/login');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Home', icon: 'fa-home' },
    { href: '/balance', label: 'Balance', icon: 'fa-file-alt' },
    { href: '/debts', label: 'Deudas', icon: 'fa-percentage' },
    { href: '/inventory', label: 'Inventario', icon: 'fa-boxes' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar for Desktop */}
      <nav className="bg-white shadow-md hidden md:flex items-center justify-between p-4 fixed top-0 left-0 w-full z-10">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <Logo width={40} height={40} alt="Logo Multiciber" />
            <span className="font-bold text-xl text-gray-800">Multiciber</span>
          </Link>
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className={`px-4 py-2 rounded-lg text-sm font-medium ${pathname === link.href ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <i className="fas fa-user-circle"></i>
                <span>{user.username || 'Usuario'}</span>
              </div>
            )}
          <button 
            onClick={handleLogout} 
            disabled={isLoggingOut} 
            className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-sign-out-alt"></i>
            <span className="text-sm font-medium">
              {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
            </span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 md:pt-16 pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white shadow-t-md flex justify-around items-center p-2 z-10 border-t">
         {navLinks.map(link => (
            <Link key={link.href} href={link.href} className={`flex flex-col items-center justify-center w-1/5 ${pathname === link.href ? 'text-teal-600' : 'text-gray-500'}`}>
                <i className={`fas ${link.icon} text-xl`}></i>
                <span className="text-xs mt-1">{link.label}</span>
            </Link>
        ))}
        <button 
          onClick={handleLogout} 
          disabled={isLoggingOut}
          className={`flex flex-col items-center justify-center w-1/5 ${isLoggingOut ? 'text-gray-400' : 'text-red-500'}`}
        >
          <i className="fas fa-sign-out-alt text-xl"></i>
          <span className="text-xs mt-1">Salir</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardLayout;
