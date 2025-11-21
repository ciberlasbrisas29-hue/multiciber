"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, LogOut } from 'lucide-react';
import Logo from '@/components/Logo';

const Header = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const userName = user?.username || 'Usuario';

  return (
    <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 pt-12 pb-8 rounded-b-3xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 overflow-hidden">
            <Logo width={56} height={56} alt="Logo Multiciber" className="rounded-full" />
          </div>
          <div>
            <p className="text-sm opacity-90">{getGreeting()}</p>
            <h1 className="text-2xl font-bold">{userName}</h1>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 relative">
            <Bell className="w-5 h-5" />
            {/* Badge de notificación */}
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">N</span>
            </span>
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

