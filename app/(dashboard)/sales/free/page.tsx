"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, CreditCard, Wallet, Building2, MoreHorizontal } from 'lucide-react';
import { salesService } from '@/services/api';
import Toast from '@/components/Toast';

const FreeSalePage = () => {
  const router = useRouter();
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'other'>('cash');
  const [concept, setConcept] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning'; isVisible: boolean } | null>(null);

  const paymentMethods = [
    { value: 'cash', label: 'Efectivo', icon: Wallet },
    { value: 'card', label: 'Tarjeta', icon: CreditCard },
    { value: 'transfer', label: 'Transferencia', icon: Building2 },
    { value: 'other', label: 'Otro', icon: MoreHorizontal },
  ];

  const handleSubmit = async () => {
    const numericAmount = parseFloat(amount);
    
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setToast({
        message: 'Por favor ingresa un monto válido',
        type: 'warning',
        isVisible: true
      });
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        type: 'free',
        status: 'paid',
        items: [],
        subtotal: numericAmount,
        discount: 0,
        discountType: 'amount',
        total: numericAmount,
        paymentMethod,
        freeSaleAmount: numericAmount,
        client: clientName ? { name: clientName } : undefined,
        concept: concept || undefined,
      };

      const response = await salesService.createSale(saleData);
      
      if (response.success) {
        setToast({
          message: 'Venta libre registrada exitosamente',
          type: 'success',
          isVisible: true
        });
        
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setToast({
          message: 'Error al registrar la venta: ' + (response.message || 'Error desconocido'),
          type: 'error',
          isVisible: true
        });
      }
    } catch (error: any) {
      console.error('Error al procesar venta libre:', error);
      setToast({
        message: 'Error al procesar la venta: ' + (error.response?.data?.message || error.message || 'Error desconocido'),
        type: 'error',
        isVisible: true
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 mb-6 -mx-6 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center active:opacity-70"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">Venta libre</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Formulario */}
      <div className="space-y-6">
        {/* Monto */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto
          </label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-12 pr-4 py-4 text-2xl font-bold text-gray-900 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Método de pago */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Método de pago
          </label>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.value;
              return (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value as any)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${
                    isSelected ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    isSelected ? 'text-purple-600' : 'text-gray-600'
                  }`}>
                    {method.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cliente (opcional) */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cliente (opcional)
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Nombre del cliente"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Concepto (opcional) */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Concepto (opcional)
          </label>
          <textarea
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Descripción de la venta"
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
          />
        </div>

        {/* Botón de confirmar */}
        <button
          onClick={handleSubmit}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Registrando...' : `Registrar venta $${parseFloat(amount || '0').toFixed(2)}`}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default FreeSalePage;

