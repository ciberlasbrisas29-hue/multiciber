"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
    ArrowLeft, Save, DollarSign, FileText,
    Tag, CreditCard, Calendar, AlignLeft
} from 'lucide-react';
import Link from 'next/link';

const NewExpensePage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'otros',
        paymentMethod: 'cash',
        notes: ''
    });

    const categories = [
        { value: 'renta', label: 'Renta' },
        { value: 'servicios', label: 'Servicios (Luz, Agua, Internet)' },
        { value: 'salarios', label: 'Salarios' },
        { value: 'equipos', label: 'Equipos y Hardware' },
        { value: 'mantenimiento', label: 'Mantenimiento' },
        { value: 'suministros', label: 'Suministros de Oficina' },
        { value: 'marketing', label: 'Marketing y Publicidad' },
        { value: 'transporte', label: 'Transporte' },
        { value: 'otros', label: 'Otros' }
    ];

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
                    ...formData,
                    amount: parseFloat(formData.amount)
                }),
            });

            const data = await response.json();

            if (data.success) {
                router.push('/expenses');
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
        <DashboardLayout>
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/expenses"
                            className="p-2 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Nuevo Gasto</h1>
                            <p className="text-gray-500">Registra un nuevo egreso operativo</p>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Descripción del Gasto
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FileText className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
                                        placeholder="Ej: Pago de Internet Marzo"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Monto
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <DollarSign className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Categoría
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Tag className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Método de Pago
                                </label>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: 'cash', label: 'Efectivo' },
                                        { id: 'card', label: 'Tarjeta' },
                                        { id: 'transfer', label: 'Transferencia' }
                                    ].map((method) => (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                                            className={`flex items-center justify-center px-4 py-3 border rounded-lg text-sm font-medium transition-all ${formData.paymentMethod === method.id
                                                    ? 'border-teal-500 bg-teal-50 text-teal-700 ring-1 ring-teal-500'
                                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {method.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notas Adicionales (Opcional)
                                </label>
                                <div className="relative">
                                    <div className="absolute top-3 left-3 pointer-events-none">
                                        <AlignLeft className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <textarea
                                        rows={3}
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
                                        placeholder="Detalles adicionales..."
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-100">
                                <Link
                                    href="/expenses"
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </Link>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {loading ? (
                                        <span className="animate-pulse">Guardando...</span>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Guardar Gasto
                                        </>
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default NewExpensePage;
