"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dashboardService } from '@/services/api';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Package, AlertTriangle, ArrowRight, Plus, Minus, Box, BarChart3, Sparkles
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LucideIcon } from 'lucide-react';
import LowStockAlert from '@/components/LowStockAlert';

// Estilos para animaciones
const dashboardStyles = `
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
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

interface DashboardStats {
  today?: {
    revenue?: number;
    transactions?: number;
    productsSold?: number;
  };
  inventory?: {
    totalProducts?: number;
    lowStock?: number;
    activeProducts?: number;
  };
  topProduct?: string;
}

interface WeeklyDataPoint {
  date: string;
  sales: number;
}

interface QuickAccessCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
}

const QuickAccessCard = ({ title, subtitle, icon: Icon, color, onClick }: QuickAccessCardProps) => (
  <div
    className={`bg-gradient-to-br from-white to-gray-50 p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-purple-200 group active:scale-95`}
    onClick={onClick}
    style={{
      animation: 'fadeInUp 0.4s ease-out both'
    }}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h5 className="font-extrabold text-lg text-gray-900 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-indigo-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">{title}</h5>
        <p className="text-gray-600 text-sm font-medium mt-1">{subtitle}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
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

const StatCard = ({ title, value, change, icon: Icon, iconColor, trend }: StatCardProps) => {
  const gradientMap: { [key: string]: string } = {
    'bg-teal-600': 'from-teal-50 via-cyan-50 to-blue-50',
    'bg-green-600': 'from-green-50 via-emerald-50 to-teal-50',
    'bg-blue-600': 'from-blue-50 via-indigo-50 to-purple-50',
    'bg-purple-600': 'from-purple-50 via-pink-50 to-rose-50',
  };
  
  const textGradientMap: { [key: string]: string } = {
    'bg-teal-600': 'from-teal-600 to-cyan-600',
    'bg-green-600': 'from-green-600 to-emerald-600',
    'bg-blue-600': 'from-blue-600 to-indigo-600',
    'bg-purple-600': 'from-purple-600 to-pink-600',
  };

  const gradient = gradientMap[iconColor] || 'from-gray-50 to-gray-100';
  const textGradient = textGradientMap[iconColor] || 'from-gray-600 to-gray-700';

  return (
    <div className={`bg-gradient-to-br ${gradient} p-6 rounded-3xl shadow-xl border-2 border-transparent hover:border-purple-200 transition-all duration-200 relative overflow-hidden`}
      style={{
        animation: 'fadeInUp 0.4s ease-out both'
      }}
    >
      {/* Decoración de fondo */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <div className="w-full h-full rounded-full bg-purple-200"></div>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-14 h-14 rounded-2xl ${iconColor} flex items-center justify-center shadow-lg`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center text-sm font-bold px-3 py-1.5 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <h5 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">{title}</h5>
        <p className={`text-4xl font-extrabold bg-gradient-to-r ${textGradient} bg-clip-text text-transparent mb-2`}>{value}</p>
        {change && <p className="text-xs text-gray-600 font-semibold">{change}</p>}
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>([]);
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
      <>
        <style dangerouslySetInnerHTML={{__html: dashboardStyles}} />
        <div className="p-8 flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-purple-400 opacity-20"></div>
            </div>
            <p className="text-gray-600 font-semibold">Cargando...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: dashboardStyles}} />
      <div className="p-4 md:p-8 bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 min-h-screen">
        {/* Header Mejorado */}
        <div className="mb-8 relative">
          <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-500 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -mr-24 -mt-24"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
            </div>
            <div className="relative z-10 flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">Dashboard</h1>
                <p className="text-white/90 font-medium">Resumen ejecutivo de tu negocio</p>
              </div>
            </div>
          </div>
        </div>

      {/* Low Stock Alert - Componente Mejorado */}
      <LowStockAlert />

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

      {/* Weekly Trend Chart Mejorado */}
      {weeklyData.length > 0 && (
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8 border-2 border-purple-100 relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
            <Sparkles className="w-full h-full text-purple-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">Tendencia Semanal</h2>
                  <p className="text-sm text-gray-600 font-semibold">Ventas de los últimos 7 días</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/balance')}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg active:scale-95"
              >
                Ver detalles
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyData}>
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tick={{ fill: '#6b7280' }} />
                <Tooltip
                  formatter={(value) => [formatCurrency(typeof value === 'number' ? value : Number(value) || 0), 'Ventas']}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '2px solid #e5e7eb',
                    padding: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    backgroundColor: '#fff'
                  }}
                  labelStyle={{ color: '#9333ea', fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#9333ea"
                  strokeWidth={4}
                  dot={{ fill: '#9333ea', r: 6, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Quick Actions Mejoradas */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full"></div>
          <h2 className="text-2xl font-extrabold text-gray-900">Acciones Rápidas</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickAccessCard
            title="Nueva Venta"
            subtitle="Registrar transacción"
            icon={Plus}
            color="from-green-500 to-emerald-600"
            onClick={() => router.push('/sales/new')}
          />
          <QuickAccessCard
            title="Nuevo Gasto"
            subtitle="Registrar egreso"
            icon={Minus}
            color="from-red-500 to-pink-600"
            onClick={() => router.push('/expenses/new')}
          />
          <QuickAccessCard
            title="Inventario"
            subtitle="Gestionar productos"
            icon={Box}
            color="from-blue-500 to-indigo-600"
            onClick={() => router.push('/inventory')}
          />
        </div>
      </div>

      {/* Product Insights Mejorados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Product Mejorado */}
        <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 rounded-3xl shadow-xl p-6 border-2 border-yellow-200 relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <div className="w-full h-full rounded-full bg-yellow-300"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">⭐ Producto Estrella</h3>
                  <p className="text-xs text-gray-600 font-semibold">Más vendido hoy</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/50 shadow-lg">
              <p className="text-3xl font-extrabold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">
                {stats?.topProduct || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Mejorado */}
        <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 rounded-3xl shadow-xl p-6 border-2 border-purple-200 relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <div className="w-full h-full rounded-full bg-purple-300"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">Resumen Rápido</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4 border-2 border-white/50 shadow-md">
                <span className="text-sm font-semibold text-gray-600">Ticket Promedio</span>
                <span className="text-lg font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {formatCurrency((stats?.today?.revenue || 0) / (stats?.today?.transactions || 1))}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4 border-2 border-white/50 shadow-md">
                <span className="text-sm font-semibold text-gray-600">Productos Activos</span>
                <span className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {stats?.inventory?.activeProducts || 0}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4 border-2 border-white/50 shadow-md">
                <span className="text-sm font-semibold text-gray-600">Margen Estimado</span>
                <span className="text-lg font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  ~30%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default DashboardPage;
