"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ShoppingCart, Plus, Minus, User, CreditCard, DollarSign, 
  Calculator, Receipt, Clock, Search, Package, Trash2,
  CheckCircle, AlertCircle, X
} from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  barcode?: string;
  category?: string;
  image?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Customer {
  _id?: string;
  name: string;
  phone?: string;
  email?: string;
}

const VentasPage = () => {
  // Estados principales
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({ name: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  // Estados de UI
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  // Productos rápidos para cyber café
  const quickServices = [
    { name: 'Internet 1 hora', price: 5000, category: 'internet' },
    { name: 'Internet 30 min', price: 2500, category: 'internet' },
    { name: 'Impresión B/N', price: 200, category: 'impresion' },
    { name: 'Impresión Color', price: 500, category: 'impresion' },
    { name: 'Fotocopia', price: 100, category: 'impresion' },
    { name: 'Escaneo', price: 300, category: 'servicios' },
    { name: 'Digitación/Página', price: 1000, category: 'servicios' },
    { name: 'Quemado CD/DVD', price: 2000, category: 'servicios' }
  ];

  // Cargar productos
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Funciones del carrito
  const addToCart = (product: Product, quantity: number = 1, customPrice?: number) => {
    const unitPrice = customPrice || product.price;
    const existingItem = cart.find(item => item.product._id === product._id);
    
    if (existingItem) {
      updateCartItemQuantity(product._id, existingItem.quantity + quantity);
    } else {
      const newItem: CartItem = {
        product,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity
      };
      setCart([...cart, newItem]);
    }
  };

  const addQuickService = (service: { name: string; price: number; category: string }) => {
    const quickProduct: Product = {
      _id: `quick-${Date.now()}`,
      name: service.name,
      price: service.price,
      stock: 999,
      category: service.category
    };
    addToCart(quickProduct, 1);
  };

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => 
      item.product._id === productId 
        ? { ...item, quantity: newQuantity, totalPrice: item.unitPrice * newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product._id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomer({ name: '' });
    setPaymentAmount(0);
  };

  // Cálculos
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = 0; // Sin impuestos por ahora
  const total = subtotal + tax;
  const change = paymentAmount > total ? paymentAmount - total : 0;

  // Procesar venta
  const processSale = async () => {
    if (cart.length === 0) {
      setNotification({ type: 'error', message: 'El carrito está vacío' });
      return;
    }

    if (paymentMethod === 'cash' && paymentAmount < total) {
      setNotification({ type: 'error', message: 'El pago en efectivo debe ser mayor o igual al total' });
      return;
    }

    setProcessing(true);

    try {
      const saleData = {
        items: cart.map(item => ({
          product: item.product._id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        })),
        customer: customer.name ? customer : null,
        paymentMethod,
        total,
        paidAmount: paymentMethod === 'cash' ? paymentAmount : total,
        change: paymentMethod === 'cash' ? change : 0,
        status: 'paid'
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saleData)
      });

      const data = await response.json();

      if (data.success) {
        setLastSale(data.sale);
        setShowReceipt(true);
        clearCart();
        setNotification({ type: 'success', message: 'Venta procesada exitosamente' });
      } else {
        setNotification({ type: 'error', message: data.message || 'Error al procesar la venta' });
      }
    } catch (error) {
      console.error('Error processing sale:', error);
      setNotification({ type: 'error', message: 'Error al procesar la venta' });
    } finally {
      setProcessing(false);
    }
  };

  // Filtrar productos
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-SV', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-teal-100 p-2 rounded-lg">
                <ShoppingCart className="w-8 h-8 text-teal-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Punto de Venta</h1>
                <p className="text-gray-600">Sistema POS - Multiciber Las Brisas</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Fecha</p>
              <p className="text-lg font-semibold">{new Date().toLocaleDateString('es-SV')}</p>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
            'bg-yellow-50 border-yellow-500 text-yellow-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
                {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
                {notification.type === 'warning' && <AlertCircle className="w-5 h-5" />}
                <span>{notification.message}</span>
              </div>
              <button onClick={() => setNotification(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Productos y Servicios */}
          <div className="lg:col-span-2 space-y-6">
            {/* Servicios Rápidos */}
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-teal-600" />
                Servicios Rápidos
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quickServices.map((service, index) => (
                  <button
                    key={index}
                    onClick={() => addQuickService(service)}
                    className="p-3 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg text-center transition-colors"
                  >
                    <div className="text-sm font-medium text-teal-900">{service.name}</div>
                    <div className="text-lg font-bold text-teal-600">{formatCurrency(service.price)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Búsqueda de Productos */}
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-teal-600" />
                  Productos del Inventario
                </h2>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div key={product._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-24 object-cover rounded-lg mb-2"
                      />
                    )}
                    <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-teal-600">{formatCurrency(product.price)}</p>
                        <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                        className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {filteredProducts.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No se encontraron productos
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Carrito de Compras */}
          <div className="space-y-6">
            {/* Carrito */}
            <div className="bg-white rounded-xl shadow-lg border p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2 text-teal-600" />
                  Carrito
                </h2>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.product.name}</h4>
                      <p className="text-xs text-gray-600">{formatCurrency(item.unitPrice)} c/u</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateCartItemQuantity(item.product._id, item.quantity - 1)}
                        className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItemQuantity(item.product._id, item.quantity + 1)}
                        className="w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center hover:bg-teal-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-semibold text-sm">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  </div>
                ))}

                {cart.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Carrito vacío</p>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <>
                  {/* Cliente */}
                  <div className="mt-4 pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cliente (Opcional)</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Nombre del cliente"
                        value={customer.name}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        onClick={() => setShowCustomerModal(true)}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        <User className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Método de Pago */}
                  <div className="mt-4 pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`p-2 rounded-lg border text-xs font-medium ${
                          paymentMethod === 'cash' 
                            ? 'bg-teal-100 border-teal-500 text-teal-700' 
                            : 'bg-gray-50 border-gray-300 text-gray-700'
                        }`}
                      >
                        <DollarSign className="w-4 h-4 mx-auto mb-1" />
                        Efectivo
                      </button>
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`p-2 rounded-lg border text-xs font-medium ${
                          paymentMethod === 'card' 
                            ? 'bg-teal-100 border-teal-500 text-teal-700' 
                            : 'bg-gray-50 border-gray-300 text-gray-700'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 mx-auto mb-1" />
                        Tarjeta
                      </button>
                      <button
                        onClick={() => setPaymentMethod('transfer')}
                        className={`p-2 rounded-lg border text-xs font-medium ${
                          paymentMethod === 'transfer' 
                            ? 'bg-teal-100 border-teal-500 text-teal-700' 
                            : 'bg-gray-50 border-gray-300 text-gray-700'
                        }`}
                      >
                        <Calculator className="w-4 h-4 mx-auto mb-1" />
                        Transfer.
                      </button>
                    </div>
                  </div>

                  {/* Pago en Efectivo */}
                  {paymentMethod === 'cash' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Monto Recibido</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={paymentAmount || ''}
                        onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        step="0.01"
                      />
                    </div>
                  )}

                  {/* Total */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      {tax > 0 && (
                        <div className="flex justify-between">
                          <span>Impuestos:</span>
                          <span>{formatCurrency(tax)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total:</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                      {paymentMethod === 'cash' && change > 0 && (
                        <div className="flex justify-between text-green-600 font-medium">
                          <span>Cambio:</span>
                          <span>{formatCurrency(change)}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={processSale}
                      disabled={processing}
                      className="w-full mt-4 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                    >
                      {processing ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Receipt className="w-5 h-5" />
                          <span>Procesar Venta</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Receipt Modal */}
        {showReceipt && lastSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
              <div className="text-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-gray-900">¡Venta Completada!</h2>
                <p className="text-gray-600">Recibo de venta</p>
              </div>

              <div className="border-t border-b py-4 my-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Fecha:</span>
                  <span>{new Date(lastSale.createdAt).toLocaleString('es-SV')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Folio:</span>
                  <span>#{lastSale._id.slice(-6).toUpperCase()}</span>
                </div>
                {customer.name && (
                  <div className="flex justify-between">
                    <span>Cliente:</span>
                    <span>{customer.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Método:</span>
                  <span>
                    {paymentMethod === 'cash' ? 'Efectivo' : 
                     paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-sm mb-4">
                {lastSale.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.quantity}x {item.productName}</span>
                    <span>{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-1 text-sm">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(lastSale.total)}</span>
                </div>
                {lastSale.change > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Cambio:</span>
                    <span>{formatCurrency(lastSale.change)}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    window.print();
                    setShowReceipt(false);
                  }}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VentasPage;