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
  Pencil
} from 'lucide-react';

const NewSalePage = () => {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const [sortMenuPosition, setSortMenuPosition] = useState({ top: 0, left: 0 });

  interface Category {
    value: string;
    label: string;
    color?: string;
  }

  // Categorías base del sistema
  const baseCategories: Category[] = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'accesorios-gaming', label: 'Accesorios Gaming' },
    { value: 'almacenamiento', label: 'Almacenamiento' },
    { value: 'conectividad', label: 'Conectividad' },
    { value: 'accesorios-trabajo', label: 'Accesorios Trabajo' },
    { value: 'dispositivos-captura', label: 'Dispositivos Captura' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'otros', label: 'Otros' },
  ];

  // Categorías personalizadas desde localStorage
  const [customCategories, setCustomCategories] = useState<Category[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('customCategories');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Combinar categorías base y personalizadas
  const categories: Category[] = [
    ...baseCategories,
    ...customCategories.map((cat: Category) => ({
      value: cat.value,
      label: cat.label,
      color: cat.color
    }))
  ];

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

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      alert('El nombre de la categoría es requerido');
      return;
    }

    // Generar un valor único para la categoría
    const categoryValue = newCategoryName.toLowerCase().replace(/\s+/g, '-');
    
    // Verificar que no exista
    if (categories.find(cat => cat.value === categoryValue)) {
      alert('Esta categoría ya existe');
      return;
    }

    const newCategory = {
      value: categoryValue,
      label: newCategoryName.trim(),
      color: newCategoryColor
    };

    const updatedCategories = [...customCategories, newCategory];
    setCustomCategories(updatedCategories);
    localStorage.setItem('customCategories', JSON.stringify(updatedCategories));
    
    // Limpiar formulario
    setNewCategoryName('');
    setNewCategoryColor('#6366f1');
    setIsCreateCategoryOpen(false);
    
    // Seleccionar la nueva categoría
    setSelectedCategory(categoryValue);
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
      <div className="bg-yellow-400 px-6 py-4 mb-4 -mx-6 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center active:opacity-70"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Seleccionar productos</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="w-8 h-8 flex items-center justify-center bg-gray-900 rounded-md active:opacity-80"
            >
              <Scan className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Botón Nuevo Producto */}
      <button
        onClick={() => router.push('/inventory/create')}
        className="w-full bg-white border border-gray-200 rounded-2xl p-4 mb-4 flex items-center space-x-3 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <Plus className="w-5 h-5 text-purple-600" />
        </div>
        <span className="text-gray-900 font-medium">Nuevo producto</span>
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
            className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center relative z-10"
          >
            <ArrowUpDown className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <button 
          onClick={() => setIsCreateCategoryOpen(true)}
          className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0"
        >
          <Pencil className="w-5 h-5 text-gray-700" />
        </button>
        
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
              selectedCategory === category.value
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-200 text-gray-700'
            }`}
            style={category.color && selectedCategory === category.value ? { backgroundColor: category.color } : {}}
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

            return (
              <div
                key={product._id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center space-x-4">
                  {/* Imagen del producto */}
                  <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.image && product.image !== '/assets/images/products/default-product.jpg' ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-200 to-indigo-200 flex items-center justify-center">
                        <span className="text-2xl font-bold text-purple-600">
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
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {product.stock} disponibles
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Selector de cantidad */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => updateProductQuantity(product._id, -1)}
                      disabled={quantity === 0}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        quantity === 0
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-purple-100 text-purple-600'
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold text-gray-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateProductQuantity(product._id, 1)}
                      disabled={quantity >= product.stock}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        quantity >= product.stock
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-purple-100 text-purple-600'
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
      <div className="fixed bottom-24 left-0 right-0 bg-gray-100 px-6 py-4 rounded-t-3xl border-t border-gray-200 shadow-lg z-40">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={handleAddProducts}
            className="flex-1 text-left text-gray-900 font-medium"
          >
            Añadir productos
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              ${getTotal().toFixed(2)}
            </span>
            <button
              onClick={handleAddProducts}
              className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 text-white" />
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

      {/* Modal para Crear Nueva Categoría */}
      {isCreateCategoryOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50" 
            onClick={() => setIsCreateCategoryOpen(false)}
          ></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div 
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Nueva Categoría</h2>
                <button
                  onClick={() => setIsCreateCategoryOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la categoría
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ej: Electrónica"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color (opcional)
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      placeholder="#6366f1"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setIsCreateCategoryOpen(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateCategory}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default NewSalePage;
