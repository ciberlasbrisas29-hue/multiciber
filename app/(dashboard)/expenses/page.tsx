"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    Plus, Search, Filter, DollarSign, Calendar,
    TrendingDown, FileText, Trash2, Edit
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Expense {
    _id: string;
    description: string;
    amount: number;
    category: string;
    paymentMethod: string;
    createdAt: string;
    status: string;
}

const ExpensesPage = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        total: 0,
        count: 0,
        byCategory: {} as Record<string, number>
    });

    const fetchExpenses = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/expenses?limit=50');
            const data = await response.json();

            if (data.success) {
                setExpenses(data.data);

                // Calculate summary
                const total = data.data.reduce((acc: number, curr: Expense) => acc + curr.amount, 0);
                const byCategory = data.data.reduce((acc: Record<string, number>, curr: Expense) => {
                    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
                    return acc;
                }, {});

                setSummary({
                    total,
                    count: data.data.length,
                    byCategory
                });
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-SV', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            renta: 'bg-blue-100 text-blue-800',
            servicios: 'bg-yellow-100 text-yellow-800',
            salarios: 'bg-green-100 text-green-800',
            equipos: 'bg-purple-100 text-purple-800',
            mantenimiento: 'bg-orange-100 text-orange-800',
            suministros: 'bg-teal-100 text-teal-800',
            marketing: 'bg-pink-100 text-pink-800',
            transporte: 'bg-indigo-100 text-indigo-800',
            otros: 'bg-gray-100 text-gray-800'
        };
        return colors[category] || colors['otros'];
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gestión de Gastos</h1>
                        <p className="text-gray-500">Controla los costos operativos de tu negocio</p>
                    </div>
                    <Link
                        href="/expenses/new"
                        className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium shadow-sm transition-colors"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Registrar Gasto
                    </Link>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-red-100 p-3 rounded-lg">
                                <DollarSign className="w-6 h-6 text-red-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-500">Total Gastos (Mes)</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total)}</h3>
                        <p className="text-sm text-gray-500 mt-1">{summary.count} registros</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-500">Categoría Principal</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 capitalize">
                            {Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {formatCurrency(Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1])[0]?.[1] || 0)}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <TrendingDown className="w-6 h-6 text-purple-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-500">Promedio por Gasto</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {formatCurrency(summary.count > 0 ? summary.total / summary.count : 0)}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Estimado</p>
                    </div>
                </div>

                {/* Expenses List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900">Historial de Gastos</h2>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar gasto..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3">Descripción</th>
                                    <th className="px-6 py-3">Categoría</th>
                                    <th className="px-6 py-3">Método</th>
                                    <th className="px-6 py-3 text-right">Monto</th>
                                    <th className="px-6 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            Cargando gastos...
                                        </td>
                                    </tr>
                                ) : expenses.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No hay gastos registrados aún.
                                        </td>
                                    </tr>
                                ) : (
                                    expenses.map((expense) => (
                                        <tr key={expense._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-600">
                                                {format(new Date(expense.createdAt), 'dd MMM yyyy', { locale: es })}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {expense.description}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getCategoryColor(expense.category)}`}>
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 capitalize">
                                                {expense.paymentMethod === 'cash' ? 'Efectivo' :
                                                    expense.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900">
                                                {formatCurrency(expense.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button className="text-gray-400 hover:text-red-600 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ExpensesPage;
