"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dashboardService } from '@/services/api';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Package, AlertTriangle, ArrowRight, Plus, Minus, Box
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LucideIcon } from 'lucide-react';

interface QuickAccessCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
}

const QuickAccessCard = ({ title, subtitle, icon: Icon, color, onClick }: QuickAccessCardProps) => (
  <div
    className={`bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 ${color} group`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <h5 className="font-bold text-lg text-gray-800 group-hover:text-teal-600 transition-colors">{title}</h5>
        <p className="text-gray-500 text-sm">{subtitle}</p>
      </div>
      <Icon className="w-8 h-8 text-gray-400 group-hover:text-teal-600 transition-colors" />
    </div>
  </div>
);

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  iconColor: string;
  trend?: number;
}

const StatCard = ({ title, value, change, icon: Icon, iconColor, trend }: StatCardProps) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${iconColor}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <h5 className="text-sm font-medium text-gray-500 mb-1">{title}</h5>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {change && <p className="text-xs text-gray-500 mt-1">{change}</p>}
  </div>
);

const DashboardPage = () => {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [lowStockData, setLowStockData] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch main stats
        const statsResponse = await dashboardService.getStats();
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }

        // Fetch low stock alerts
        const lowStockResponse = await fetch('/api/products/low-stock');
        const lowStockJson = await lowStockResponse.json();
        if (lowStockJson.success) {
          setLowStockData(lowStockJson.data);
        }

        // Fetch weekly trend from balance API
        const balanceResponse = await fetch('/api/balance?period=week');
        const balanceJson = await balanceResponse.json();
        if (balanceJson.success) {
          setWeeklyData(balanceJson.data.charts.dailySales || []);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number | null | undefined) => {
    return new Intl.NumberFormat('es-SV', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Resumen ejecutivo de tu negocio</p>
      </div>

      {/* Low Stock Alert */}
      {lowStockData && lowStockData.count > 0 && (
        <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900 mb-1">
                  ⚠️ {lowStockData.count} producto{lowStockData.count > 1 ? 's' : ''} con stock bajo
                </h3>
                <p className="text-sm text-red-700 mb-3">
                  {lowStockData.critical > 0 && `${lowStockData.critical} críticos`}
                  {lowStockData.critical > 0 && lowStockData.warning > 0 && ' • '}
                  {lowStockData.warning > 0 && `${lowStockData.warning} en advertencia`}
                </p>
                <button
                  onClick={() => router.push('/inventory')}
                  className="flex items-center text-sm font-medium text-red-700 hover:text-red-900 transition-colors"
                >
                  Ver inventario
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Ventas Hoy"
          value={formatCurrency(stats?.today?.revenue)}
          icon={DollarSign}
          iconColor="bg-teal-600"
          change={`${stats?.today?.transactions || 0} transacciones`}
        />
        <StatCard
          title="Ganancia Neta"
          value={formatCurrency((stats?.today?.revenue || 0) * 0.3)}
          icon={TrendingUp}
          iconColor="bg-green-600"
          trend={15}
        />
        <StatCard
          title="Productos Vendidos"
          value={stats?.today?.productsSold || 0}
          icon={ShoppingCart}
          iconColor="bg-blue-600"
        />
        <StatCard
          title="Inventario Total"
          value={stats?.inventory?.totalProducts || 0}
          icon={Package}
          iconColor="bg-purple-600"
          change={`${stats?.inventory?.lowStock || 0} stock bajo`}
        />
      </div>

      {/* Weekly Trend Chart */}
      {weeklyData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tendencia Semanal</h2>
              <p className="text-sm text-gray-500">Ventas de los últimos 7 días</p>
            </div>
            <button
              onClick={() => router.push('/balance')}
              className="flex items-center text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              Ver detalles
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyData}>
              <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip
                formatter={(value) => [formatCurrency(value), 'Ventas']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#0891b2"
                strokeWidth={3}
                dot={{ fill: '#0891b2', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickAccessCard
            title="Nueva Venta"
            subtitle="Registrar transacción"
            icon={Plus}
            color="border-teal-500"
            onClick={() => router.push('/sales/new')}
          />
          <QuickAccessCard
            title="Nuevo Gasto"
            subtitle="Registrar egreso"
            icon={Minus}
            color="border-orange-500"
            onClick={() => router.push('/expenses/new')}
          />
          <QuickAccessCard
            title="Inventario"
            subtitle="Gestionar productos"
            icon={Box}
            color="border-blue-500"
            onClick={() => router.push('/inventory')}
          />
        </div>
      </div>

      {/* Product Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Product */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Producto Estrella</h3>
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Package className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">{stats?.topProduct || 'N/A'}</p>
          <p className="text-sm text-gray-500">Más vendido hoy</p>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen Rápido</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Ticket Promedio</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency((stats?.today?.revenue || 0) / (stats?.today?.transactions || 1))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Productos Activos</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats?.inventory?.activeProducts || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Margen Estimado</span>
              <span className="text-sm font-semibold text-green-600">~30%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
