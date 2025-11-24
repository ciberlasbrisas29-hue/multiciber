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
  Search,
  Package
} from 'lucide-react';

const NewSalePage = () => {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedProducts, setScannedProducts] = useState<Array<{ id: string; name: string; quantity: number; price: number; image?: string; stock: number }>>([]);
  const scannedBarcodesRef = useRef<Set<string>>(new Set()); // Set para rastrear códigos de barras ya escaneados
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{ [category: string]: any[] }>({});
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

  // Búsqueda dinámica con debounce
  useEffect(() => {
    const searchProducts = async (term: string) => {
      if (!term.trim()) {
        setSearchResults({});
        if (selectedCategory !== 'all') {
          fetchProducts();
        }
        return;
      }
      
      try {
        setLoading(true);
        const response = await productsService.getProducts({
          page: 1,
          limit: 1000,
          search: term,
          isActive: true
        });
        
        if (response.success && response.data) {
          // Filtrar solo productos con stock y agrupar por categoría
          const grouped: { [category: string]: any[] } = {};
          response.data
            .filter((p: any) => p.stock > 0)
            .forEach((product: any) => {
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
        console.error('Error searching products:', error);
        setSearchResults({});
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchProducts(searchTerm);
      } else {
        setSearchResults({});
        fetchProducts(); // Cargar productos cuando se limpia la búsqueda
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      fetchProducts();
    }
  }, [selectedCategory]);

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
      const params: any = { 
        isActive: true,
        page: 1,
        limit: 1000 // Obtener muchos productos para "Todas las categorías"
      };
      
      // Solo filtrar por categoría si no es "all"
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      
      // No incluir searchTerm aquí porque se maneja en el buscador
      
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
    // NO cerrar el scanner - modo continuo
    try {
      // Normalizar el código de barras para comparación
      const normalizedBarcode = barcode.toLowerCase().trim();
      
      // Verificar PRIMERO si este código de barras ya fue escaneado (verificación inmediata y síncrona)
      if (scannedBarcodesRef.current.has(normalizedBarcode)) {
        // Usar setTimeout para no bloquear el hilo principal
        setTimeout(() => {
          alert('Este código de barras ya fue escaneado. Por favor, escanea otro código de barras diferente.');
        }, 0);
        return; // Salir inmediatamente sin procesar
      }
      
      // Verificar también en el estado actual de scannedProducts (verificación síncrona)
      // Necesitamos obtener el producto primero para comparar IDs
      const response = await productsService.getProducts({ 
        isActive: true 
      });
      
      if (response.success && response.data.length > 0) {
        // Buscar producto que coincida exactamente con el barcode
        const product = response.data.find((p: any) => 
          p.barcode && p.barcode.toString().toLowerCase().trim() === normalizedBarcode
        );
        
        if (product) {
          // Verificar si el producto ya está en la lista de escaneados (verificación síncrona del estado actual)
          const currentScannedProducts = scannedProducts; // Obtener el estado actual
          const existingScanned = currentScannedProducts.find((p: any) => p.id === product._id);
          
          if (existingScanned) {
            // Si ya está en la lista, mostrar mensaje y salir (NO marcar en el Set porque no se procesó)
            setTimeout(() => {
              alert(`El producto "${product.name}" ya está en la lista. Por favor, escanea otro código de barras diferente o usa los botones +/- para modificar la cantidad.`);
            }, 0);
            return; // Salir sin procesar
          }
          
          // Si no está en la lista, validar stock antes de agregarlo
          if (product.stock <= 0) {
            // NO marcar en el Set porque no se procesó correctamente
            // Usar setTimeout para no bloquear el hilo principal
            setTimeout(() => {
              alert('El producto no tiene stock disponible');
            }, 0);
            return;
          }
          
          // IMPORTANTE: Agregar el código de barras al Set SOLO si todo está bien (después de todas las validaciones)
          // Esto previene que múltiples llamadas simultáneas pasen la validación
          scannedBarcodesRef.current.add(normalizedBarcode);
          
          // Agregarlo con cantidad 1 (solo la primera vez)
          setScannedProducts(prev => [
            {
              id: product._id,
              name: product.name,
              quantity: 1,
              price: product.price,
              image: product.image,
              stock: product.stock
            },
            ...prev
          ]);
          
          // Limpiar el código del Set de "procesando" en el escáner (si existe)
          // Esto se hace automáticamente después de 3 segundos, pero lo hacemos aquí también para ser más eficientes
        } else {
          // NO marcar en el Set porque el producto no se encontró
          setTimeout(() => {
            alert('Producto no encontrado con ese código de barras');
          }, 0);
        }
      } else {
        setTimeout(() => {
          alert('No se pudieron cargar los productos');
        }, 0);
      }
    } catch (error) {
      console.error('Error al buscar producto por código de barras:', error);
      setTimeout(() => {
        alert('Error al buscar el producto');
      }, 0);
    }
  };

  const handleUpdateScannedQuantity = (productId: string, change: number) => {
    setScannedProducts(prev => {
      const updated = prev.map(product => {
        if (product.id === productId) {
          const newQuantity = product.quantity + change;
          // Validar que no sea menor a 1 ni mayor al stock
          if (newQuantity < 1) {
            // Si la cantidad sería 0, eliminar el producto de la lista
            // También eliminar el código de barras del Set
            // Buscar el producto completo para obtener su barcode
            productsService.getProducts({ isActive: true }).then(response => {
              if (response.success && response.data.length > 0) {
                const fullProduct = response.data.find((p: any) => p._id === productId);
                if (fullProduct && fullProduct.barcode) {
                  scannedBarcodesRef.current.delete(fullProduct.barcode.toString().toLowerCase().trim());
                }
              }
            }).catch(err => console.error('Error al buscar producto para limpiar barcode:', err));
            return null;
          }
          if (newQuantity > product.stock) {
            // Usar setTimeout para no bloquear el hilo principal
            setTimeout(() => {
              alert(`No hay suficiente stock. Disponible: ${product.stock}`);
            }, 0);
            return product;
          }
          return { ...product, quantity: newQuantity };
        }
        return product;
      }).filter((p): p is typeof p & {} => p !== null); // Filtrar nulls
      
      return updated;
    });
  };

  const handleFinishScanning = () => {
    // Limpiar el Set de códigos de barras escaneados cuando se finaliza
    scannedBarcodesRef.current.clear();
    
    // Agregar todos los productos escaneados a la lista principal
    scannedProducts.forEach(scannedProduct => {
      // Verificar si el producto está en la lista actual
      const productInList = products.find((p: any) => p._id === scannedProduct.id);
      
      if (!productInList) {
        // Si no está, agregarlo
        const fullProduct = {
          _id: scannedProduct.id,
          name: scannedProduct.name,
          price: scannedProduct.price,
          stock: scannedProduct.stock,
          image: scannedProduct.image,
          category: 'otros' // Puedes ajustar esto según necesites
        };
        
        setProducts(prev => {
          if (!prev.find((p: any) => p._id === scannedProduct.id)) {
            return [fullProduct, ...prev];
          }
          return prev;
        });
      }
      
      // Agregar o actualizar la cantidad en selectedProducts
      setTimeout(() => {
        setSelectedProducts(prev => {
          const existing = prev.find((p: any) => p.id === scannedProduct.id);
          if (existing) {
            return prev.map(p =>
              p.id === scannedProduct.id
                ? { ...p, quantity: p.quantity + scannedProduct.quantity }
                : p
            );
          } else {
            return [...prev, {
              id: scannedProduct.id,
              name: scannedProduct.name,
              price: scannedProduct.price,
              quantity: scannedProduct.quantity,
              stock: scannedProduct.stock,
              _id: scannedProduct.id
            }];
          }
        });
      }, 50);
    });
    
    // Cerrar el scanner y limpiar productos escaneados
    setIsScannerOpen(false);
    setScannedProducts([]);
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
        // Usar setTimeout para no bloquear el hilo principal
        setTimeout(() => {
          alert(`No hay suficiente stock. Disponible: ${product.stock}`);
        }, 0);
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
              onClick={() => {
                // Limpiar el Set de códigos de barras al abrir el escáner (por si acaso)
                scannedBarcodesRef.current.clear();
                setIsScannerOpen(true);
              }}
              className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-xl active:opacity-80 hover:bg-white/30 transition-colors border border-white/30"
            >
              <Scan className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Buscador Dinámico */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value.trim()) {
                setSelectedCategory('all'); // Limpiar categoría cuando se busca
              }
            }}
            placeholder="Buscar por nombre, categoría o código de barras..."
            className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSearchResults({});
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

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
        ) : searchTerm.trim() && Object.keys(searchResults).length > 0 ? (
          // Mostrar resultados de búsqueda agrupados por categoría
          <div className="space-y-6">
            {Object.entries(searchResults).map(([categoryName, categoryProducts]) => {
              const category = categories.find(c => c.value === categoryName);
              const categoryLabel = category?.label || categoryName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              
              return (
                <div key={categoryName} className="space-y-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category?.color || '#6b7280' }}
                    />
                    <h3 className="font-semibold text-gray-700 text-lg">{categoryLabel}</h3>
                    <span className="text-sm text-gray-500">({categoryProducts.length})</span>
                  </div>
                  {categoryProducts.map((product: any) => {
                    const selectedItem = selectedProducts.find((p: any) => p.id === product._id);
                    const quantity = selectedItem?.quantity || 0;
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

                          {/* Controles de cantidad */}
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <button
                              onClick={() => updateProductQuantity(product._id, -1)}
                              disabled={quantity === 0}
                              className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-semibold text-gray-900">
                              {quantity}
                            </span>
                            <button
                              onClick={() => updateProductQuantity(product._id, 1)}
                              disabled={quantity >= product.stock}
                              className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : searchTerm.trim() && Object.keys(searchResults).length === 0 ? (
          <div className="text-center bg-white p-12 rounded-2xl shadow-md">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No se encontraron productos</h3>
            <p className="text-gray-500 mb-4">
              No hay productos que coincidan con "{searchTerm}"
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSearchResults({});
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Limpiar búsqueda
            </button>
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
          onClose={() => {
            setIsScannerOpen(false);
            setScannedProducts([]);
            // Limpiar el Set de códigos de barras escaneados cuando se cierra el escáner
            scannedBarcodesRef.current.clear();
          }}
          continuousMode={true}
          scannedProducts={scannedProducts}
          onUpdateQuantity={handleUpdateScannedQuantity}
          onFinish={handleFinishScanning}
        />
      )}

    </>
  );
};

export default NewSalePage;
