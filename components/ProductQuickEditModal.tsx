"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Minus, Edit, Package } from 'lucide-react';
import DefaultProductImage from './DefaultProductImage';
import axios from 'axios';

interface Product {
    _id: string;
    name: string;
    description?: string;
    price: number;
    cost: number;
    category: string;
    stock: number;
    minStock: number;
    unit: string;
    image?: string;
}

interface ProductQuickEditModalProps {
    isOpen: boolean;
    product: Product | null;
    onClose: () => void;
    onUpdate: () => void; // Callback para refrescar la lista
    autoFocusQuantity?: boolean; // Prop para auto-enfocar el campo de cantidad
}

const ProductQuickEditModal: React.FC<ProductQuickEditModalProps> = ({ 
    isOpen, 
    product, 
    onClose,
    onUpdate,
    autoFocusQuantity = false
}) => {
    const router = useRouter();
    const stockInputRef = useRef<HTMLInputElement>(null);
    const [stock, setStock] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (product) {
            setStock(product.stock);
            setError('');
        }
    }, [product]);

    // Auto-enfocar el campo de cantidad cuando se abre desde notificación
    useEffect(() => {
        if (isOpen && autoFocusQuantity && stockInputRef.current) {
            // Pequeño delay para asegurar que el modal esté completamente renderizado
            setTimeout(() => {
                stockInputRef.current?.focus();
                stockInputRef.current?.select(); // Seleccionar el valor actual para reemplazarlo fácilmente
            }, 300);
        }
    }, [isOpen, autoFocusQuantity]);

    if (!isOpen || !product) return null;

    const formatCategoryName = (name: string) => {
        return name?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Sin categoría';
    };

    const handleIncrement = () => {
        setStock(prev => prev + 1);
        setError('');
    };

    const handleDecrement = () => {
        if (stock > 0) {
            setStock(prev => prev - 1);
            setError('');
        }
    };

    const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0;
        if (value >= 0) {
            setStock(value);
            setError('');
        }
    };

    const handleUpdateStock = async () => {
        if (stock === product.stock) {
            onClose();
            return;
        }

        setIsUpdating(true);
        setError('');

        try {
            const response = await axios.put(`/api/products/${product._id}`, {
                stock: stock
            });

            if (response.data.success) {
                // Disparar evento personalizado para actualizar notificaciones de stock bajo
                window.dispatchEvent(new CustomEvent('stock-updated'));
                window.dispatchEvent(new CustomEvent('product-updated'));
                onUpdate();
                onClose();
            } else {
                setError(response.data.message || 'Error al actualizar el stock');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al actualizar el stock');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleEditFull = () => {
        onClose();
        router.push(`/inventory/edit/${product._id}`);
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={handleBackdropClick}
        >
            <div 
                className="bg-white rounded-t-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header con gradiente púrpura */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-white">Edición Rápida</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Contenido */}
                <div className="p-6">
                    {/* Información del Producto */}
                    <div className="flex items-start space-x-4 mb-6 pb-6 border-b border-gray-200">
                        {/* Imagen del producto */}
                        <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                            {product.image && product.image !== '/assets/images/products/default-product.svg' ? (
                                <img
                                    className="w-full h-full object-cover"
                                    src={product.image}
                                    alt={product.name}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            ) : null}
                            {(!product.image || product.image === '/assets/images/products/default-product.svg') && (
                                <DefaultProductImage width={96} height={96} alt={product.name} />
                            )}
                        </div>

                        {/* Información */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
                                {product.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-2">
                                {formatCategoryName(product.category)}
                            </p>
                            <p className="text-lg font-semibold text-purple-600">
                                ${product.price?.toLocaleString() || '0'}
                            </p>
                            {product.description && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                    {product.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Módulo de Stock */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cantidad disponible</h3>
                        
                        {/* Control de cantidad */}
                        <div className="flex items-center justify-center space-x-4 mb-4">
                            <button
                                onClick={handleDecrement}
                                disabled={stock <= 0 || isUpdating}
                                className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            >
                                <Minus className="w-5 h-5" />
                            </button>
                            
                            <input
                                ref={stockInputRef}
                                type="number"
                                value={stock}
                                onChange={handleStockChange}
                                min="0"
                                disabled={isUpdating}
                                className="w-24 text-center text-3xl font-bold text-gray-900 border-2 border-purple-200 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                            />
                            
                            <button
                                onClick={handleIncrement}
                                disabled={isUpdating}
                                className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 text-center">
                            {product.unit || 'unidades'}
                        </p>

                        {/* Error message */}
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Botones de acción */}
                    <div className="space-y-3">
                        {/* Botón Actualizar unidades */}
                        <button
                            onClick={handleUpdateStock}
                            disabled={isUpdating || stock === product.stock}
                            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center"
                        >
                            {isUpdating ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Actualizando...
                                </>
                            ) : (
                                'Actualizar unidades'
                            )}
                        </button>

                        {/* Botón Editar Producto */}
                        <button
                            onClick={handleEditFull}
                            disabled={isUpdating}
                            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center"
                        >
                            <Edit className="w-5 h-5 mr-2" />
                            Editar Producto
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                    }
                    to {
                        transform: translateY(0);
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default ProductQuickEditModal;

