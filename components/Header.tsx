"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell } from 'lucide-react';
import Logo from '@/components/Logo';

const Header = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
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
        <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 relative">
          <Bell className="w-5 h-5" />
          {/* Badge de notificación */}
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">N</span>
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;

