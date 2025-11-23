"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Plus, Search, Phone, Mail, MapPin, Edit2, Trash2, DollarSign } from 'lucide-react';

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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar cliente');
      }

      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error al eliminar cliente');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center space-x-3 rounded-b-3xl shadow-lg -mt-4 mb-4">
        <User className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Clientes</h1>
      </div>

      <div className="px-6 space-y-4">
        {/* Search and Add Button */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => router.push('/clients/new')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Nuevo</span>
          </button>
        </div>

        {/* Clients List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-purple-100">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">No hay clientes</p>
            <p className="text-gray-400 text-sm mb-6">Comienza agregando tu primer cliente</p>
            <button
              onClick={() => router.push('/clients/new')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Agregar Cliente</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => (
              <div
                key={client._id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{client.name}</h3>
                      {client.totalDebt && client.totalDebt > 0 && (
                        <div className="flex items-center space-x-1 px-3 py-1 bg-red-50 rounded-full">
                          <DollarSign className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-bold text-red-600">{formatCurrency(client.totalDebt)}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      {client.phone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{client.email}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="line-clamp-1">{client.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => router.push(`/clients/edit/${client._id}`)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(client._id)}
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

export default ClientsPage;

