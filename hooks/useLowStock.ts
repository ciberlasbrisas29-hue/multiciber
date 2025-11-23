"use client";

import { useState, useEffect } from 'react';

interface LowStockData {
  products: any[];
  count: number;
  critical: number;
  warning: number;
}

export const useLowStock = (listenToEvents: boolean = true) => {
  const [lowStockData, setLowStockData] = useState<LowStockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLowStock = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/products/low-stock');
      const data = await response.json();
      if (data.success) {
        setLowStockData(data.data);
      } else {
        setError(data.message || 'Error al cargar productos con stock bajo');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar productos con stock bajo');
      console.error('Error fetching low stock:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();

    // Escuchar eventos de actualización cuando haya cambios
    if (listenToEvents) {
      const handleUpdate = () => {
        fetchLowStock();
      };

      window.addEventListener('stock-updated', handleUpdate);
      window.addEventListener('sale-created', handleUpdate);
      window.addEventListener('expense-created', handleUpdate);
      window.addEventListener('product-updated', handleUpdate);

      return () => {
        window.removeEventListener('stock-updated', handleUpdate);
        window.removeEventListener('sale-created', handleUpdate);
        window.removeEventListener('expense-created', handleUpdate);
        window.removeEventListener('product-updated', handleUpdate);
      };
    }
  }, [listenToEvents]);

  return {
    lowStockData,
    loading,
    error,
    refetch: fetchLowStock
  };
};
