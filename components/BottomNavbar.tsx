"use client";

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Package, Plus, DollarSign, Settings } from 'lucide-react';
import SaleTypeModal from './SaleTypeModal';

const BottomNavbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  const navItems = [
    { 
      icon: Home, 
      label: 'Inicio', 
      path: '/',
      active: pathname === '/'
    },
    { 
      icon: Package, 
      label: 'Inventario', 
      path: '/inventory',
      active: pathname.startsWith('/inventory')
    },
    { 
      icon: Plus, 
      label: 'Venta', 
      path: '/sales/new',
      active: pathname.startsWith('/sales')
    },
    { 
      icon: DollarSign, 
      label: 'Balance', 
      path: '/balance',
      active: pathname.startsWith('/balance')
    },
    { 
      icon: Settings, 
      label: 'Más', 
      path: '/settings',
      active: pathname.startsWith('/settings')
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 shadow-2xl z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isSpecial = item.label === 'Venta';
          const isActive = item.active;

          return (
            <button
              key={index}
              onClick={() => {
                if (isSpecial) {
                  // Abrir modal de selección de tipo de venta
                  setIsSaleModalOpen(true);
                } else {
                  // Navegación normal para otros botones
                  router.push(item.path);
                }
              }}
              className="flex flex-col items-center space-y-1 active:scale-95 transition-transform"
            >
              {isSpecial ? (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg -mt-2">
                  <Icon className="w-7 h-7 text-white" />
                </div>
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isActive 
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                    : 'bg-gray-100'
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                </div>
              )}
              <span className={`text-xs font-medium ${
                isActive ? 'text-purple-600' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Modal de selección de tipo de venta */}
      <SaleTypeModal 
        isOpen={isSaleModalOpen} 
        onClose={() => setIsSaleModalOpen(false)} 
      />
    </nav>
  );
};

export default BottomNavbar;

