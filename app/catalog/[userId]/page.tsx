"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MessageCircle, Package, Search, X, ShoppingCart, DollarSign, Box } from 'lucide-react';
import DefaultProductImage from '@/components/DefaultProductImage';

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-8 rounded-b-3xl shadow-lg">
        {business.logo && (
          <img src={business.logo} alt={business.name} className="w-16 h-16 rounded-full mx-auto mb-4 object-cover" />
        )}
        <h1 className="text-3xl font-bold text-center mb-2">{business.name}</h1>
        {business.description && (
          <p className="text-purple-100 text-center text-sm">{business.description}</p>
        )}
      </div>

      <div className="px-4 py-6">
        {/* Buscador */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
          />
        </div>

        {/* Filtros de categoría */}
        {categories.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                !selectedCategory
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              Todas
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                {formatCategoryName(category)}
              </button>
            ))}
          </div>
        )}

        {/* Lista de productos */}
        {filteredProducts.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-2xl shadow-md">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay productos disponibles</h3>
            <p className="text-gray-500">
              {searchTerm ? 'No se encontraron productos que coincidan con tu búsqueda' : 'No hay productos en el catálogo'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                onClick={() => handleProductClick(product)}
                className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 cursor-pointer hover:shadow-lg transition-shadow active:scale-[0.98]"
              >
                <div className="flex items-start space-x-4">
                  {/* Imagen del producto */}
                  <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
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
                      <DefaultProductImage width={80} height={80} alt={product.name} />
                    )}
                  </div>

                  {/* Información del producto */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Precio</p>
                        <p className="font-bold text-xl text-purple-600">
                          ${product.price?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Stock: {product.stock} {product.unit || 'unidades'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalles del Producto */}
      {showProductModal && selectedProduct && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <button
              onClick={() => {
                setShowProductModal(false);
                setSelectedProduct(null);
              }}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Imagen del producto */}
            <div className="w-full h-48 rounded-2xl overflow-hidden bg-gray-100 mb-4">
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
                <DefaultProductImage width={400} height={200} alt={selectedProduct.name} />
              )}
            </div>

            {/* Información del producto */}
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h2>
                {selectedProduct.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">{selectedProduct.description}</p>
                )}
              </div>

              {/* Detalles del producto */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-600">Precio</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    ${selectedProduct.price?.toLocaleString() || '0'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-purple-200 pt-3">
                  <div className="flex items-center space-x-2">
                    <Box className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-600">Stock disponible</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {selectedProduct.stock} {selectedProduct.unit || 'unidades'}
                  </span>
                </div>

                {selectedProduct.category && (
                  <div className="flex items-center justify-between border-t border-purple-200 pt-3">
                    <span className="text-sm text-gray-600">Categoría</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCategoryName(selectedProduct.category)}
                    </span>
                  </div>
                )}
              </div>

              {/* Botón de WhatsApp */}
              {business.whatsappPhone ? (
                <button
                  onClick={() => handleWhatsAppClick(selectedProduct)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 transition-colors shadow-lg active:scale-[0.98]"
                >
                  <MessageCircle className="w-6 h-6" />
                  <span>Contactar por WhatsApp</span>
                </button>
              ) : (
                <div className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-semibold text-center">
                  WhatsApp no disponible
                </div>
              )}

              {/* Información adicional */}
              <p className="text-xs text-gray-500 text-center">
                Al hacer clic, se abrirá WhatsApp con un mensaje prellenado con los detalles del producto
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicCatalogPage;
