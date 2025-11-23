"use client";

import React from 'react';
import { X, Radio } from 'lucide-react';
import {
  Flame,
  Package,
  Home,
  Users,
  Scale,
  Megaphone,
  Truck,
  Settings,
  LayoutGrid,
  MoreHorizontal
} from 'lucide-react';

interface Category {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CategoryPickerModalProps {
  isOpen: boolean;
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
  onClose: () => void;
}

const categories: Category[] = [
  { value: 'servicios', label: 'Servicios públicos', icon: Flame },
  { value: 'suministros', label: 'Compra de productos e insumos', icon: Package },
  { value: 'renta', label: 'Arriendo', icon: Home },
  { value: 'salarios', label: 'Nómina', icon: Users },
  { value: 'marketing', label: 'Mercadeo y publicidad', icon: Megaphone },
  { value: 'transporte', label: 'Transporte, domicilios y logística', icon: Truck },
  { value: 'mantenimiento', label: 'Mantenimiento y reparaciones', icon: Settings },
  { value: 'equipos', label: 'Muebles, equipos o maquinaria', icon: LayoutGrid },
  { value: 'otros', label: 'Otros', icon: MoreHorizontal }
];

const CategoryPickerModal: React.FC<CategoryPickerModalProps> = ({
  isOpen,
  selectedCategory,
  onSelectCategory,
  onClose
}) => {
  if (!isOpen) return null;

  const handleCategoryClick = (categoryValue: string) => {
    onSelectCategory(categoryValue);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[50] bg-black/30 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Bottom Sheet */}
      <div className="fixed inset-0 z-[55] flex items-end justify-center">
        <div
          className="bg-white rounded-t-3xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl animate-slide-up-fade"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
            <h3 className="text-lg font-bold text-gray-900">Escoge una categoría</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Categories List */}
          <div className="px-4 py-4">
            {categories.map((category, index) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.value;

              return (
                <button
                  key={category.value}
                  onClick={() => handleCategoryClick(category.value)}
                  className="w-full flex items-center justify-between px-4 py-4 mb-2 rounded-xl hover:bg-gray-50 transition-colors active:bg-gray-100"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isSelected 
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-500' 
                        : 'bg-purple-50'
                    }`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-purple-600'}`} />
                    </div>
                    
                    {/* Label */}
                    <span className="text-sm font-medium text-gray-900 text-left flex-1">
                      {category.label}
                    </span>
                  </div>

                  {/* Radio Button */}
                  <div className="ml-3">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 border-4 border-purple-600 flex items-center justify-center shadow-md">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryPickerModal;

