"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, LogOut } from 'lucide-react';
import Logo from '@/components/Logo';
import NotificationsDropdown from './NotificationsDropdown';
import { useLowStock } from '@/hooks/useLowStock';

const Header = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { lowStockData } = useLowStock(true); // Escuchar eventos de actualización

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
    <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 pt-12 pb-8 rounded-b-3xl shadow-lg md:rounded-none md:pt-6 md:pb-4">
      <div className="flex items-center justify-between mb-6 md:max-w-7xl md:mx-auto md:px-8 lg:px-12 xl:px-16 md:mb-4">
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
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors relative"
              title="Notificaciones"
            >
              <Bell className="w-5 h-5" />
              {/* Badge de notificación con contador de stock bajo */}
              {lowStockData && lowStockData.count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center px-1 shadow-lg border-2 border-white">
                  <span className="text-[10px] font-bold text-white">
                    {lowStockData.count > 9 ? '9+' : lowStockData.count}
                  </span>
                </span>
              )}
            </button>
            {/* Dropdown de notificaciones */}
            {showNotifications && (
              <NotificationsDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onStockUpdated={() => {
                  // Las notificaciones se actualizarán automáticamente con el hook
                }}
              />
            )}
          </div>
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

