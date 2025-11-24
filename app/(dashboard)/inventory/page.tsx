"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { productsService } from '@/services/api';
import DefaultProductImage from '@/components/DefaultProductImage';
import BarcodeScanner from '@/components/BarcodeScanner';
import { Search, Scan, ArrowLeft, Package, AlertTriangle, TrendingUp, Share2, Pencil } from 'lucide-react';
import ProductQuickEditModal from '@/components/ProductQuickEditModal';
import ShareCatalogModal from '@/components/ShareCatalogModal';
import Toast from '@/components/Toast';

interface Category {
    name: string;
    displayName: string;
    count: number;
    image: string | null;
}

interface Pagination {
    current: number;
    pages: number;
    total: number;
}

const InventoryPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedCategory = searchParams.get('category');
    const productIdFromUrl = searchParams.get('productId');
    
    const [view, setView] = useState<'categories' | 'products'>('categories');
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryColorsMap, setCategoryColorsMap] = useState<{ [key: string]: string }>({});
    const [categoryNamesMap, setCategoryNamesMap] = useState<{ [key: string]: string }>({});
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<{ [category: string]: any[] }>({});
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
    const [pagination, setPagination] = useState<Pagination>({ current: 1, pages: 1, total: 0 });
    const [page, setPage] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [showQuickEditModal, setShowQuickEditModal] = useState(false);
    const [shouldFocusQuantity, setShouldFocusQuantity] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error' | 'warning', isVisible: false });

    // Función para búsqueda dinámica (sin categoría específica)
    const searchProducts = useCallback(async (term: string) => {
        if (!term.trim()) {
            setSearchResults({});
            return;
        }
        
        try {
            setLoading(true);
            // Buscar en todos los productos sin filtrar por categoría
            const response = await productsService.getProducts({
                page: 1,
                limit: 1000, // Obtener muchos resultados para agrupar
                search: term,
                isActive: true
            });
            
            if (response.success && response.data) {
                // Agrupar productos por categoría
                const grouped: { [category: string]: any[] } = {};
                response.data.forEach((product: any) => {
                    const category = product.category || 'otros';
                    if (!grouped[category]) {
                        grouped[category] = [];
                    }
                    grouped[category].push(product);
                });
                setSearchResults(grouped);
            } else {
                setSearchResults({});
            }
        } catch (error) {
            console.error("Error searching products:", error);
            setSearchResults({});
        } finally {
            setLoading(false);
        }
    }, []);

    // Función para cargar productos
    const fetchProducts = useCallback(async () => {
        if (!selectedCategory) return;
        
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
    }, [selectedCategory, page, searchTerm]);

    // Resetear a vista de categorías cuando no hay categoría seleccionada
    useEffect(() => {
        if (!selectedCategory && view !== 'categories') {
            setView('categories');
            setProducts([]);
            setSearchTerm('');
            setPage(1);
        }
    }, [selectedCategory, view]);

    // Obtener userId del usuario autenticado
    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const response = await fetch('/api/auth/me');
                const data = await response.json();
                if (data.success && data.data?.user?._id) {
                    setUserId(data.data.user._id);
                }
            } catch (error) {
                console.error("Error obteniendo userId:", error);
            }
        };
        fetchUserId();
    }, []);

    // Cargar categorías (solo las que tienen productos en la vista de inventario)
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/products/categories');
                const data = await response.json();
                if (data.success) {
                    // Filtrar solo categorías que tienen productos (count > 0)
                    const categoriesWithProducts = data.data.filter((cat: Category) => cat.count > 0);
                    setCategories(categoriesWithProducts);
                    
                    // Crear mapas de colores y nombres para acceso rápido
                    const colorsMap: { [key: string]: string } = {};
                    const namesMap: { [key: string]: string } = {};
                    categoriesWithProducts.forEach((cat: Category) => {
                        if (cat.color) colorsMap[cat.name] = cat.color;
                        if (cat.displayName) namesMap[cat.name] = cat.displayName;
                    });
                    setCategoryColorsMap(colorsMap);
                    setCategoryNamesMap(namesMap);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoading(false);
            }
        };

        if (!selectedCategory) {
            fetchCategories();
        }
    }, [selectedCategory]);

    // Búsqueda dinámica con debounce
    useEffect(() => {
        if (searchTerm.trim() && !selectedCategory) {
            const timeoutId = setTimeout(() => {
                searchProducts(searchTerm);
            }, 300); // Debounce de 300ms
            
            return () => clearTimeout(timeoutId);
        } else if (!searchTerm.trim() && !selectedCategory) {
            setSearchResults({});
        }
    }, [searchTerm, selectedCategory, searchProducts]);

    // Cargar productos cuando se selecciona una categoría
    useEffect(() => {
        if (selectedCategory) {
            setView('products');
            fetchProducts();
        }
    }, [selectedCategory, fetchProducts]);

    // Abrir automáticamente el modal de edición rápida cuando hay productId en la URL
    useEffect(() => {
        if (productIdFromUrl && products.length > 0 && !showQuickEditModal) {
            const product = products.find(p => p._id === productIdFromUrl);
            if (product) {
                setSelectedProduct(product);
                setShowQuickEditModal(true);
                setShouldFocusQuantity(true);
                // Limpiar el parámetro de la URL sin recargar la página
                const url = new URL(window.location.href);
                url.searchParams.delete('productId');
                window.history.replaceState({}, '', url.toString());
            }
        }
    }, [productIdFromUrl, products, showQuickEditModal]);

    const handleCategoryClick = (categoryName: string) => {
        setSearchTerm(''); // Limpiar búsqueda al seleccionar categoría
        setSearchResults({});
        router.push(`/inventory?category=${encodeURIComponent(categoryName)}`);
    };

    const handleBackToCategories = () => {
        router.push('/inventory');
        setView('categories');
        setSearchTerm('');
        setPage(1);
    };

    const handleBarcodeScanned = async (barcode: string) => {
        setShowBarcodeScanner(false);
        
        try {
            // Buscar productos (sin filtros de categoría para buscar en todos)
            const response = await productsService.getProducts({
                page: 1,
                limit: 1000, // Obtener todos los productos para buscar el código de barras
                isActive: true
            });
            
            if (response.success && response.data && response.data.length > 0) {
                // Buscar producto que coincida exactamente con el código de barras
                const product = response.data.find((p: any) => 
                    p.barcode && p.barcode.toString().trim().toLowerCase() === barcode.trim().toLowerCase()
                );
                
                if (product) {
                    // Producto encontrado
                    // Navegar a la categoría del producto con el productId en la URL
                    // El useEffect existente se encargará de abrir el modal cuando se carguen los productos
                    const categoryUrl = `/inventory?category=${encodeURIComponent(product.category)}&productId=${product._id}`;
                    router.push(categoryUrl);
                    
                    // Mostrar notificación de éxito
                    setToast({
                        message: `Producto encontrado: ${product.name}`,
                        type: 'success',
                        isVisible: true
                    });
                } else {
                    // Producto no encontrado
                    setToast({
                        message: `No se encontró ningún producto con el código de barras: ${barcode}`,
                        type: 'error',
                        isVisible: true
                    });
                }
            } else {
                // No se pudieron cargar los productos
                setToast({
                    message: 'No se pudieron cargar los productos',
                    type: 'error',
                    isVisible: true
                });
            }
        } catch (error) {
            console.error('Error buscando producto por código de barras:', error);
            setToast({
                message: 'Error al buscar el producto. Por favor, intenta nuevamente.',
                type: 'error',
                isVisible: true
            });
        }
    };

    // Obtener nombre para mostrar desde la BD
    const getCategoryDisplayName = (categoryName: string) => {
        return categoryNamesMap[categoryName] || categoryName?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Sin categoría';
    };

    const formatCategoryName = (name: string) => {
        return getCategoryDisplayName(name);
    };

    // Colores por defecto (fallback)
    const defaultColors: { [key: string]: string } = {
        'accesorios-gaming': '#a855f7',
        'almacenamiento': '#3b82f6',
        'conectividad': '#6366f1',
        'accesorios-trabajo': '#10b981',
        'dispositivos-captura': '#ec4899',
        'mantenimiento': '#eab308',
        'otros': '#6b7280',
    };

    const getCategoryIcon = (categoryName: string) => {
        // Usar color de la BD si está disponible
        const color = categoryColorsMap[categoryName] || defaultColors[categoryName] || '#6b7280';
        
        // Convertir hex a rgba para el fondo con opacidad
        const hexToRgba = (hex: string, alpha: number) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        // Siempre usar estilo personalizado con el color de la BD
        return {
            className: '',
            style: {
                backgroundColor: hexToRgba(color, 0.1),
                color: color
            }
        };
    };

    const isStockCritical = (product: any) => {
        return product.stock <= product.minStock;
    };

    const handleProductClick = (product: any) => {
        setSelectedProduct(product);
        setShowQuickEditModal(true);
    };

    const handleCloseQuickEdit = () => {
        setShowQuickEditModal(false);
        setSelectedProduct(null);
    };

    const handleProductUpdate = () => {
        // Refrescar los productos después de actualizar
        if (selectedCategory) {
            fetchProducts();
        }
    };

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-b-2xl mb-6 -mx-6 md:mx-0 md:rounded-2xl">
                <div className="flex items-center space-x-3">
                    <Package className="w-6 h-6" />
                    <h1 className="text-2xl font-bold">Inventario</h1>
                </div>
                {!selectedCategory && (
                    <button
                        onClick={() => router.push('/inventory/categories')}
                        className="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                        title="Gestionar categorías"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="px-6 md:px-0 space-y-4">
                {/* Search and Action Buttons */}
                <div className="flex gap-3">
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
                            className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>
                <button
                    onClick={() => setShowBarcodeScanner(true)}
                        className="px-4 py-3 bg-purple-500 text-white rounded-2xl hover:bg-purple-600 transition-colors flex items-center justify-center"
                    title="Escanear código de barras"
                >
                    <Scan className="w-5 h-5" />
                </button>
            </div>

                {/* Action Buttons Row */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-md"
                        title="Compartir catálogo"
                    >
                        <Share2 className="w-5 h-5" />
                        <span>Compartir</span>
                    </button>
                    <button
                        onClick={() => router.push('/inventory/create')}
                        className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-md"
                    >
                        <Package className="w-5 h-5" />
                        <span>Nuevo</span>
                    </button>
                </div>

                {/* Vista de Categorías o Resultados de Búsqueda */}
                {!selectedCategory && (
                    <>
                        {loading && searchTerm.trim() ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Buscando productos...</p>
                            </div>
                        ) : searchTerm.trim() && Object.keys(searchResults).length > 0 ? (
                            // Mostrar resultados agrupados por categoría
                            <div className="space-y-6">
                                {Object.entries(searchResults).map(([categoryName, categoryProducts]) => (
                                    <div key={categoryName} className="space-y-3">
                                        {/* Header de categoría */}
                                        <div className="mb-2">
                                            <h2 className="text-2xl font-bold text-gray-800 mb-1">
                                                {formatCategoryName(categoryName)}
                                            </h2>
                                            <p className="text-gray-500 text-sm">
                                                {categoryProducts.length} {categoryProducts.length === 1 ? 'producto' : 'productos'}
                                            </p>
                                        </div>
                                        
                                        {/* Productos de esta categoría */}
                                        <div className="space-y-3">
                                            {categoryProducts.map((product) => {
                                                const isCritical = isStockCritical(product);
                                                const profit = (product.price - product.cost) || 0;
                                                
                                                return (
                                                    <div
                                                        key={product._id}
                                                        onClick={() => handleProductClick(product)}
                                                        className={`bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all border-2 cursor-pointer active:scale-[0.98] ${
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
                                    </div>
                                ))}
                            </div>
                        ) : searchTerm.trim() && Object.keys(searchResults).length === 0 ? (
                            <div className="text-center bg-white p-12 rounded-2xl shadow-md">
                                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No se encontraron productos</h3>
                                <p className="text-gray-500 mb-4">
                                    No hay productos que coincidan con "{searchTerm}"
                                </p>
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Limpiar búsqueda
                                </button>
                            </div>
                        ) : loading ? (
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
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {categories.map((category) => (
                                <button
                                    key={category.name}
                                    onClick={() => handleCategoryClick(category.name)}
                                    className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 border border-gray-100 flex flex-col items-center text-center"
                                >
                                    <div 
                                        className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${getCategoryIcon(category.name).className}`}
                                        style={getCategoryIcon(category.name).style}
                                    >
                                        <Package className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2 text-lg">
                                        {getCategoryDisplayName(category.name)}
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
                {selectedCategory && (
                <>
                    {/* Botón de regreso */}
                    <button
                        onClick={handleBackToCategories}
                            className="flex items-center text-purple-600 hover:text-purple-700 transition-colors mb-2"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        <span>Volver a categorías</span>
                    </button>

                    {/* Título de categoría */}
                        <div className="mb-4">
                            <h2 className="text-2xl font-bold text-gray-800 mb-1">
                            {formatCategoryName(selectedCategory)}
                        </h2>
                            <p className="text-gray-500 text-sm">
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
                                        onClick={() => handleProductClick(product)}
                                        className={`bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all border-2 cursor-pointer active:scale-[0.98] ${
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
            </div>

            {/* Barcode Scanner Modal */}
            <BarcodeScanner
                isOpen={showBarcodeScanner}
                onScan={handleBarcodeScanned}
                onClose={() => setShowBarcodeScanner(false)}
            />

            {/* Product Quick Edit Modal */}
            <ProductQuickEditModal
                isOpen={showQuickEditModal}
                product={selectedProduct}
                onClose={() => {
                    handleCloseQuickEdit();
                    setShouldFocusQuantity(false);
                }}
                onUpdate={() => {
                    handleProductUpdate();
                    // Disparar evento para actualizar notificaciones
                    window.dispatchEvent(new CustomEvent('stock-updated'));
                }}
                autoFocusQuantity={shouldFocusQuantity}
            />

            {/* Share Catalog Modal */}
            <ShareCatalogModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                userId={userId || undefined}
            />

            {/* Toast Notification */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
                duration={toast.type === 'success' ? 2000 : 4000}
            />
        </div>
    );
};

export default InventoryPage;


