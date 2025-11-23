"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Search, Phone, Mail, MapPin, Edit2, Trash2 } from 'lucide-react';

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
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center space-x-3 rounded-b-3xl shadow-lg -mt-4 mb-4">
        <Building2 className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Proveedores</h1>
      </div>

      <div className="px-6 space-y-4">
        {/* Search and Add Button */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar proveedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => router.push('/suppliers/new')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Nuevo</span>
          </button>
        </div>

        {/* Suppliers List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-purple-100">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">No hay proveedores</p>
            <p className="text-gray-400 text-sm mb-6">Comienza agregando tu primer proveedor</p>
            <button
              onClick={() => router.push('/suppliers/new')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Agregar Proveedor</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {suppliers.map((supplier) => (
              <div
                key={supplier._id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{supplier.name}</h3>
                    <div className="space-y-1">
                      {supplier.phone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{supplier.email}</span>
                        </div>
                      )}
                      {supplier.address && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="line-clamp-1">{supplier.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => router.push(`/suppliers/edit/${supplier._id}`)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(supplier._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuppliersPage;

