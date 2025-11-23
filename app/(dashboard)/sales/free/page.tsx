"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  DollarSign,
  CreditCard,
  Wallet,
  Building2,
  MoreHorizontal,
  Info,
  User
} from 'lucide-react';
import DatePickerModal from '@/components/DatePickerModal';
import ClientPickerModal from '@/components/ClientPickerModal';
import { salesService } from '@/services/api';

const FreeSalePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Estados para modales
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  
  // Estado del formulario
  const [saleType, setSaleType] = useState<'paid' | 'debt'>('paid'); // 'paid' = Pagado, 'debt' = Deuda
  const [formData, setFormData] = useState({
    saleDate: new Date(),
    amount: '',
    client: null as { name: string; phone?: string; email?: string } | null,
    discount: '',
    discountType: 'percentage' as 'percentage' | 'amount', // 'percentage' o 'amount'
    concept: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'transfer' | 'other',
    paidAmount: '' // Solo para deudas (abono)
  });

  // Format date para mostrar
  const formatDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const saleDate = new Date(date);
    saleDate.setHours(0, 0, 0, 0);

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const isToday = saleDate.getTime() === today.getTime();
    const day = saleDate.getDate();
    const month = monthNames[saleDate.getMonth()];
    
    if (isToday) {
      return `Hoy, ${day} ${month}`;
    } else {
      const dayName = dayNames[saleDate.getDay()];
      return `${dayName}, ${day} ${month}`;
    }
  };

  // Calcular valores
  const calculateValues = () => {
    const amount = parseFloat(formData.amount || '0');
    const discount = parseFloat(formData.discount || '0');
    
    let discountAmount = 0;
    let subtotal = amount;

    if (discount > 0) {
      if (formData.discountType === 'percentage') {
        discountAmount = (amount * discount) / 100;
      } else {
        discountAmount = discount;
      }
      subtotal = amount - discountAmount;
    }

    const total = subtotal;
    const paidAmountValue = saleType === 'debt' ? parseFloat(formData.paidAmount || '0') : total;
    const remainingAmount = saleType === 'debt' ? total - paidAmountValue : 0;

    return { subtotal, discountAmount, total, paidAmount: paidAmountValue, remainingAmount };
  };

  const { subtotal, discountAmount, total, paidAmount, remainingAmount } = calculateValues();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const numericAmount = parseFloat(formData.amount || '0');
      const numericDiscount = parseFloat(formData.discount || '0');
      const numericPaidAmount = saleType === 'debt' ? parseFloat(formData.paidAmount || '0') : total;

      if (!formData.amount || numericAmount <= 0) {
        alert('Por favor ingresa un valor válido');
        setLoading(false);
        return;
      }

      if (saleType === 'debt' && (!formData.paidAmount || numericPaidAmount <= 0)) {
        alert('Por favor ingresa el monto del abono');
        setLoading(false);
        return;
      }

      if (saleType === 'debt' && numericPaidAmount >= total) {
        alert('El abono no puede ser mayor o igual al total. Si pagó el total completo, selecciona "Pagado"');
        setLoading(false);
        return;
      }

      let discountValue = 0;
      if (numericDiscount > 0) {
        if (formData.discountType === 'percentage') {
          discountValue = (numericAmount * numericDiscount) / 100;
        } else {
          discountValue = numericDiscount;
        }
      }

      const saleData = {
        type: 'free',
        status: saleType === 'paid' ? 'paid' : 'debt',
        items: [],
        subtotal: numericAmount,
        discount: discountValue,
        discountType: formData.discountType,
        total: total,
        paymentMethod: formData.paymentMethod,
        freeSaleAmount: numericAmount,
        client: formData.client || undefined,
        concept: formData.concept || undefined,
        paidAmount: saleType === 'debt' ? numericPaidAmount : total,
        debtAmount: saleType === 'debt' ? remainingAmount : 0
      };

      const response = await salesService.createSale(saleData);
      
      if (response.success) {
        window.dispatchEvent(new CustomEvent('sale-created'));
        
        // Si es deuda, redirigir a la sección de deudas
        if (saleType === 'debt') {
          router.push('/balance?tab=debts');
        } else {
          router.push('/');
        }
        router.refresh();
      } else {
        alert(response.message || 'Error al guardar la venta');
      }
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Error al guardar la venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header con gradiente morado/índigo - se combina con el header principal */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center space-x-3 rounded-b-3xl shadow-lg -mt-4 mb-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">Nueva venta</h1>
      </div>

      <div className="px-6 py-4 pb-24 space-y-4">
        {/* Selector de Estado: Pagado vs Deuda */}
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-md border border-gray-100">
          <button
            type="button"
            onClick={() => setSaleType('paid')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
              saleType === 'paid'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pagado
          </button>
          <button
            type="button"
            onClick={() => setSaleType('debt')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
              saleType === 'debt'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Deuda
          </button>
        </div>

        {/* Banner Informativo (solo para Deuda) */}
        {saleType === 'debt' && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 flex items-start space-x-3 animate-fade-in shadow-sm">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="w-3 h-3 text-white" />
            </div>
            <p className="text-sm font-medium text-purple-900">
              Al finalizar te llevaremos a la sección 'Deudas'
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fecha de la venta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de la venta <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors shadow-sm"
            >
              <span className="text-gray-900 font-medium">
                {formatDate(formData.saleDate)}
              </span>
              <Calendar className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-xl pl-8 pr-4 py-3 text-right text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Valor Total (mostrar calculado) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor total
            </label>
            <div className="relative">
              <div className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-right text-gray-900 font-medium shadow-sm">
                ${total.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowClientPicker(true)}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors shadow-sm"
            >
              <div className="flex items-center space-x-3 flex-1">
                <User className="w-5 h-5 text-gray-400" />
                <span className={formData.client ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                  {formData.client ? formData.client.name : 'Selecciona un cliente'}
                </span>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Descuento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descuento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-right text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, discountType: 'percentage' })}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all shadow-sm ${
                    formData.discountType === 'percentage'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, discountType: 'amount' })}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all shadow-sm ${
                    formData.discountType === 'amount'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  $
                </button>
              </div>
            </div>
            {discountAmount > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Descuento: ${discountAmount.toFixed(2)}
              </p>
            )}
          </div>

          {/* Abono (solo para deudas) */}
          {saleType === 'debt' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Abono <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={total}
                  required
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl pl-8 pr-4 py-3 text-right text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                  placeholder="0.00"
                />
              </div>
              {remainingAmount > 0 && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  Saldo pendiente: ${remainingAmount.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Método de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de pago <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all shadow-sm ${
                  formData.paymentMethod === 'cash'
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-500 border-purple-600 text-white shadow-md'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-purple-300'
                }`}
              >
                <Wallet className={`w-6 h-6 mb-1 ${formData.paymentMethod === 'cash' ? 'text-white' : 'text-gray-600'}`} />
                <span className="text-xs font-medium">Efectivo</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'card' })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all shadow-sm ${
                  formData.paymentMethod === 'card'
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-500 border-purple-600 text-white shadow-md'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-purple-300'
                }`}
              >
                <CreditCard className={`w-6 h-6 mb-1 ${formData.paymentMethod === 'card' ? 'text-white' : 'text-gray-600'}`} />
                <span className="text-xs font-medium">Tarjeta</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'transfer' })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all shadow-sm ${
                  formData.paymentMethod === 'transfer'
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-500 border-purple-600 text-white shadow-md'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-purple-300'
                }`}
              >
                <Building2 className={`w-6 h-6 mb-1 ${formData.paymentMethod === 'transfer' ? 'text-white' : 'text-gray-600'}`} />
                <span className="text-xs font-medium text-[10px] leading-tight">Transferencia bancaria</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'other' })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all shadow-sm ${
                  formData.paymentMethod === 'other'
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-500 border-purple-600 text-white shadow-md'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-purple-300'
                }`}
              >
                <MoreHorizontal className={`w-6 h-6 mb-1 ${formData.paymentMethod === 'other' ? 'text-white' : 'text-gray-600'}`} />
                <span className="text-xs font-medium">Otro</span>
              </button>
            </div>
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Concepto
            </label>
            <input
              type="text"
              value={formData.concept}
              onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
              placeholder="Dale un nombre a esta venta"
            />
          </div>

          {/* Botón de Acción Principal */}
          <div className="pt-4 pb-6">
            <button
              type="submit"
              disabled={loading || !formData.amount || !formData.client || (saleType === 'debt' && !formData.paidAmount)}
              className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all shadow-lg ${
                loading || !formData.amount || !formData.client || (saleType === 'debt' && !formData.paidAmount)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-[0.98] shadow-md'
              }`}
            >
              {loading ? 'Creando venta...' : 'Crear venta'}
            </button>
          </div>
        </form>
      </div>

      {/* Modales */}
      <DatePickerModal
        isOpen={showDatePicker}
        selectedDate={formData.saleDate}
        onSelectDate={(date) => {
          setFormData({ ...formData, saleDate: date });
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />

      <ClientPickerModal
        isOpen={showClientPicker}
        selectedClient={formData.client ? { _id: '', name: formData.client.name, phone: formData.client.phone, email: formData.client.email } : null}
        onSelectClient={(client) => {
          setFormData({ 
            ...formData, 
            client: {
              name: client.name,
              phone: client.phone || undefined,
              email: client.email || undefined
            }
          });
          setShowClientPicker(false);
        }}
        onClose={() => setShowClientPicker(false)}
      />
    </>
  );
};

export default FreeSalePage;
