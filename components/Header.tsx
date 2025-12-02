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
    // Obtener la hora de El Salvador (UTC-6)
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const elSalvadorTime = new Date(utcTime + (-6 * 3600000)); // UTC-6
    const hour = elSalvadorTime.getHours();
    
    // Dividir en períodos según la hora de El Salvador
    if (hour >= 0 && hour < 6) {
      // Madrugada: 0:00 - 5:59
      return 'Buenas noches';
    } else if (hour >= 6 && hour < 12) {
      // Mañana: 6:00 - 11:59
      return 'Buenos días';
    } else if (hour >= 12 && hour < 18) {
      // Tarde: 12:00 - 17:59
      return 'Buenas tardes';
    } else {
      // Noche: 18:00 - 23:59
      return 'Buenas noches';
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      // Usar window.location para evitar problemas con RSC durante logout
      window.location.href = '/login';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Si falla, intentar redirigir de todas formas
      window.location.href = '/login';
    }
  };

  const userName = user?.username || 'Usuario';

  return (
    <header className="text-white px-6 pt-12 pb-8 rounded-b-2xl shadow-md md:rounded-none md:pt-6 md:pb-4" style={{ backgroundColor: '#7031f8' }}>
      <div className="flex items-center justify-between mb-6 md:max-w-7xl md:mx-auto md:px-8 lg:px-12 xl:px-16 md:mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 overflow-hidden">
            <Logo width={52} height={52} alt="Logo Multiciber" className="rounded-full" />
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

