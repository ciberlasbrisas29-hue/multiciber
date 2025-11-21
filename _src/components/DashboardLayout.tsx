"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await logout();
    router.push('/login');
  };

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
            <Image src="/assets/images/logo.png" alt="Logo" width={40} height={40} />
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
            <div className="relative">
                <button className="flex items-center space-x-2">
                    <span>{user?.username || 'Usuario'}</span>
                    <i className="fas fa-chevron-down text-xs"></i>
                </button>
                {/* Dropdown can be implemented here */}
            </div>
          <button onClick={handleLogout} disabled={isLoggingOut} className="text-sm font-medium text-gray-600 hover:text-teal-700">
            {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 md:pt-16 pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white shadow-t-md flex justify-around items-center p-2 z-10">
         {navLinks.map(link => (
            <Link key={link.href} href={link.href} className={`flex flex-col items-center justify-center w-1/4 ${pathname === link.href ? 'text-teal-600' : 'text-gray-500'}`}>
                <i className={`fas ${link.icon} text-xl`}></i>
                <span className="text-xs mt-1">{link.label}</span>
            </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardLayout;
