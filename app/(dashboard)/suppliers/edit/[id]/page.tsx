"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText
} from 'lucide-react';

const EditSupplierPage = () => {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setFetching(true);
        const response = await fetch(`/api/suppliers/${supplierId}`);
        
        if (!response.ok) {
          throw new Error('Error al cargar proveedor');
        }

        const data = await response.json();
        if (data.supplier) {
          setFormData({
            name: data.supplier.name || '',
            phone: data.supplier.phone || '',
            email: data.supplier.email || '',
            address: data.supplier.address || '',
            notes: data.supplier.notes || ''
          });
        }
      } catch (error) {
        console.error('Error fetching supplier:', error);
        alert('Error al cargar el proveedor');
        router.push('/suppliers');
      } finally {
        setFetching(false);
      }
    };

    if (supplierId) {
      fetchSupplier();
    }
  }, [supplierId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
          address: formData.address.trim() || undefined,
          notes: formData.notes.trim() || undefined
        }),
      });

      const data = await response.json();

      if (response.ok && data.supplier) {
        // Disparar evento para actualizar la lista
        window.dispatchEvent(new CustomEvent('supplier-updated'));
        // Redirigir a la lista de proveedores
        router.push('/suppliers');
      } else {
        alert(data.error || 'Error al actualizar el proveedor');
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      alert('Error al actualizar el proveedor');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen pb-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center space-x-3 rounded-b-3xl shadow-lg -mt-4 mb-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <Building2 className="w-6 h-6" />
        <h1 className="text-xl font-bold text-white">Editar proveedor</h1>
      </div>

      <div className="px-6 py-4 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre del Proveedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del proveedor <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                placeholder="Ej: Distribuidora ABC S.A."
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                placeholder="Ej: 2222-0000"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                placeholder="Ej: contacto@proveedor.com"
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm resize-none"
                placeholder="Ej: Calle Principal, Colonia Centro, San Salvador"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm resize-none"
                placeholder="Información adicional sobre el proveedor..."
              />
            </div>
          </div>

          {/* Botón de Acción Principal */}
          <div className="pt-4 pb-6">
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all shadow-lg ${
                loading || !formData.name.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-[0.98] shadow-md'
              }`}
            >
              {loading ? 'Guardando cambios...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSupplierPage;

