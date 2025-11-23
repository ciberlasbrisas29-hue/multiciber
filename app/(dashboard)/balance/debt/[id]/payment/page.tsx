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
import { salesService } from '@/services/api';

interface Sale {
  _id: string;
  saleNumber?: string;
  type: 'product' | 'free';
  status: 'paid' | 'debt';
  total: number;
  paidAmount: number;
  debtAmount: number;
  client?: {
    name: string;
    phone?: string;
    email?: string;
  };
  concept?: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

const DebtPaymentPage = () => {
  const router = useRouter();
  const params = useParams();
  const saleId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [sale, setSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
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
    { value: 'transfer', label: 'Transferencia', icon: Building2 },
    { value: 'check', label: 'Cheque', icon: MoreHorizontal },
    { value: 'other', label: 'Otro', icon: MoreHorizontal },
  ];

  useEffect(() => {
    const fetchSale = async () => {
      try {
        setFetching(true);
        const response = await salesService.getSale(saleId);
        
        if (response.success && response.data) {
          setSale(response.data);
          // Establecer el monto del pago inicialmente al monto de deuda restante
          const remainingDebt = response.data.debtAmount || (response.data.total - response.data.paidAmount);
          setPaymentAmount(remainingDebt.toString());
        } else {
          alert('Error al cargar la información de la deuda');
          router.push('/balance?tab=debts');
        }
      } catch (error) {
        console.error('Error fetching sale:', error);
        alert('Error al cargar la información de la deuda');
        router.push('/balance?tab=debts');
      } finally {
        setFetching(false);
      }
    };

    if (saleId) {
      fetchSale();
    }
  }, [saleId, router]);

  const remainingDebt = sale ? (sale.debtAmount || (sale.total - sale.paidAmount)) : 0;
  const totalToPay = parseFloat(paymentAmount || '0');
  const newRemainingDebt = Math.max(0, remainingDebt - totalToPay);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!sale) return;

    const amountToPay = parseFloat(paymentAmount || '0');
    
    if (isNaN(amountToPay) || amountToPay <= 0) {
      alert('Por favor ingresa un monto válido');
      setLoading(false);
      return;
    }

    if (amountToPay > remainingDebt) {
      alert(`El monto a abonar no puede ser mayor a la deuda restante ($${remainingDebt.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`);
      setLoading(false);
      return;
    }

    try {
      const newPaidAmount = sale.paidAmount + amountToPay;
      const newDebtAmount = sale.total - newPaidAmount;
      const newStatus = newPaidAmount >= sale.total ? 'paid' : 'debt';

      const updateData = {
        paidAmount: newPaidAmount,
        debtAmount: newDebtAmount,
        status: newStatus,
        paymentMethod: paymentMethod
      };

      const response = await salesService.updateSale(saleId, updateData);

      if (response.success) {
        // Disparar evento para actualizar las listas
        window.dispatchEvent(new CustomEvent('sale-created'));
        window.dispatchEvent(new CustomEvent('debt-updated'));
        
        // Si se pagó completamente, mostrar mensaje de éxito y redirigir
        if (newStatus === 'paid') {
          setSuccessMessage('¡Deuda pagada completamente!');
          setShowSuccessNotification(true);
          setTimeout(() => {
            router.push('/balance?tab=debts');
          }, 2000);
        } else {
          setSuccessMessage(`Abono de ${formatCurrency(amountToPay)} registrado exitosamente`);
          setShowSuccessNotification(true);
          // Actualizar la vista de la venta
          setSale({
            ...sale,
            paidAmount: newPaidAmount,
            debtAmount: newDebtAmount,
            status: newStatus,
            paymentMethod: paymentMethod
          });
          setPaymentAmount(newDebtAmount.toString());
          // Ocultar notificación después de 3 segundos
          setTimeout(() => {
            setShowSuccessNotification(false);
          }, 3000);
        }
      } else {
        alert(response.message || 'Error al registrar el abono');
      }
    } catch (error: any) {
      console.error('Error registering payment:', error);
      alert('Error al registrar el abono');
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

  if (!sale) {
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
        <DollarSign className="w-6 h-6" />
        <h1 className="text-xl font-bold text-white">Abonar Deuda</h1>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Información de la Venta */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Información de la Venta</h3>
          <div className="space-y-2">
            {sale.saleNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Número de Venta:</span>
                <span className="font-medium text-gray-900">#{sale.saleNumber}</span>
              </div>
            )}
            {sale.client?.name && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-medium text-gray-900">{sale.client.name}</span>
              </div>
            )}
            {sale.concept && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Concepto:</span>
                <span className="font-medium text-gray-900">{sale.concept}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
              <span className="text-gray-600">Total de la Venta:</span>
              <span className="font-bold text-gray-900">{formatCurrency(sale.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monto Pagado:</span>
              <span className="font-medium text-green-600">{formatCurrency(sale.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Deuda Restante:</span>
              <span className="font-bold text-red-600">{formatCurrency(remainingDebt)}</span>
            </div>
          </div>
        </div>

        {/* Banner Informativo */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-3 h-3 text-white" />
          </div>
          <p className="text-sm font-medium text-purple-900">
            Puedes abonar cualquier cantidad. Si abonas el monto completo, la deuda se marcará como pagada.
          </p>
        </div>

        {/* Formulario de Abono */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Monto a Abonar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto a Abonar <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={remainingDebt}
                required
                value={paymentAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = parseFloat(value);
                  if (value === '' || (!isNaN(numValue) && numValue >= 0 && numValue <= remainingDebt)) {
                    setPaymentAmount(value);
                  }
                }}
                className="w-full bg-white border border-gray-300 rounded-xl pl-8 pr-4 py-3 text-right text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Máximo: {formatCurrency(remainingDebt)}
            </p>
            {newRemainingDebt > 0 && (
              <p className="text-sm text-red-600 mt-2 font-medium">
                Deuda restante después del abono: {formatCurrency(newRemainingDebt)}
              </p>
            )}
            {newRemainingDebt === 0 && totalToPay > 0 && (
              <p className="text-sm text-green-600 mt-2 font-medium flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>La deuda se pagará completamente con este abono</span>
              </p>
            )}
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de pago <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value as 'cash' | 'card' | 'transfer' | 'check' | 'other')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all shadow-sm ${
                      isSelected
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-500 border-purple-600 text-white shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-purple-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-1 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                    <span className="text-xs font-medium">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumen de Abono */}
          {totalToPay > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Monto a Abonar:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(totalToPay)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-purple-200">
                  <span className="text-gray-700">Nueva Deuda Restante:</span>
                  <span className={`font-bold ${newRemainingDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(newRemainingDebt)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Botón de Acción Principal */}
          <div className="pt-4 pb-6">
            <button
              type="submit"
              disabled={loading || !paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > remainingDebt}
              className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all shadow-lg ${
                loading || !paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > remainingDebt
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-[0.98] shadow-md'
              }`}
            >
              {loading ? 'Registrando abono...' : `Registrar Abono de ${formatCurrency(totalToPay)}`}
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
                <h3 className="text-lg font-bold text-gray-900 mb-1">¡Éxito!</h3>
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

export default DebtPaymentPage;

