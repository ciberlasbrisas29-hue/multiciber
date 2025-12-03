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
  X,
  Sparkles
} from 'lucide-react';
import axios from 'axios';
import WhatsAppTestPanel from '@/components/WhatsAppTestPanel';

// Estilos para animaciones
const settingsStyles = `
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
`;

interface BusinessSettings {
  _id?: string;
  catalogSlug?: string;
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
        setSuccess('¡Listo! Perfil actualizado');
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
        setSuccess('¡Listo! Configuración guardada');
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
      <>
        <style dangerouslySetInnerHTML={{__html: settingsStyles}} />
        <div className="min-h-screen pb-24 bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-purple-400 opacity-20"></div>
              </div>
              <p className="text-gray-600 font-semibold">Cargando...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: settingsStyles}} />
      <div className="min-h-screen pb-24 bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50">
        {/* Header */}
        <div className="text-white px-6 py-4 flex items-center space-x-3 rounded-b-2xl mb-6 -mx-6 md:mx-0 md:rounded-2xl shadow-md" style={{ backgroundColor: '#7031f8' }}>
          <Settings className="w-5 h-5 opacity-95" />
          <h1 className="text-2xl font-semibold">Ajustes</h1>
        </div>

      <div className="px-4 space-y-6">

        {/* Mensajes de error y éxito Mejorados */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}
        {success && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-2xl shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-semibold">{success}</span>
            </div>
          </div>
        )}

        {/* Sección 1: Configuración del Negocio Mejorada */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border-2 border-purple-100 relative overflow-hidden"
          style={{
            animation: 'fadeInUp 0.4s ease-out both'
          }}
        >
          <div className="relative z-10">
          <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-3 shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
            </div>
              <h2 className="text-xl font-extrabold text-gray-900">Configuración del Negocio</h2>
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
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-300 shadow-sm hover:shadow-md transition-all"
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
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-300 shadow-sm hover:shadow-md transition-all resize-none"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-300 shadow-sm hover:shadow-md transition-all"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-300 shadow-sm hover:shadow-md transition-all"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-300 shadow-sm hover:shadow-md transition-all"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-300 shadow-sm hover:shadow-md transition-all"
                  placeholder="negocio@ejemplo.com"
                />
              </div>
            </div>

            {/* Botón de guardar Mejorado */}
            <button
              onClick={handleSaveBusinessProfile}
              disabled={saving}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:shadow-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
          </div>
        </div>

        {/* Sección 2: Configuración Financiera Mejorada */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border-2 border-purple-100 relative overflow-hidden"
          style={{
            animation: 'fadeInUp 0.4s ease-out 0.1s both'
          }}
        >
          <div className="relative z-10">
          <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
            </div>
              <h2 className="text-xl font-extrabold text-gray-900">Configuración Financiera</h2>
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
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-bold rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center space-x-1"
                >
                  <span>+ Agregar</span>
                </button>
              </div>
              <div className="space-y-2">
                {financialSettings.paymentMethods.map((method, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-2xl border-2 border-gray-200 hover:border-purple-200 hover:bg-purple-50/50 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-gray-700 font-bold">{method.name}</span>
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
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all active:scale-95"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón de guardar Mejorado */}
            <button
              onClick={handleSaveFinancialSettings}
              disabled={saving}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
            </button>
          </div>
          </div>
        </div>

        {/* Sección 3: Prueba de Notificaciones WhatsApp */}
        <div
          style={{
            animation: 'fadeInUp 0.4s ease-out 0.2s both'
          }}
        >
          <WhatsAppTestPanel className="mb-6" />
        </div>
      </div>
    </div>
    </>
  );
};

export default SettingsPage;

