"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { productsService } from '@/services/api';
import DefaultProductImage from '@/components/DefaultProductImage';
import BarcodeScanner from '@/components/BarcodeScanner';
import { Search, Scan, ArrowLeft, Package, AlertTriangle, TrendingUp } from 'lucide-react';

const InventoryPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedCategory = searchParams.get('category');
    
    const [view, setView] = useState<'categories' | 'products'>('categories');
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
    const [pagination, setPagination] = useState({});
    const [page, setPage] = useState(1);

    // Cargar categorías
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/products/categories');
                const data = await response.json();
                if (data.success) {
                    setCategories(data.data);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoading(false);
            }
        };

        if (view === 'categories') {
            fetchCategories();
        }
    }, [view]);

    // Cargar productos cuando se selecciona una categoría
    useEffect(() => {
        if (selectedCategory) {
            setView('products');
            fetchProducts();
        }
    }, [selectedCategory, page, searchTerm]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await productsService.getProducts({
                page,
                limit: 20,
                category: selectedCategory,
                search: searchTerm
            });
            if (response.success) {
                setProducts(response.data);
                setPagination(response.pagination);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (categoryName: string) => {
        router.push(`/inventory?category=${encodeURIComponent(categoryName)}`);
    };

    const handleBackToCategories = () => {
        router.push('/inventory');
        setView('categories');
        setSearchTerm('');
        setPage(1);
    };

    const handleBarcodeScanned = (barcode: string) => {
        setSearchTerm(barcode);
        setShowBarcodeScanner(false);
        setPage(1);
    };

    const formatCategoryName = (name: string) => {
        return name?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Sin categoría';
    };

    const getCategoryIcon = (categoryName: string) => {
        // Mapeo de categorías a iconos/colores
        const categoryColors: { [key: string]: string } = {
            'accesorios-gaming': 'bg-purple-100 text-purple-600',
            'almacenamiento': 'bg-blue-100 text-blue-600',
            'conectividad': 'bg-indigo-100 text-indigo-600',
            'accesorios-trabajo': 'bg-green-100 text-green-600',
            'dispositivos-captura': 'bg-pink-100 text-pink-600',
            'mantenimiento': 'bg-yellow-100 text-yellow-600',
            'otros': 'bg-gray-100 text-gray-600',
        };
        return categoryColors[categoryName] || 'bg-gray-100 text-gray-600';
    };

    const isStockCritical = (product: any) => {
        return product.stock <= product.minStock;
    };

    return (
        <div className="p-4 md:p-8 pb-24">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Inventario</h1>
                    <p className="text-gray-500">Gestión de productos y stock.</p>
                </div>
                <button
                    onClick={() => router.push('/inventory/create')}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center"
                >
                    <Package className="w-4 h-4 mr-2" />
                    Crear Producto
                </button>
            </div>

            {/* Buscador */}
            <div className="mb-6 flex gap-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Buscar por nombre, categoría o código de barras..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <button
                    onClick={() => setShowBarcodeScanner(true)}
                    className="px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center"
                    title="Escanear código de barras"
                >
                    <Scan className="w-5 h-5" />
                </button>
            </div>

            {/* Vista de Categorías */}
            {view === 'categories' && !selectedCategory && (
                <>
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Cargando categorías...</p>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="text-center bg-white p-12 rounded-2xl shadow-md">
                            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay categorías</h3>
                            <p className="text-gray-500">Crea productos para ver las categorías aquí.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {categories.map((category) => (
                                <button
                                    key={category.name}
                                    onClick={() => handleCategoryClick(category.name)}
                                    className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 border border-gray-100 flex flex-col items-center text-center"
                                >
                                    <div className={`w-16 h-16 rounded-xl ${getCategoryIcon(category.name)} flex items-center justify-center mb-4`}>
                                        <Package className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2 text-lg">
                                        {category.displayName}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {category.count} {category.count === 1 ? 'producto' : 'productos'}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Vista de Productos */}
            {view === 'products' && selectedCategory && (
                <>
                    {/* Botón de regreso */}
                    <button
                        onClick={handleBackToCategories}
                        className="mb-4 flex items-center text-purple-600 hover:text-purple-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        <span>Volver a categorías</span>
                    </button>

                    {/* Título de categoría */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            {formatCategoryName(selectedCategory)}
                        </h2>
                        <p className="text-gray-500">
                            {pagination.total || 0} {pagination.total === 1 ? 'producto' : 'productos'}
                        </p>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Cargando productos...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center bg-white p-12 rounded-2xl shadow-md">
                            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay productos</h3>
                            <p className="text-gray-500 mb-4">
                                {searchTerm 
                                    ? `No se encontraron productos que coincidan con "${searchTerm}"`
                                    : `No hay productos en esta categoría.`
                                }
                            </p>
                            {searchTerm && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setPage(1);
                                    }}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Limpiar búsqueda
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {products.map((product) => {
                                const isCritical = isStockCritical(product);
                                const profit = (product.price - product.cost) || 0;
                                
                                return (
                                    <div
                                        key={product._id}
                                        className={`bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all border-2 ${
                                            isCritical ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
                                        }`}
                                    >
                                        <div className="flex items-start space-x-4">
                                            {/* Imagen del producto */}
                                            <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
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
                                                    <DefaultProductImage width={64} height={64} alt={product.name} />
                                                )}
                                            </div>

                                            {/* Información del producto */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-gray-900 text-lg truncate">
                                                            {product.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-500 capitalize">
                                                            {formatCategoryName(product.category)}
                                                        </p>
                                                    </div>
                                                    {isCritical && (
                                                        <div className="ml-2 flex-shrink-0">
                                                            <AlertTriangle className="w-5 h-5 text-red-600" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mt-3">
                                                    {/* Stock */}
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Stock</p>
                                                        <p className={`font-bold text-lg ${
                                                            isCritical ? 'text-red-600' : 'text-gray-900'
                                                        }`}>
                                                            {product.stock} {product.unit || 'unidades'}
                                                        </p>
                                                        {isCritical && (
                                                            <p className="text-xs text-red-600 mt-1">
                                                                {product.stock === 0 ? 'Agotado' : 'Stock crítico'}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Precio y Ganancia */}
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500 mb-1">Precio</p>
                                                        <p className="font-bold text-lg text-gray-900">
                                                            ${product.price?.toLocaleString() || '0'}
                                                        </p>
                                                        {profit > 0 && (
                                                            <p className="text-sm text-green-600 font-semibold mt-1 flex items-center justify-end">
                                                                <TrendingUp className="w-4 h-4 mr-1" />
                                                                +${profit.toLocaleString()} ganancia
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Paginación */}
                    {pagination.pages > 1 && (
                        <div className="flex justify-between items-center mt-6">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-700">
                                Página {pagination.current} de {pagination.pages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                disabled={page === pagination.pages}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Barcode Scanner Modal */}
            <BarcodeScanner
                isOpen={showBarcodeScanner}
                onScan={handleBarcodeScanned}
                onClose={() => setShowBarcodeScanner(false)}
            />
        </div>
    );
};

export default InventoryPage;
