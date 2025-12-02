"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  DollarSign,
  Info,
  Wallet,
  CreditCard,
  Building2,
  MoreHorizontal,
  CheckCircle,
  X
} from 'lucide-react';
import { expensesService } from '@/services/api';

interface Expense {
  _id: string;
  expenseNumber?: string;
  description: string;
  amount: number;
  category: string;
  paymentMethod: string;
  vendor?: {
    name: string;
    phone?: string;
    email?: string;
  };
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const ExpensePaymentPage = () => {
  const router = useRouter();
  const params = useParams();
  const expenseId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'check' | 'other'>('cash');
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const paymentMethods: Array<{
    value: 'cash' | 'card' | 'transfer' | 'check' | 'other';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { value: 'cash', label: 'Efectivo', icon: Wallet },
    { value: 'card', label: 'Tarjeta', icon: CreditCard },
    { value: 'transfer', label: 'Transf', icon: Building2 },
    { value: 'check', label: 'Cheque', icon: MoreHorizontal },
    { value: 'other', label: 'Otro', icon: MoreHorizontal },
  ];

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setFetching(true);
        const response = await expensesService.getExpense(expenseId);
        
        if (response.success && response.data) {
          setExpense(response.data);
          // Establecer el método de pago por defecto
          if (response.data.paymentMethod) {
            setPaymentMethod(response.data.paymentMethod as 'cash' | 'card' | 'transfer' | 'check' | 'other');
          }
        } else {
          alert('Error al cargar la información del gasto');
          router.push('/balance?tab=debts');
        }
      } catch (error) {
        console.error('Error fetching expense:', error);
        alert('Error al cargar la información del gasto');
        router.push('/balance?tab=debts');
      } finally {
        setFetching(false);
      }
    };

    if (expenseId) {
      fetchExpense();
    }
  }, [expenseId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!expense) return;

    try {
      const updateData = {
        status: 'paid' as const,
        paymentMethod: paymentMethod
      };

      const response = await expensesService.updateExpense(expenseId, updateData);

      if (response.success) {
        // Disparar evento para actualizar las listas
        window.dispatchEvent(new CustomEvent('expense-updated'));
        window.dispatchEvent(new CustomEvent('debt-updated'));
        
        setSuccessMessage('¡Listo! Gasto pagado');
        setShowSuccessNotification(true);
        setTimeout(() => {
          router.push('/balance?tab=debts');
        }, 2000);
      } else {
        alert(response.message || 'Error al registrar el pago');
      }
    } catch (error: any) {
      console.error('Error registering payment:', error);
      alert('Error al registrar el pago');
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

  if (!expense) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-SV', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'renta': 'Renta',
      'servicios': 'Servicios',
      'salarios': 'Salarios',
      'equipos': 'Equipos',
      'mantenimiento': 'Mantenimiento',
      'suministros': 'Suministros',
      'marketing': 'Marketing',
      'transporte': 'Transporte',
      'otros': 'Otros'
    };
    return labels[category] || category;
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-4 flex items-center space-x-3 rounded-b-2xl shadow-md -mx-6 mb-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <DollarSign className="w-5 h-5" />
        <h1 className="text-lg font-semibold text-white">Pagar Gasto</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Información del Gasto */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Información del Gasto</h3>
          <div className="space-y-2.5">
            {expense.expenseNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Número de Gasto:</span>
                <span className="font-medium text-gray-900">#{expense.expenseNumber}</span>
              </div>
            )}
            {expense.vendor?.name && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Proveedor:</span>
                <span className="font-medium text-gray-900">{expense.vendor.name}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Descripción:</span>
              <span className="font-medium text-gray-900">{expense.description}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Categoría:</span>
              <span className="font-medium text-gray-900">{getCategoryLabel(expense.category)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
              <span className="text-gray-600">Monto a Pagar:</span>
              <span className="font-bold text-red-600">{formatCurrency(expense.amount)}</span>
            </div>
          </div>
        </div>

        {/* Banner Informativo */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-3 flex items-start space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4 text-white" />
          </div>
          <p className="text-xs text-red-900 leading-relaxed flex-1">
            Una vez confirmado, el pago se registrará automáticamente y el gasto quedará marcado como pagado.
          </p>
        </div>

        {/* Formulario de Pago */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Método de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2.5">
              Método de pago <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value as 'cash' | 'card' | 'transfer' | 'check' | 'other')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all shadow-sm active:scale-95 ${
                      isSelected
                        ? 'bg-gradient-to-br from-red-500 to-pink-500 border-red-600 text-white shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-red-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                    <span className="text-xs font-medium">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumen de Pago */}
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-3.5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Monto a Pagar:</span>
                <span className="font-bold text-gray-900">{formatCurrency(expense.amount)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-red-200">
                <span className="text-gray-700">Estado:</span>
                <span className="font-bold text-green-600">
                  Se marcará como pagado
                </span>
              </div>
            </div>
          </div>

          {/* Botón de Acción Principal */}
          <div className="pt-3 pb-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all shadow-lg ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 active:scale-[0.98] shadow-md'
              }`}
            >
              {loading ? 'Registrando pago...' : `Confirmar Pago de ${formatCurrency(expense.amount)}`}
            </button>
          </div>
        </form>
      </div>

      {/* Notificación de Éxito */}
      {showSuccessNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-slide-up-fade pointer-events-auto border-2 border-green-200">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 mb-1">¡Listo!</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{successMessage}</p>
              </div>
              <button
                onClick={() => setShowSuccessNotification(false)}
                className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensePaymentPage;

