"use client";

import React, { useState, useEffect } from 'react';
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
  Info
} from 'lucide-react';
import DatePickerModal from '@/components/DatePickerModal';
import CategoryPickerModal from '@/components/CategoryPickerModal';
import SupplierPickerModal from '@/components/SupplierPickerModal';

const NewExpensePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Estados para modales
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);
  
  // Estado del formulario
  const [expenseType, setExpenseType] = useState<'paid' | 'debt'>('paid'); // 'paid' = Pagado, 'debt' = Deuda
  const [formData, setFormData] = useState({
    expenseDate: new Date(),
    category: '',
    amount: '',
    vendor: null as { name: string; phone?: string; email?: string } | null,
    concept: '',
    paymentMethod: 'cash'
  });

  // Categorías con labels expandidos según las imágenes
  const categoryLabels: { [key: string]: string } = {
    'servicios': 'Servicios públicos',
    'suministros': 'Compra de productos e insumos',
    'renta': 'Arriendo',
    'salarios': 'Nómina',
    'otros': 'Gastos administrativos',
    'marketing': 'Mercadeo y publicidad',
    'transporte': 'Transporte, domicilios y logística',
    'mantenimiento': 'Mantenimiento y reparaciones',
    'equipos': 'Muebles, equipos o maquinaria'
  };

  // Format date para mostrar
  const formatDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expenseDate = new Date(date);
    expenseDate.setHours(0, 0, 0, 0);

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const isToday = expenseDate.getTime() === today.getTime();
    const day = expenseDate.getDate();
    const month = monthNames[expenseDate.getMonth()];
    
    if (isToday) {
      return `Hoy, ${day} ${month}`;
    } else {
      const dayName = dayNames[expenseDate.getDay()];
      return `${dayName}, ${day} ${month}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: formData.concept || formData.category ? categoryLabels[formData.category] || 'Gasto' : 'Gasto',
          amount: parseFloat(formData.amount || '0'),
          category: formData.category || 'otros',
          paymentMethod: formData.paymentMethod,
          vendor: formData.vendor || { name: '' },
          status: expenseType === 'paid' ? 'paid' : 'pending',
          notes: formData.concept || '',
          expenseDate: formData.expenseDate
        }),
      });

      const data = await response.json();

      if (data.success) {
        window.dispatchEvent(new CustomEvent('expense-created'));
        
        // Si es deuda, redirigir a la sección de deudas
        if (expenseType === 'debt') {
          router.push('/balance?tab=debts');
        } else {
          router.push('/expenses');
        }
        router.refresh();
      } else {
        alert(data.message || 'Error al guardar el gasto');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error al guardar el gasto');
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
        <h1 className="text-xl font-bold text-white">Nuevo gasto</h1>
      </div>

      <div className="px-6 py-4 pb-24 space-y-4">
        {/* Selector de Estado: Pagado vs Deuda */}
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-md border border-gray-100">
          <button
            type="button"
            onClick={() => setExpenseType('paid')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
              expenseType === 'paid'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pagado
          </button>
          <button
            type="button"
            onClick={() => setExpenseType('debt')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
              expenseType === 'debt'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Deuda
          </button>
        </div>

        {/* Banner Informativo (solo para Deuda) */}
        {expenseType === 'debt' && (
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
          {/* Fecha del gasto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha del gasto <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors shadow-sm"
            >
              <span className="text-gray-900 font-medium">
                {formatDate(formData.expenseDate)}
              </span>
              <Calendar className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Categoría del gasto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría del gasto <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowCategoryPicker(true)}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors shadow-sm"
            >
              <span className={formData.category ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                {formData.category ? categoryLabels[formData.category] : 'Selecciona una opción'}
              </span>
              <ChevronDown className="w-5 h-5 text-gray-400" />
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
                onChange={(e) => {
                  setFormData({ ...formData, amount: e.target.value });
                }}
                className="w-full bg-white border border-gray-300 rounded-xl pl-8 pr-4 py-3 text-right text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proveedor <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowSupplierPicker(true)}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors shadow-sm"
            >
              <span className={formData.vendor ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                {formData.vendor ? formData.vendor.name : 'Selecciona un proveedor'}
              </span>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>
          </div>

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
                onClick={() => setFormData({ ...formData, paymentMethod: 'check' })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all shadow-sm ${
                  formData.paymentMethod === 'check'
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-500 border-purple-600 text-white shadow-md'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-purple-300'
                }`}
              >
                <MoreHorizontal className={`w-6 h-6 mb-1 ${formData.paymentMethod === 'check' ? 'text-white' : 'text-gray-600'}`} />
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
              placeholder="Dale un nombre a este gasto"
            />
          </div>

          {/* Botón de Acción Principal */}
          <div className="pt-4 pb-6">
            <button
              type="submit"
              disabled={loading || !formData.category || !formData.amount || !formData.vendor}
              className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all shadow-lg ${
                loading || !formData.category || !formData.amount || !formData.vendor
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-[0.98] shadow-md'
              }`}
            >
              {loading ? 'Creando gasto...' : 'Crear gasto'}
            </button>
          </div>
        </form>
      </div>

      {/* Modales */}
      <DatePickerModal
        isOpen={showDatePicker}
        selectedDate={formData.expenseDate}
        onSelectDate={(date) => {
          setFormData({ ...formData, expenseDate: date });
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />

      <CategoryPickerModal
        isOpen={showCategoryPicker}
        selectedCategory={formData.category}
        onSelectCategory={(category) => {
          setFormData({ ...formData, category });
          setShowCategoryPicker(false);
        }}
        onClose={() => setShowCategoryPicker(false)}
      />

      <SupplierPickerModal
        isOpen={showSupplierPicker}
        selectedSupplier={formData.vendor ? { _id: '', name: formData.vendor.name, phone: formData.vendor.phone, email: formData.vendor.email } : null}
        onSelectSupplier={(supplier) => {
          setFormData({ 
            ...formData, 
            vendor: {
              name: supplier.name,
              phone: supplier.phone || undefined,
              email: supplier.email || undefined
            }
          });
          setShowSupplierPicker(false);
        }}
        onClose={() => setShowSupplierPicker(false)}
      />
    </>
  );
};

export default NewExpensePage;
