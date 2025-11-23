"use client";

import React, { useState, useEffect } from 'react';
import { X, Building2, Radio } from 'lucide-react';

interface Supplier {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface SupplierPickerModalProps {
  isOpen: boolean;
  selectedSupplier: Supplier | null;
  onSelectSupplier: (supplier: Supplier) => void;
  onClose: () => void;
}

const SupplierPickerModal: React.FC<SupplierPickerModalProps> = ({
  isOpen,
  selectedSupplier,
  onSelectSupplier,
  onClose
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/suppliers?isActive=true');
      
      if (!response.ok) {
        throw new Error('Error al cargar proveedores');
      }

      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSupplierClick = (supplier: Supplier) => {
    onSelectSupplier(supplier);
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
            <h3 className="text-lg font-bold text-gray-900">Escoge un proveedor</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Suppliers List */}
          <div className="px-4 py-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium mb-2">No hay proveedores</p>
                <p className="text-gray-400 text-sm">Agrega un proveedor primero</p>
              </div>
            ) : (
              suppliers.map((supplier) => {
                const isSelected = selectedSupplier?._id === supplier._id;

                return (
                  <button
                    key={supplier._id}
                    onClick={() => handleSupplierClick(supplier)}
                    className="w-full flex items-center justify-between px-4 py-4 mb-2 rounded-xl hover:bg-gray-50 transition-colors active:bg-gray-100"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-500' 
                          : 'bg-purple-50'
                      }`}>
                        <Building2 className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-purple-600'}`} />
                      </div>
                      
                      {/* Supplier Info */}
                      <div className="flex-1 text-left">
                        <span className="text-sm font-medium text-gray-900 block">
                          {supplier.name}
                        </span>
                        {supplier.phone && (
                          <span className="text-xs text-gray-500 block">{supplier.phone}</span>
                        )}
                      </div>
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
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierPickerModal;

