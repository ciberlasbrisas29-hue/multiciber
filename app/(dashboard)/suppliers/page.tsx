"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Search, Phone, Mail, MapPin, Edit2, Trash2, Users } from 'lucide-react';

// Estilos para animaciones
const suppliersStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

interface Supplier {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const SuppliersPage = () => {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, [searchTerm]);

  useEffect(() => {
    // Escuchar eventos de creación y actualización de proveedor
    const handleSupplierUpdate = () => {
      fetchSuppliers();
    };

    window.addEventListener('supplier-created', handleSupplierUpdate);
    window.addEventListener('supplier-updated', handleSupplierUpdate);
    return () => {
      window.removeEventListener('supplier-created', handleSupplierUpdate);
      window.removeEventListener('supplier-updated', handleSupplierUpdate);
    };
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/suppliers?isActive=true${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`);
      
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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      return;
    }

    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar proveedor');
      }

      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Error al eliminar proveedor');
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: suppliersStyles}} />
      <div className="space-y-6 pb-24">
        {/* Header Mejorado */}
        <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-500 text-white px-4 py-4 flex items-center space-x-3 rounded-b-2xl mb-6 -mx-6 md:mx-0 md:rounded-2xl shadow-xl relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
          </div>
          <div className="relative z-10 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold drop-shadow-lg">Proveedores</h1>
          </div>
        </div>

      <div className="mx-4 space-y-4">
        {/* Search and Add Button Mejorados */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <input
              type="text"
              placeholder="🔍 Buscar proveedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border-2 border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 shadow-md hover:shadow-lg transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => router.push('/suppliers/new')}
            className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span className="font-bold">Nuevo</span>
          </button>
        </div>

        {/* Suppliers List Mejorada */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-purple-400 opacity-20"></div>
            </div>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-xl border-2 border-purple-100 relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
              <Building2 className="w-full h-full text-purple-600" />
            </div>
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-purple-600" />
              </div>
              <p className="text-gray-700 text-xl font-bold mb-2">Aún no tienes proveedores</p>
              <p className="text-gray-500 text-sm mb-6">Agrega tu primer proveedor para empezar</p>
              <button
                onClick={() => router.push('/suppliers/new')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span className="font-bold">Agregar Proveedor</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {suppliers.map((supplier, index) => (
              <div
                key={supplier._id}
                className="bg-white rounded-2xl p-4 shadow-lg border-2 border-purple-100 hover:border-purple-200 hover:shadow-xl transition-all duration-200 relative overflow-hidden"
                style={{
                  animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                }}
              >
                <div className="relative z-10">
                  {/* Header del proveedor */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-extrabold text-gray-900 truncate">{supplier.name}</h3>
                    </div>
                  </div>

                  {/* Información de contacto */}
                  <div className="space-y-2 mb-4">
                    {supplier.phone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="font-medium">{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="font-medium truncate">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="font-medium line-clamp-1">{supplier.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-purple-100">
                    <button
                      onClick={() => router.push(`/suppliers/edit/${supplier._id}`)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center space-x-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="text-sm font-bold">Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(supplier._id)}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-bold">Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default SuppliersPage;

