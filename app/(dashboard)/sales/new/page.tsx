"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { productsService, salesService } from '@/services/api';
import BarcodeScanner from '@/components/BarcodeScanner';
import { 
  ArrowLeft, 
  ArrowUpDown, 
  Filter, 
  Scan, 
  Plus, 
  Minus,
  Clock,
  ChevronRight,
  X,
  Check,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

const NewSalePage = () => {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const [sortMenuPosition, setSortMenuPosition] = useState({ top: 0, left: 0 });

  interface Category {
    value: string;
    label: string;
    color?: string;
  }

  const [categories, setCategories] = useState<Category[]>([
    { value: 'all', label: 'Todas las categorías' }
  ]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Cargar categorías desde la BD (mismo endpoint que /inventory/categories)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch('/api/products/categories');
        const data = await response.json();
        
        if (data.success && data.data) {
          // Convertir las categorías de la BD al formato esperado
          // Mantener el mismo orden que viene del endpoint
          const dbCategories: Category[] = data.data.map((cat: any) => ({
            value: cat.name,
            label: cat.displayName,
            color: cat.color
          }));
          
          // Agregar "Todas las categorías" al inicio
          setCategories([
            { value: 'all', label: 'Todas las categorías' },
            ...dbCategories
          ]);
        }
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchTerm]);

  // Aplicar ordenamiento cuando cambie sortBy
  useEffect(() => {
    if (sortBy && products.length > 0) {
      const sorted = applySortingToArray([...products]);
      setProducts(sorted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = { isActive: true };
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await productsService.getProducts(params);
      if (response.success) {
        let filteredProducts = response.data.filter((p: any) => p.stock > 0);
        
        // Aplicar ordenamiento si existe
        if (sortBy) {
          filteredProducts = applySortingToArray(filteredProducts);
        }
        
        setProducts(filteredProducts);
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
    } finally {
      setLoading(false);
    }
  };

  const applySortingToArray = (productsArray: any[]) => {
    if (!sortBy) return productsArray;
    
    const sorted = [...productsArray];
    
    switch (sortBy.field) {
      case 'stock':
        sorted.sort((a, b) => {
          return sortBy.direction === 'asc' 
            ? a.stock - b.stock 
            : b.stock - a.stock;
        });
        break;
      
      case 'sales':
        // Ordenar por ventas (usando un campo calculado o 0 si no existe)
        sorted.sort((a, b) => {
          const salesA = a.salesCount || 0;
          const salesB = b.salesCount || 0;
          return sortBy.direction === 'asc' 
            ? salesA - salesB 
            : salesB - salesA;
        });
        break;
      
      case 'name':
        sorted.sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          if (sortBy.direction === 'asc') {
            return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
          } else {
            return nameA > nameB ? -1 : nameA < nameB ? 1 : 0;
          }
        });
        break;
      
      case 'date':
        sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortBy.direction === 'asc' 
            ? dateA - dateB 
            : dateB - dateA;
        });
        break;
      
      case 'price':
        sorted.sort((a, b) => {
          return sortBy.direction === 'asc' 
            ? a.price - b.price 
            : b.price - a.price;
        });
        break;
      
      default:
        break;
    }
    
    return sorted;
  };

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setSortBy({ field, direction });
    setIsSortMenuOpen(false);
    
    // Aplicar ordenamiento inmediatamente
    setProducts(prev => {
      if (prev.length === 0) return prev;
      return applySortingToArray([...prev]);
    });
  };


  const handleBarcodeScan = async (barcode: string) => {
    setIsScannerOpen(false);
    
    try {
      // Buscar producto por código de barras
      const response = await productsService.getProducts({ 
        isActive: true 
      });
      
      if (response.success && response.data.length > 0) {
        // Buscar producto que coincida exactamente con el barcode
        const product = response.data.find((p: any) => 
          p.barcode && p.barcode.toString().toLowerCase() === barcode.toLowerCase()
        );
        
        if (product) {
          if (product.stock > 0) {
            // Verificar si el producto está en la lista actual
            const productInList = products.find((p: any) => p._id === product._id);
            
            if (productInList) {
              // Si está en la lista, aumentar cantidad
              updateProductQuantity(product._id, 1);
              console.log('Producto encontrado y agregado:', product.name);
            } else {
              // Si no está en la lista, agregarlo primero y luego aumentar cantidad
              setProducts(prev => {
                if (!prev.find((p: any) => p._id === product._id)) {
                  return [...prev, product];
                }
                return prev;
              });
              
              // Esperar un momento para que se actualice el estado
              setTimeout(() => {
                updateProductQuantity(product._id, 1);
                console.log('Producto encontrado y agregado:', product.name);
              }, 100);
            }
          } else {
            alert('El producto no tiene stock disponible');
          }
        } else {
          alert('Producto no encontrado con ese código de barras');
        }
      } else {
        alert('No se pudieron cargar los productos');
      }
    } catch (error) {
      console.error('Error al buscar producto por código de barras:', error);
      alert('Error al buscar el producto');
    }
  };

  const updateProductQuantity = (productId: string, change: number) => {
    setSelectedProducts(prev => {
      const product = products.find((p: any) => p._id === productId);
      if (!product) {
        // Si el producto no está en la lista actual, intentar buscarlo en todos los productos
        // Esto puede pasar si se agregó desde el escáner
        return prev;
      }

      const existing = prev.find((p: any) => p.id === productId);
      const currentQty = existing?.quantity || 0;
      const newQty = currentQty + change;

      // Validar que no sea menor a 0
      if (newQty < 0) {
        return prev;
      }

      // Validar stock disponible
      if (newQty > product.stock) {
        alert(`No hay suficiente stock. Disponible: ${product.stock}`);
        return prev;
      }

      // Si la cantidad es 0, eliminar del array
      if (newQty === 0) {
        return prev.filter((p: any) => p.id !== productId);
      }

      // Actualizar o agregar producto
      if (existing) {
        return prev.map((p: any) =>
          p.id === productId ? { ...p, quantity: newQty } : p
        );
      } else {
        return [...prev, { ...product, id: productId, quantity: newQty }];
      }
    });
  };


  const getTotal = () => {
    return selectedProducts.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  };

  const handleAddProducts = () => {
    if (selectedProducts.length === 0) {
      alert('Selecciona al menos un producto');
      return;
    }
    
    // Preparar los productos seleccionados con sus cantidades
    const productsToAdd = selectedProducts.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
      stock: item.stock,
      _id: item._id
    }));
    
    // Imprimir en consola
    console.log('=== PRODUCTOS SELECCIONADOS ===');
    console.log('Total de productos:', productsToAdd.length);
    console.log('Total a pagar:', getTotal().toFixed(2));
    console.log('Detalle de productos:', productsToAdd);
    console.log('==============================');
    
    // También puedes procesar la venta aquí o navegar a checkout
    // Por ahora, imprimimos en consola como solicitaste
    // Si quieres procesar la venta directamente, descomenta las siguientes líneas:
    /*
    const saleData = {
      items: productsToAdd.map(item => ({
        productId: item._id,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: getTotal(),
      paymentMethod: 'cash' // Puedes cambiar esto según tu lógica
    };
    
    // Procesar venta
    salesService.createSale(saleData)
      .then(response => {
        if (response.success) {
          alert('Venta registrada exitosamente');
          router.push('/sales');
        } else {
          alert('Error al registrar la venta: ' + response.message);
        }
      })
      .catch(error => {
        console.error('Error al procesar venta:', error);
        alert('Error al procesar la venta');
      });
    */
    
    // Navegar a checkout con los productos seleccionados
    router.push(`/sales/checkout?items=${encodeURIComponent(JSON.stringify(productsToAdd))}`);
  };

  return (
    <>
      {/* Encabezado interno */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 mb-4 -mx-6 rounded-b-3xl shadow-lg -mt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center active:opacity-70 rounded-full hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Seleccionar productos</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-xl active:opacity-80 hover:bg-white/30 transition-colors border border-white/30"
            >
              <Scan className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Botón Nuevo Producto */}
      <button
        onClick={() => router.push('/inventory/create')}
        className="w-full bg-white border border-purple-100 rounded-2xl p-4 mb-4 flex items-center space-x-3 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <span className="text-gray-900 font-semibold">Nuevo producto</span>
      </button>

      {/* Selector de Categorías */}
      <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2 relative">
        <div className="relative flex-shrink-0">
          <button 
            ref={sortButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              if (sortButtonRef.current) {
                const rect = sortButtonRef.current.getBoundingClientRect();
                setSortMenuPosition({
                  top: rect.bottom + 8,
                  left: rect.left
                });
              }
              setIsSortMenuOpen(!isSortMenuOpen);
            }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center relative z-10 shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <ArrowUpDown className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 active:scale-95 ${
              selectedCategory === category.value
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'bg-white border border-purple-100 text-gray-700 hover:bg-purple-50'
            }`}
            style={category.color && selectedCategory === category.value && !category.color.includes('gradient') ? { backgroundColor: category.color } : {}}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Menú de Ordenamiento - Renderizado fuera del contenedor con overflow */}
      {isSortMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-[55] bg-black/20" 
            onClick={() => setIsSortMenuOpen(false)}
          ></div>
          <div 
            className="fixed bg-white rounded-2xl shadow-xl border border-gray-200 p-2 z-[60] min-w-[200px] max-h-[80vh] overflow-y-auto"
            style={{
              top: `${sortMenuPosition.top}px`,
              left: `${sortMenuPosition.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs font-semibold text-gray-500 px-3 py-2">Ordenar por:</div>
            
            <button
              onClick={() => handleSort('stock', 'asc')}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="text-sm text-gray-700">Stock (Menor a Mayor)</span>
              {sortBy?.field === 'stock' && sortBy?.direction === 'asc' && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </button>
            
            <button
              onClick={() => handleSort('stock', 'desc')}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="text-sm text-gray-700">Stock (Mayor a Menor)</span>
              {sortBy?.field === 'stock' && sortBy?.direction === 'desc' && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </button>
            
            <div className="h-px bg-gray-100 my-1"></div>
            
            <button
              onClick={() => handleSort('sales', 'asc')}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="text-sm text-gray-700">Ventas (Menor a Mayor)</span>
              {sortBy?.field === 'sales' && sortBy?.direction === 'asc' && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </button>
            
            <button
              onClick={() => handleSort('sales', 'desc')}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="text-sm text-gray-700">Ventas (Mayor a Menor)</span>
              {sortBy?.field === 'sales' && sortBy?.direction === 'desc' && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </button>
            
            <div className="h-px bg-gray-100 my-1"></div>
            
            <button
              onClick={() => handleSort('name', 'asc')}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="text-sm text-gray-700">Nombre (A-Z)</span>
              {sortBy?.field === 'name' && sortBy?.direction === 'asc' && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </button>
            
            <button
              onClick={() => handleSort('name', 'desc')}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="text-sm text-gray-700">Nombre (Z-A)</span>
              {sortBy?.field === 'name' && sortBy?.direction === 'desc' && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </button>
            
            <div className="h-px bg-gray-100 my-1"></div>
            
            <button
              onClick={() => handleSort('date', 'desc')}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="text-sm text-gray-700">Fecha (Más Reciente)</span>
              {sortBy?.field === 'date' && sortBy?.direction === 'desc' && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </button>
            
            <button
              onClick={() => handleSort('date', 'asc')}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="text-sm text-gray-700">Fecha (Más Antiguo)</span>
              {sortBy?.field === 'date' && sortBy?.direction === 'asc' && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </button>
            
            <div className="h-px bg-gray-100 my-1"></div>
            
            <button
              onClick={() => handleSort('price', 'asc')}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="text-sm text-gray-700">Precio (Más Barato)</span>
              {sortBy?.field === 'price' && sortBy?.direction === 'asc' && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </button>
            
            <button
              onClick={() => handleSort('price', 'desc')}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="text-sm text-gray-700">Precio (Más Caro)</span>
              {sortBy?.field === 'price' && sortBy?.direction === 'desc' && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </button>
          </div>
        </>
      )}

      {/* Lista de Productos */}
      <div className="space-y-3 mb-32">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No hay productos disponibles</p>
          </div>
        ) : (
          products.map((product: any) => {
            const selectedItem = selectedProducts.find((p: any) => p.id === product._id);
            const quantity = selectedItem?.quantity || 0;
            
            // Determinar si el stock es crítico (stock <= minStock)
            const isStockLow = product.minStock !== undefined && product.stock <= product.minStock;
            const hasStock = product.stock > 0;

            return (
              <div
                key={product._id}
                className="bg-white rounded-2xl p-4 shadow-md border border-purple-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  {/* Imagen del producto */}
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-purple-100 shadow-sm">
                    {product.image && product.image !== '/assets/images/products/default-product.jpg' ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {product.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Información del producto */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">
                      {product.name}
                    </h3>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center border ${
                        isStockLow
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : hasStock
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        <Clock className="w-3 h-3 mr-1" />
                        {product.stock} disponibles
                      </span>
                    </div>
                    <p className="text-lg font-bold text-purple-600">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Selector de cantidad */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => updateProductQuantity(product._id, -1)}
                      disabled={quantity === 0}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                        quantity === 0
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md hover:shadow-lg'
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-bold text-gray-900 text-lg">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateProductQuantity(product._id, 1)}
                      disabled={quantity >= product.stock}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                        quantity >= product.stock
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md hover:shadow-lg'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Fijo - Ajustado para no interferir con BottomNavbar */}
      <div className="fixed bottom-24 left-0 right-0 bg-white px-6 py-4 rounded-t-3xl border-t border-purple-100 shadow-xl z-40">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={handleAddProducts}
            className="flex-1 text-left text-gray-900 font-semibold"
          >
            Añadir productos
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-purple-600">
              ${getTotal().toFixed(2)}
            </span>
            <button
              onClick={handleAddProducts}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Scanner */}
      {isScannerOpen && (
        <BarcodeScanner
          isOpen={isScannerOpen}
          onScan={handleBarcodeScan}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

    </>
  );
};

export default NewSalePage;
