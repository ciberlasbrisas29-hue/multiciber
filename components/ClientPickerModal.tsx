"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Radio } from 'lucide-react';

interface Client {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface ClientPickerModalProps {
  isOpen: boolean;
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
  onClose: () => void;
}

const ClientPickerModal: React.FC<ClientPickerModalProps> = ({
  isOpen,
  selectedClient,
  onSelectClient,
  onClose
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients?isActive=true');
      
      if (!response.ok) {
        throw new Error('Error al cargar clientes');
      }

      const data = await response.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleClientClick = (client: Client) => {
    onSelectClient(client);
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
            <h3 className="text-lg font-bold text-gray-900">Selecciona un cliente</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Clients List */}
          <div className="px-4 py-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium mb-2">No hay clientes</p>
                <p className="text-gray-400 text-sm">Agrega un cliente primero</p>
              </div>
            ) : (
              clients.map((client) => {
                const isSelected = selectedClient?._id === client._id;

                return (
                  <button
                    key={client._id}
                    onClick={() => handleClientClick(client)}
                    className="w-full flex items-center justify-between px-4 py-4 mb-2 rounded-xl hover:bg-gray-50 transition-colors active:bg-gray-100"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-500' 
                          : 'bg-purple-50'
                      }`}>
                        <User className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-purple-600'}`} />
                      </div>
                      
                      {/* Client Info */}
                      <div className="flex-1 text-left">
                        <span className="text-sm font-medium text-gray-900 block">
                          {client.name}
                        </span>
                        {client.phone && (
                          <span className="text-xs text-gray-500 block">{client.phone}</span>
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

export default ClientPickerModal;

