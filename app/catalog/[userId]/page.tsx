"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MessageCircle, Package, Search, X, ShoppingCart, DollarSign, Box } from 'lucide-react';
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
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
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

interface Business {
  name: string;
  description?: string;
  logo?: string;
  whatsappPhone?: string;
}

const PublicCatalogPage = () => {
  const params = useParams();
  const userId = params.userId as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [business, setBusiness] = useState<Business>({ name: 'Negocio' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/catalog/public?userId=${userId}`);
        const data = await response.json();
        
        if (data.success) {
          setProducts(data.data.products);
          setBusiness(data.data.business);
        }
      } catch (error) {
        console.error('Error cargando catálogo:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchCatalog();
    }
  }, [userId]);

  const formatCategoryName = (name: string) => {
    return name?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Sin categoría';
  };

  const getCategoryIcon = (categoryName: string) => {
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

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleWhatsAppClick = (product: Product) => {
    if (!business.whatsappPhone) {
      alert('Número de WhatsApp no configurado');
      return;
    }

    const phoneNumber = business.whatsappPhone.replace(/[^0-9]/g, '');
    
    // Crear mensaje con detalles del producto y emojis
    // Los emojis deben estar directamente en el string para que se codifiquen correctamente
    const emojiWave = '👋'; // U+1F44B
    const emojiLabel = '🏷️'; // U+1F3F7 + U+FE0F
    const emojiMoney = '💰'; // U+1F4B0
    const emojiBox = '📦'; // U+1F4E6
    const emojiNote = '📝'; // U+1F4DD
    const emojiFolder = '📂'; // U+1F4C2
    const emojiCart = '🛒'; // U+1F6D2
    const emojiSmile = '😊'; // U+1F60A
    
    // Construir mensaje completo con emojis directamente incluidos
    const message = `¡Hola! ${emojiWave}


Estoy interesado en el siguiente producto:

${emojiLabel} *Producto:* ${product.name}

${emojiMoney} *Precio:* $${product.price?.toLocaleString() || '0'}

${emojiBox} *Stock disponible:* ${product.stock} ${product.unit || 'unidades'}

${emojiNote} *Descripción:* ${product.description || ''}

${emojiFolder} *Categoría:* ${product.category ? formatCategoryName(product.category) : ''}

${emojiCart} Me gustaría obtener más información y realizar la compra. ¡Gracias! ${emojiSmile}`;
    
    // Codificar el mensaje para WhatsApp
    // encodeURIComponent maneja correctamente los emojis Unicode
    const encodedMessage = encodeURIComponent(message);
    
    // Construir URL de WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Abrir WhatsApp en nueva ventana
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    // Cerrar el modal después de abrir WhatsApp
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: catalogStyles}} />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50">
      {/* Header Mejorado */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-500 text-white px-6 py-10 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
        </div>
        
        <div className="relative z-10">
          {business.logo && (
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm p-2 shadow-xl border-2 border-white/30">
                <img 
                  src={business.logo} 
                  alt={business.name} 
                  className="w-full h-full rounded-xl object-cover" 
                />
              </div>
            </div>
          )}
          <h1 className="text-4xl font-extrabold text-center mb-3 drop-shadow-lg">{business.name}</h1>
          {business.description && (
            <p className="text-white/90 text-center text-sm max-w-md mx-auto leading-relaxed">
              {business.description}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 py-6 -mt-6 relative z-20">
        {/* Buscador Mejorado */}
        <div className="mb-6 relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Buscar productos..."
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-purple-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-lg text-gray-700 placeholder-gray-400 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Filtros de categoría Mejorados */}
        {categories.length > 0 && (
          <div className="mb-6 flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-md active:scale-95 ${
                !selectedCategory
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-200'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:shadow-md'
              }`}
            >
              ✨ Todas
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-md active:scale-95 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-200'
                    : `bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:shadow-md ${getCategoryIcon(category)}`
                }`}
              >
                {formatCategoryName(category)}
              </button>
            ))}
          </div>
        )}

        {/* Lista de productos - Grid Mejorado */}
        {filteredProducts.length === 0 ? (
          <div className="text-center bg-white p-16 rounded-3xl shadow-xl border-2 border-purple-100">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-purple-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Aún no hay productos</h3>
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'No encontramos productos con ese nombre' : 'El catálogo está vacío por ahora'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map((product, index) => (
              <div
                key={product._id}
                onClick={() => handleProductClick(product)}
                className="bg-white rounded-3xl p-5 shadow-lg border-2 border-purple-50 cursor-pointer hover:shadow-2xl hover:border-purple-200 transition-all duration-300 active:scale-[0.97] group overflow-hidden relative"
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Efecto de brillo al hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-indigo-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:via-indigo-500/5 group-hover:to-pink-500/5 transition-all duration-300 pointer-events-none"></div>
                
                <div className="relative z-10">
                  {/* Imagen del producto mejorada */}
                  <div className="w-full h-48 flex-shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 to-indigo-100 mb-4 shadow-inner group-hover:shadow-lg transition-shadow">
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
                      <DefaultProductImage width={400} height={200} alt={product.name} />
                    )}
                  </div>

                  {/* Información del producto */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg mb-1.5 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Badge de categoría */}
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryIcon(product.category)}`}>
                        {formatCategoryName(product.category)}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center space-x-1">
                        <Box className="w-3 h-3" />
                        <span>{product.stock} {product.unit || 'disp.'}</span>
                      </span>
                    </div>

                    {/* Precio destacado */}
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Precio</p>
                      <p className="font-extrabold text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        ${product.price?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalles del Producto Mejorado */}
      {showProductModal && selectedProduct && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar mejorado */}
            <button
              onClick={() => {
                setShowProductModal(false);
                setSelectedProduct(null);
              }}
              className="absolute top-4 right-4 p-2.5 hover:bg-red-50 rounded-full transition-all hover:rotate-90 active:scale-95 z-20"
            >
              <X className="w-5 h-5 text-gray-500 hover:text-red-500 transition-colors" />
            </button>

            {/* Imagen del producto mejorada */}
            <div className="w-full h-64 rounded-3xl overflow-hidden bg-gradient-to-br from-purple-100 via-indigo-100 to-pink-100 mb-6 shadow-xl">
              {selectedProduct.image && selectedProduct.image !== '/assets/images/products/default-product.svg' ? (
                <img
                  className="w-full h-full object-cover"
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <DefaultProductImage width={400} height={300} alt={selectedProduct.name} />
              )}
            </div>

            {/* Información del producto mejorada */}
            <div className="space-y-5">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-3 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {selectedProduct.name}
                </h2>
                {selectedProduct.description && (
                  <p className="text-gray-600 text-base leading-relaxed">{selectedProduct.description}</p>
                )}
              </div>

              {/* Detalles del producto mejorados */}
              <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 rounded-3xl p-5 space-y-4 border-2 border-purple-100 shadow-inner">
                <div className="flex items-center justify-between p-3 bg-white/60 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Precio</span>
                  </div>
                  <span className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    ${selectedProduct.price?.toLocaleString() || '0'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/60 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                      <Box className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Stock disponible</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    {selectedProduct.stock} {selectedProduct.unit || 'unidades'}
                  </span>
                </div>

                {selectedProduct.category && (
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-2xl backdrop-blur-sm">
                    <span className="text-sm font-semibold text-gray-700">Categoría</span>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${getCategoryIcon(selectedProduct.category)}`}>
                      {formatCategoryName(selectedProduct.category)}
                    </span>
                  </div>
                )}
              </div>

              {/* Botón de WhatsApp mejorado */}
              {business.whatsappPhone ? (
                <button
                  onClick={() => handleWhatsAppClick(selectedProduct)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-5 rounded-2xl font-bold flex items-center justify-center space-x-3 transition-all shadow-xl hover:shadow-2xl active:scale-[0.97] transform"
                >
                  <MessageCircle className="w-6 h-6" />
                  <span className="text-lg">Contactar por WhatsApp</span>
                </button>
              ) : (
                <div className="w-full bg-gray-100 text-gray-500 py-5 rounded-2xl font-semibold text-center border-2 border-gray-200">
                  WhatsApp no disponible
                </div>
              )}

              {/* Información adicional mejorada */}
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                💬 Al hacer clic, se abrirá WhatsApp con un mensaje prellenado con los detalles del producto
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default PublicCatalogPage;
