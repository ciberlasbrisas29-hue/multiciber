"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Building2,
  DollarSign,
  CreditCard,
  ChevronRight,
  Save,
  Upload,
  X
} from 'lucide-react';
import axios from 'axios';
import WhatsAppTestPanel from '@/components/WhatsAppTestPanel';

interface BusinessSettings {
  _id?: string;
  businessName?: string;
  businessDescription?: string;
  businessAddress?: string;
  businessPhone?: string;
  whatsappPhone?: string;
  businessEmail?: string;
  businessLogo?: string;
  currency?: string;
  currencySymbol?: string;
  paymentMethods?: Array<{
    name: string;
    isActive: boolean;
    icon: string;
  }>;
}

const SettingsPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados del formulario
  const [businessProfile, setBusinessProfile] = useState({
    businessName: '',
    businessDescription: '',
    businessAddress: '',
    businessPhone: '',
    whatsappPhone: '',
    businessEmail: '',
    businessLogo: ''
  });

  const [financialSettings, setFinancialSettings] = useState({
    paymentMethods: [
      { name: 'Efectivo', isActive: true, icon: 'cash' },
      { name: 'Tarjeta', isActive: true, icon: 'credit-card' },
      { name: 'Transferencia', isActive: true, icon: 'bank' }
    ]
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/settings');
      if (response.data.success) {
        const data = response.data.data;
        setSettings(data);
        
        // Actualizar estados del formulario
        setBusinessProfile({
          businessName: data.businessName || '',
          businessDescription: data.businessDescription || '',
          businessAddress: data.businessAddress || '',
          businessPhone: data.businessPhone || '',
          whatsappPhone: data.whatsappPhone || '',
          businessEmail: data.businessEmail || '',
          businessLogo: data.businessLogo || ''
        });

        setFinancialSettings({
          paymentMethods: data.paymentMethods || [
            { name: 'Efectivo', isActive: true, icon: 'cash' },
            { name: 'Tarjeta', isActive: true, icon: 'credit-card' },
            { name: 'Transferencia', isActive: true, icon: 'bank' }
          ]
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBusinessProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await axios.put('/api/settings', {
        ...businessProfile,
        currency: 'USD',
        currencySymbol: '$',
        paymentMethods: financialSettings.paymentMethods
      });

      if (response.data.success) {
        setSuccess('Perfil del negocio actualizado exitosamente');
        setSettings(response.data.data);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFinancialSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await axios.put('/api/settings', {
        ...businessProfile,
        currency: 'USD',
        currencySymbol: '$',
        paymentMethods: financialSettings.paymentMethods
      });

      if (response.data.success) {
        setSuccess('Configuración financiera actualizada exitosamente');
        setSettings(response.data.data);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la configuración financiera');
    } finally {
      setSaving(false);
    }
  };

  const togglePaymentMethod = (index: number) => {
    const updatedMethods = [...financialSettings.paymentMethods];
    updatedMethods[index].isActive = !updatedMethods[index].isActive;
    setFinancialSettings({
      ...financialSettings,
      paymentMethods: updatedMethods
    });
  };

  const addPaymentMethod = () => {
    const newMethod = prompt('Ingresa el nombre del método de pago:');
    if (newMethod && newMethod.trim()) {
      setFinancialSettings({
        ...financialSettings,
        paymentMethods: [
          ...financialSettings.paymentMethods,
          { name: newMethod.trim(), isActive: true, icon: 'credit-card' }
        ]
      });
    }
  };

  const removePaymentMethod = (index: number) => {
    const updatedMethods = financialSettings.paymentMethods.filter((_, i) => i !== index);
    setFinancialSettings({
      ...financialSettings,
      paymentMethods: updatedMethods
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando configuración...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="px-6 py-6">
        {/* Título y descripción */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ajustes</h1>
          <p className="text-gray-600">Configuración de la aplicación y tu negocio</p>
        </div>

        {/* Mensajes de error y éxito */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
            {success}
          </div>
        )}

        {/* Sección 1: Configuración del Negocio */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-purple-100">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Configuración del Negocio</h2>
          </div>

          <div className="space-y-4">
            {/* Nombre del negocio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Negocio
              </label>
              <input
                type="text"
                value={businessProfile.businessName}
                onChange={(e) => setBusinessProfile({ ...businessProfile, businessName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ej: Multiciber Fast Food"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={businessProfile.businessDescription}
                onChange={(e) => setBusinessProfile({ ...businessProfile, businessDescription: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Descripción de tu negocio"
              />
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                value={businessProfile.businessAddress}
                onChange={(e) => setBusinessProfile({ ...businessProfile, businessAddress: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Dirección completa"
              />
            </div>

            {/* Teléfono, WhatsApp y Email en fila */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={businessProfile.businessPhone}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, businessPhone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={businessProfile.whatsappPhone}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, whatsappPhone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={businessProfile.businessEmail}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, businessEmail: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="negocio@ejemplo.com"
                />
              </div>
            </div>

            {/* Botón de guardar */}
            <button
              onClick={handleSaveBusinessProfile}
              disabled={saving}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </div>

        {/* Sección 2: Configuración Financiera */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-purple-100">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Configuración Financiera</h2>
          </div>

           <div className="space-y-6">
             {/* Métodos de Pago */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Métodos de Pago
                </label>
                <button
                  onClick={addPaymentMethod}
                  className="text-sm text-purple-600 font-medium hover:text-purple-700 flex items-center space-x-1"
                >
                  <span>+ Agregar</span>
                </button>
              </div>
              <div className="space-y-2">
                {financialSettings.paymentMethods.map((method, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700 font-medium">{method.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => togglePaymentMethod(index)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          method.isActive ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            method.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => removePaymentMethod(index)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón de guardar */}
            <button
              onClick={handleSaveFinancialSettings}
              disabled={saving}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
            </button>
          </div>
        </div>

        {/* Sección 3: Prueba de Notificaciones WhatsApp */}
        <WhatsAppTestPanel className="mb-6" />
      </div>
    </div>
  );
};

export default SettingsPage;

