"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  MessageCircle, 
  Package, 
  Search, 
  X, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2,
  Store,
  Box
} from 'lucide-react';
import DefaultProductImage from '@/components/DefaultProductImage';

// Estilos para animaciones
const catalogStyles = `
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
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }
  
  @keyframes cartPop {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  .animate-slideInRight {
    animation: slideInRight 0.3s ease-out;
  }
  
  .animate-cartPop {
    animation: cartPop 0.3s ease-out;
  }
  
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Custom scrollbar for cart */
  .cart-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .cart-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  .cart-scrollbar::-webkit-scrollbar-thumb {
    background: #c7d2fe;
    border-radius: 10px;
  }
  
  .cart-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a5b4fc;
  }
`;

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  unit?: string;
  image?: string;
  barcode?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Business {
  name: string;
  description?: string;
  logo?: string;
  whatsappPhone?: string;
  slug?: string;
}

const PublicCatalogPage = () => {
  const params = useParams();
  const slug = params.slug as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [business, setBusiness] = useState<Business>({ name: 'Negocio' });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        
        // Determinar si es un slug o un userId (ObjectId de MongoDB tiene 24 caracteres hex)
        const isObjectId = /^[a-f\d]{24}$/i.test(slug);
        const queryParam = isObjectId ? `userId=${slug}` : `slug=${slug}`;
        
        const response = await fetch(`/api/catalog/public?${queryParam}`);
        const data = await response.json();
        
        if (data.success) {
          setProducts(data.data.products);
          setBusiness(data.data.business);
        } else if (response.status === 404) {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error cargando catálogo:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCatalog();
    }
  }, [slug]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${slug}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
  }, [slug]);

  // Save cart to localStorage
  useEffect(() => {
    if (slug) {
      localStorage.setItem(`cart_${slug}`, JSON.stringify(cart));
    }
  }, [cart, slug]);

  const formatCategoryName = (name: string) => {
    return name?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Sin categoría';
  };

  const getCategoryColor = (categoryName: string) => {
    const colors: { [key: string]: { bg: string; text: string; border: string } } = {
      'accesorios-gaming': { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
      'almacenamiento': { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' },
      'conectividad': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
      'accesorios-trabajo': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
      'dispositivos-captura': { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
      'mantenimiento': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
      'otros': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    };
    return colors[categoryName] || { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
  };

  // Cart functions
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        return prev.map(item => 
          item._id === product._id 
            ? { ...item, quantity: newQty }
            : item
        );
      }
      return [...prev, { ...product, quantity: Math.min(quantity, product.stock) }];
    });
    
    // Trigger animation
    setCartAnimation(true);
    setTimeout(() => setCartAnimation(false), 300);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item._id !== productId));
  };

  const updateCartQuantity = (productId: string, change: number) => {
    setCart(prev => prev.map(item => {
      if (item._id === productId) {
        const newQty = item.quantity + change;
        if (newQty <= 0) return item;
        if (newQty > item.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleWhatsAppCart = () => {
    if (!business.whatsappPhone) {
      alert('Número de WhatsApp no configurado');
      return;
    }

    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    const phoneNumber = business.whatsappPhone.replace(/[^0-9]/g, '');
    
    // Build cart message
    const cartItems = cart.map((item, index) => 
      `${index + 1}. *${item.name}*\n   📦 Cantidad: ${item.quantity}\n   💰 Precio: $${item.price.toLocaleString()} c/u\n   💵 Subtotal: $${(item.price * item.quantity).toLocaleString()}`
    ).join('\n\n');
    
    const message = `¡Hola! 👋

Me gustaría realizar el siguiente pedido:

🛒 *MI CARRITO*
━━━━━━━━━━━━━━━━

${cartItems}

━━━━━━━━━━━━━━━━
🏷️ *TOTAL: $${getCartTotal().toLocaleString()}*
📦 *Productos: ${getCartItemCount()}*

¿Está disponible? ¿Cuál es el proceso de compra? 😊`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsAppSingleProduct = (product: Product) => {
    if (!business.whatsappPhone) {
      alert('Número de WhatsApp no configurado');
      return;
    }

    const phoneNumber = business.whatsappPhone.replace(/[^0-9]/g, '');
    
    const message = `¡Hola! 👋

Estoy interesado en este producto:

🏷️ *${product.name}*
💰 *Precio:* $${product.price?.toLocaleString() || '0'}
📦 *Stock:* ${product.stock} ${product.unit || 'disponibles'}
${product.description ? `\n📝 ${product.description}` : ''}

¿Está disponible? Me gustaría más información 😊`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  const isInCart = (productId: string) => {
    return cart.some(item => item._id === productId);
  };

  const getCartQuantity = (productId: string) => {
    const item = cart.find(item => item._id === productId);
    return item?.quantity || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600 mx-auto"></div>
            <Store className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-600 mt-6 font-medium">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl shadow-xl p-12 max-w-md">
          <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-12 h-12 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3">Catálogo no encontrado</h1>
          <p className="text-slate-500 mb-6">
            El catálogo que buscas no existe o ha sido eliminado.
          </p>
          <p className="text-sm text-slate-400">
            Verifica que la URL sea correcta
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: catalogStyles}} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        {/* Header - Diseño moderno tipo e-commerce */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-20">
              {/* Logo y nombre */}
              <div className="flex items-center space-x-3">
                {business.logo ? (
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl overflow-hidden shadow-md ring-2 ring-indigo-100">
                    <img src={business.logo} alt={business.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                    <Store className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                )}
                <div className="hidden sm:block">
                  <h1 className="font-bold text-slate-900 text-lg lg:text-xl">{business.name}</h1>
                  {business.description && (
                    <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">{business.description}</p>
                  )}
                </div>
              </div>

              {/* Buscador - Desktop */}
              <div className="hidden md:flex flex-1 max-w-xl mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar productos..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-700 placeholder-slate-400"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Carrito */}
              <button
                onClick={() => setShowCart(true)}
                className={`relative p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 ${cartAnimation ? 'animate-cartPop' : ''}`}
              >
                <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6" />
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 lg:w-6 lg:h-6 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                    {getCartItemCount()}
                  </span>
                )}
              </button>
            </div>

            {/* Buscador - Mobile */}
            <div className="md:hidden pb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-700 placeholder-slate-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 pb-32 lg:pb-10">
          {/* Categorías */}
          {categories.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 hidden lg:block">Categorías</h3>
              <div className="flex gap-2 lg:gap-3 overflow-x-auto pb-3 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 lg:px-6 py-2.5 lg:py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-sm active:scale-95 ${
                    !selectedCategory
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-200/50 shadow-lg'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  Todos
                </button>
                {categories.map(category => {
                  const colors = getCategoryColor(category);
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 lg:px-6 py-2.5 lg:py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-sm active:scale-95 ${
                        selectedCategory === category
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-200/50 shadow-lg'
                          : `bg-white ${colors.text} border ${colors.border} hover:shadow-md`
                      }`}
                    >
                      {formatCategoryName(category)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grid de productos */}
          {filteredProducts.length === 0 ? (
            <div className="text-center bg-white p-12 lg:p-20 rounded-3xl shadow-xl border border-slate-100">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 lg:w-12 lg:h-12 text-indigo-500" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-slate-800 mb-3">No hay productos</h3>
              <p className="text-slate-500 text-lg">
                {searchTerm ? 'No encontramos productos con ese nombre' : 'El catálogo está vacío'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6">
              {filteredProducts.map((product, index) => {
                const inCart = isInCart(product._id);
                const cartQty = getCartQuantity(product._id);
                const colors = getCategoryColor(product.category);
                
                return (
                  <div
                    key={product._id}
                    className="group bg-white rounded-2xl lg:rounded-3xl shadow-sm hover:shadow-xl border border-slate-100 hover:border-indigo-200 transition-all duration-300 overflow-hidden"
                    style={{
                      animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                    }}
                  >
                    {/* Imagen */}
                    <div 
                      className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 cursor-pointer"
                      onClick={() => handleProductClick(product)}
                    >
                      {product.image && product.image !== '/assets/images/products/default-product.svg' ? (
                        <img
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          src={product.image}
                          alt={product.name}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                          <Package className="w-12 h-12 lg:w-16 lg:h-16 text-indigo-300" />
                        </div>
                      )}
                      
                      {/* Badge de categoría */}
                      <div className={`absolute top-2 left-2 lg:top-3 lg:left-3 px-2 lg:px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} shadow-sm`}>
                        {formatCategoryName(product.category)}
                      </div>
                      
                      {/* Badge de stock bajo */}
                      {product.stock <= 5 && (
                        <div className="absolute top-2 right-2 lg:top-3 lg:right-3 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 shadow-sm">
                          ¡Últimos!
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 lg:p-5">
                      <h3 
                        className="font-bold text-slate-900 text-sm lg:text-base mb-1 line-clamp-2 cursor-pointer hover:text-indigo-600 transition-colors"
                        onClick={() => handleProductClick(product)}
                      >
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-extrabold text-lg lg:text-xl text-indigo-600">
                          ${product.price?.toLocaleString()}
                        </p>
                        <span className="text-xs text-slate-400 flex items-center">
                          <Box className="w-3 h-3 mr-1" />
                          {product.stock}
                        </span>
                      </div>

                      {/* Botón añadir al carrito */}
                      {inCart ? (
                        <div className="flex items-center justify-between bg-indigo-50 rounded-xl p-2">
                          <button
                            onClick={() => updateCartQuantity(product._id, -1)}
                            className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-indigo-100 transition-colors"
                          >
                            <Minus className="w-4 h-4 text-indigo-600" />
                          </button>
                          <span className="font-bold text-indigo-600">{cartQty}</span>
                          <button
                            onClick={() => updateCartQuantity(product._id, 1)}
                            disabled={cartQty >= product.stock}
                            className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-indigo-600 shadow-sm flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full py-2.5 lg:py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center space-x-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Añadir</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Floating cart button - Mobile */}
        {cart.length > 0 && !showCart && (
          <div className="fixed bottom-6 left-4 right-4 lg:hidden z-30">
            <button
              onClick={() => setShowCart(true)}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-bold shadow-2xl flex items-center justify-between px-6 hover:from-indigo-600 hover:to-purple-700 transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-xs font-bold rounded-full flex items-center justify-center">
                    {getCartItemCount()}
                  </span>
                </div>
                <span>Ver carrito</span>
              </div>
              <span className="text-lg">${getCartTotal().toLocaleString()}</span>
            </button>
          </div>
        )}

        {/* Cart Sidebar */}
        {showCart && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowCart(false)}
            />
            <div className="fixed top-0 right-0 h-full w-full sm:w-96 lg:w-[420px] bg-white shadow-2xl z-50 animate-slideInRight flex flex-col">
              {/* Cart Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="w-6 h-6" />
                  <div>
                    <h2 className="font-bold text-lg">Mi Carrito</h2>
                    <p className="text-white/80 text-sm">{getCartItemCount()} productos</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 cart-scrollbar">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="font-semibold text-slate-700 mb-2">Carrito vacío</h3>
                    <p className="text-slate-500 text-sm">Añade productos para comenzar</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item._id} className="bg-slate-50 rounded-2xl p-4 flex items-center space-x-4">
                      {/* Image */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white flex-shrink-0 shadow-sm">
                        {item.image && item.image !== '/assets/images/products/default-product.svg' ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                            <Package className="w-6 h-6 text-indigo-300" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">{item.name}</h4>
                        <p className="text-indigo-600 font-bold">${item.price.toLocaleString()}</p>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeFromCart(item._id);
                              } else {
                                updateCartQuantity(item._id, -1);
                              }
                            }}
                            className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-indigo-50 transition-colors"
                          >
                            {item.quantity <= 1 ? (
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            ) : (
                              <Minus className="w-3.5 h-3.5 text-slate-600" />
                            )}
                          </button>
                          <span className="font-bold text-slate-900 w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item._id, 1)}
                            disabled={item.quantity >= item.stock}
                            className="w-7 h-7 rounded-lg bg-indigo-600 shadow-sm flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Subtotal</p>
                        <p className="font-bold text-slate-900">${(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="p-5 border-t border-slate-100 bg-white space-y-4">
                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Total</span>
                    <span className="text-2xl font-extrabold text-slate-900">${getCartTotal().toLocaleString()}</span>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={handleWhatsAppCart}
                      className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all active:scale-[0.98]"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Enviar pedido por WhatsApp</span>
                    </button>
                    
                    <button
                      onClick={clearCart}
                      className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-slate-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Vaciar carrito</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 text-center">
                    Al enviar, se abrirá WhatsApp con tu pedido listo
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Product Modal */}
        {showProductModal && selectedProduct && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowProductModal(false);
              setSelectedProduct(null);
            }}
          >
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{ animation: 'slideUp 0.3s ease-out' }}
            >
              {/* Image */}
              <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-50">
                {selectedProduct.image && selectedProduct.image !== '/assets/images/products/default-product.svg' ? (
                  <img
                    className="w-full h-full object-cover"
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                    <Package className="w-20 h-20 text-indigo-300" />
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setSelectedProduct(null);
                  }}
                  className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
                
                {/* Category badge */}
                <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-full text-sm font-semibold ${getCategoryColor(selectedProduct.category).bg} ${getCategoryColor(selectedProduct.category).text} shadow-md`}>
                  {formatCategoryName(selectedProduct.category)}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-2">{selectedProduct.name}</h2>
                  {selectedProduct.description && (
                    <p className="text-slate-600">{selectedProduct.description}</p>
                  )}
                </div>

                {/* Price and Stock */}
                <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4">
                  <div>
                    <p className="text-sm text-slate-500">Precio</p>
                    <p className="text-3xl font-extrabold text-indigo-600">${selectedProduct.price?.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Disponible</p>
                    <p className="text-xl font-bold text-slate-900">{selectedProduct.stock} {selectedProduct.unit || 'unidades'}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {isInCart(selectedProduct._id) ? (
                    <div className="flex items-center justify-between bg-indigo-50 rounded-2xl p-4">
                      <span className="font-semibold text-indigo-700">En el carrito</span>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateCartQuantity(selectedProduct._id, -1)}
                          className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-indigo-100 transition-colors"
                        >
                          <Minus className="w-5 h-5 text-indigo-600" />
                        </button>
                        <span className="font-bold text-xl text-indigo-600 w-8 text-center">
                          {getCartQuantity(selectedProduct._id)}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(selectedProduct._id, 1)}
                          disabled={getCartQuantity(selectedProduct._id) >= selectedProduct.stock}
                          className="w-10 h-10 rounded-xl bg-indigo-600 shadow-sm flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        addToCart(selectedProduct);
                        setShowProductModal(false);
                        setSelectedProduct(null);
                      }}
                      className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center space-x-3 shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all active:scale-[0.98]"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Añadir al carrito</span>
                    </button>
                  )}
                  
                  {business.whatsappPhone && (
                    <button
                      onClick={() => handleWhatsAppSingleProduct(selectedProduct)}
                      className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center space-x-3 shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all active:scale-[0.98]"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Consultar por WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PublicCatalogPage;

