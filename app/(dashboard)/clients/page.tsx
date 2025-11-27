"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Plus, Search, Phone, Mail, MapPin, Edit2, Trash2, DollarSign, Users, Sparkles, AlertCircle } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';

// Estilos para animaciones
const clientsStyles = `
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

interface Client {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalDebt?: number;
}

const ClientsPage = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, [searchTerm]);

  useEffect(() => {
    // Escuchar eventos de creación y actualización de cliente
    const handleClientUpdate = () => {
      fetchClients();
    };

    // También escuchar eventos de actualización de deudas
    window.addEventListener('client-created', handleClientUpdate);
    window.addEventListener('client-updated', handleClientUpdate);
    window.addEventListener('debt-updated', handleClientUpdate);
    window.addEventListener('sale-created', handleClientUpdate);
    return () => {
      window.removeEventListener('client-created', handleClientUpdate);
      window.removeEventListener('client-updated', handleClientUpdate);
      window.removeEventListener('debt-updated', handleClientUpdate);
      window.removeEventListener('sale-created', handleClientUpdate);
    };
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients?isActive=true${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar clientes');
      }

      const data = await response.json();
      const clientsList = data.clients || [];
      
      // Obtener deudas para cada cliente
      const clientsWithDebts = await Promise.all(
        clientsList.map(async (client: Client) => {
          try {
            const debtsResponse = await fetch(`/api/clients/${client._id}/debts`);
            if (debtsResponse.ok) {
              const debtsData = await debtsResponse.json();
              return { ...client, totalDebt: debtsData.totalDebt || 0 };
            }
            return { ...client, totalDebt: 0 };
          } catch (error) {
            console.error(`Error fetching debts for client ${client._id}:`, error);
            return { ...client, totalDebt: 0 };
          }
        })
      );
      
      setClients(clientsWithDebts);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-SV', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${deleteConfirm.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar cliente');
      }

      fetchClients();
      showToast('Cliente eliminado exitosamente', 'success');
    } catch (error) {
      console.error('Error deleting client:', error);
      showToast('Error al eliminar cliente', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: clientsStyles}} />
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
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold drop-shadow-lg">Clientes</h1>
          </div>
        </div>

      <div className="mx-4 space-y-4">
        {/* Search and Add Button Mejorados */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <input
              type="text"
              placeholder="🔍 Buscar clientes..."
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
            onClick={() => router.push('/clients/new')}
            className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span className="font-bold">Nuevo</span>
          </button>
        </div>

        {/* Clients List Mejorada */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-purple-400 opacity-20"></div>
            </div>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-xl border-2 border-purple-100 relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
              <Users className="w-full h-full text-purple-600" />
            </div>
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-purple-600" />
              </div>
              <p className="text-gray-700 text-xl font-bold mb-2">No hay clientes</p>
              <p className="text-gray-500 text-sm mb-6">Comienza agregando tu primer cliente</p>
              <button
                onClick={() => router.push('/clients/new')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span className="font-bold">Agregar Cliente</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client, index) => (
              <div
                key={client._id}
                className="bg-white rounded-2xl p-4 shadow-lg border-2 border-purple-100 hover:border-purple-200 hover:shadow-xl transition-all duration-200 relative overflow-hidden"
                style={{
                  animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                }}
              >
                <div className="relative z-10">
                  {/* Header del cliente */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-extrabold text-gray-900 truncate">{client.name}</h3>
                    </div>
                    {client.totalDebt && client.totalDebt > 0 && (
                      <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 shadow-sm ml-2 flex-shrink-0">
                        <DollarSign className="w-3.5 h-3.5 text-red-600" />
                        <span className="text-xs font-bold text-red-600">{formatCurrency(client.totalDebt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Información de contacto */}
                  <div className="space-y-2 mb-4">
                    {client.phone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="font-medium">{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="font-medium truncate">{client.email}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="font-medium line-clamp-1">{client.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-purple-100">
                    <button
                      onClick={() => router.push(`/clients/edit/${client._id}`)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center space-x-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="text-sm font-bold">Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(client._id)}
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

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Eliminar Cliente"
        message={`¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
        isLoading={isDeleting}
      />
    </div>
    </>
  );
};

export default ClientsPage;

