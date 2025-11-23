"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import BarcodeScanner from '@/components/BarcodeScanner';
import DefaultProductImage from '@/components/DefaultProductImage';
import { Camera, Upload, X, Save, ArrowLeft, Image as ImageIcon, Scan, Tag, DollarSign, Package, ShoppingCart, BarChart3, Hash, Building2, Trash2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const EditProductPage = () => {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'general' | 'variants' | 'images'>('general');
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    category: 'otros',
    unit: 'unidades',
    stock: '',
    minStock: '',
    barcode: '',
    supplier: '',
    tags: ''
  });
  
  const [images, setImages] = useState<Array<{ file?: File; preview: string; isExisting?: boolean }>>([]);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const categories = [
    { value: 'accesorios-gaming', label: 'Accesorios Gaming' },
    { value: 'almacenamiento', label: 'Almacenamiento' },
    { value: 'conectividad', label: 'Conectividad' },
    { value: 'accesorios-trabajo', label: 'Accesorios de Trabajo' },
    { value: 'dispositivos-captura', label: 'Dispositivos de Captura' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'otros', label: 'Otros' }
  ];

  const units = [
    { value: 'unidades', label: 'Unidades' },
    { value: 'piezas', label: 'Piezas' },
    { value: 'metros', label: 'Metros' },
    { value: 'pulgadas', label: 'Pulgadas' },
    { value: 'gb', label: 'GB' },
    { value: 'tb', label: 'TB' }
  ];

  // Cargar producto
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`/api/products/${productId}`);
        
        if (response.data.success) {
          const productData = response.data.data;
          setProduct(productData);
          
          // Precargar formulario
          setFormData({
            name: productData.name || '',
            description: productData.description || '',
            price: productData.price?.toString() || '',
            cost: productData.cost?.toString() || '',
            category: productData.category || 'otros',
            unit: productData.unit || 'unidades',
            stock: productData.stock?.toString() || '0',
            minStock: productData.minStock?.toString() || '0',
            barcode: productData.barcode || '',
            supplier: productData.supplier || '',
            tags: Array.isArray(productData.tags) ? productData.tags.join(', ') : ''
          });

          // Precargar imagen existente
          if (productData.image && productData.image !== '/assets/images/products/default-product.svg') {
            setImages([{ preview: productData.image, isExisting: true }]);
          }
        } else {
          setError('Producto no encontrado');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Las imágenes no pueden ser mayores a 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona archivos de imagen válidos');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, { file, preview: e.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    
    setError('');
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newImages = [...images];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      setImages(newImages);
    } else if (direction === 'down' && index < images.length - 1) {
      const newImages = [...images];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      setImages(newImages);
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    setFormData(prev => ({
      ...prev,
      barcode: barcode
    }));
    setShowBarcodeScanner(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // Validaciones básicas
      if (!formData.name.trim()) {
        throw new Error('El nombre del producto es requerido');
      }
      
      if (!formData.price || parseFloat(formData.price) <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }
      
      if (!formData.cost || parseFloat(formData.cost) <= 0) {
        throw new Error('El costo debe ser mayor a 0');
      }

      if (parseFloat(formData.stock || '0') < 0) {
        throw new Error('El stock no puede ser negativo');
      }

      if (parseFloat(formData.minStock || '0') < 0) {
        throw new Error('El stock mínimo no puede ser negativo');
      }

      // Preparar datos del formulario
      const submitData = new FormData();
      
      // Agregar campos del producto
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          submitData.append(key, value.toString());
        }
      });

      // Agregar primera imagen nueva (el API actual solo acepta una)
      const newImage = images.find(img => img.file);
      if (newImage?.file) {
        submitData.append('image', newImage.file);
      } else if (images.length === 0 || !images[0]?.isExisting) {
        // Si no hay imagen nueva ni existente, mantener la actual
        if (product?.image) {
          // El backend debería mantener la imagen si no se envía una nueva
        }
      }

      // Procesar tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      submitData.append('processedTags', JSON.stringify(tags));

      // Enviar al API usando PUT
      const response = await axios.put(`/api/products/${productId}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Disparar evento personalizado para actualizar notificaciones de stock bajo
        window.dispatchEvent(new CustomEvent('product-updated'));
        window.dispatchEvent(new CustomEvent('stock-updated'));
        
        setSuccess('Producto actualizado exitosamente');
        setTimeout(() => {
          router.push('/inventory?success=updated');
        }, 1000);
      } else {
        throw new Error(response.data.message || 'Error al actualizar el producto');
      }
      
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar el producto');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    
    try {
      const response = await axios.delete(`/api/products/${productId}`);
      
      if (response.data.success) {
        router.push('/inventory?success=deleted');
      } else {
        throw new Error(response.data.message || 'Error al eliminar el producto');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al eliminar el producto');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 pb-24 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h2>
          <p className="text-gray-600 mb-4">{error || 'El producto que buscas no existe'}</p>
          <button
            onClick={() => router.push('/inventory')}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors"
          >
            Volver al inventario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 pb-24">
      {/* Header con botón de regreso */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 mb-6 -mx-6 rounded-b-2xl">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            type="button"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Editar Producto</h1>
            <p className="text-sm text-white/80">{product.name}</p>
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <div className="mb-6 bg-white rounded-2xl shadow-md p-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'general'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Información General
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'images'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Imágenes
          </button>
          <button
            onClick={() => setActiveTab('variants')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'variants'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Variantes
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-6">
            <p className="text-green-700 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Pestaña: Información General */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-6 md:p-8 mb-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Información del Producto</h2>
                <p className="text-sm text-gray-500">Actualiza los datos básicos del producto</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Nombre y Descripción */}
              <div className="space-y-4">
                <div className="relative">
                  <label htmlFor="name" className="flex items-center space-x-2 text-sm font-semibold text-gray-800 mb-3">
                    <Tag className="w-4 h-4 text-purple-600" />
                    <span>Nombre del Producto <span className="text-red-500">*</span></span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium text-gray-900 placeholder-gray-400"
                      placeholder="Ej: Mouse Gaming RGB Logitech"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-3">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-y text-gray-900 placeholder-gray-400"
                    placeholder="Describe las características principales del producto..."
                  />
                </div>
              </div>

              {/* Precios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div>
                  <label htmlFor="price" className="flex items-center space-x-2 text-sm font-semibold text-gray-800 mb-3">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span>Precio de Venta <span className="text-red-500">*</span></span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-semibold text-lg text-gray-900 placeholder-gray-400"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cost" className="flex items-center space-x-2 text-sm font-semibold text-gray-800 mb-3">
                    <ShoppingCart className="w-4 h-4 text-orange-600" />
                    <span>Precio de Compra/Costo <span className="text-red-500">*</span></span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
                    <input
                      type="number"
                      id="cost"
                      name="cost"
                      value={formData.cost}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-semibold text-lg text-gray-900 placeholder-gray-400"
                      placeholder="Ej: $10.00"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      required
                    />
                  </div>
                  {formData.price && formData.cost && parseFloat(formData.price) > 0 && parseFloat(formData.cost) > 0 && (
                    <p className="text-xs text-green-600 mt-2 font-medium">
                      Ganancia: ${(parseFloat(formData.price) - parseFloat(formData.cost)).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Categoría y Unidad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div>
                  <label htmlFor="category" className="flex items-center space-x-2 text-sm font-semibold text-gray-800 mb-3">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <span>Categoría <span className="text-red-500">*</span></span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium bg-white text-gray-900 appearance-none cursor-pointer"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="unit" className="block text-sm font-semibold text-gray-800 mb-3">
                    Unidad de Medida <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium bg-white text-gray-900 appearance-none cursor-pointer"
                    required
                  >
                    {units.map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div>
                  <label htmlFor="stock" className="flex items-center space-x-2 text-sm font-semibold text-gray-800 mb-3">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>Stock Actual</span>
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium text-gray-900 placeholder-gray-400"
                    placeholder="Ej: 100 unidades"
                    min="0"
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <label htmlFor="minStock" className="block text-sm font-semibold text-gray-800 mb-3">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    id="minStock"
                    name="minStock"
                    value={formData.minStock}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium text-gray-900 placeholder-gray-400"
                    placeholder="0"
                    min="0"
                    inputMode="numeric"
                  />
                </div>
              </div>

              {/* Código de Barras */}
              <div className="pt-4 border-t border-gray-100">
                <label htmlFor="barcode" className="flex items-center space-x-2 text-sm font-semibold text-gray-800 mb-3">
                  <Hash className="w-4 h-4 text-purple-600" />
                  <span>Código de Barras (Opcional)</span>
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    id="barcode"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-mono text-gray-900 placeholder-gray-400"
                    placeholder="Código de barras"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBarcodeScanner(true)}
                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md"
                    title="Escanear código de barras"
                  >
                    <Scan className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Proveedor */}
              <div className="pt-4 border-t border-gray-100">
                <label htmlFor="supplier" className="flex items-center space-x-2 text-sm font-semibold text-gray-800 mb-3">
                  <Building2 className="w-4 h-4 text-gray-600" />
                  <span>Proveedor (Opcional)</span>
                </label>
                <input
                  type="text"
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-400"
                  placeholder="Nombre del proveedor"
                />
              </div>

              {/* Etiquetas */}
              <div className="pt-4 border-t border-gray-100">
                <label htmlFor="tags" className="block text-sm font-semibold text-gray-800 mb-3">
                  Etiquetas (Opcional)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-400"
                  placeholder="gaming, rgb, mouse (separadas por comas)"
                />
                <p className="text-xs text-gray-500 mt-2">Ayudan a organizar y buscar productos</p>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Imágenes */}
        {activeTab === 'images' && (
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-6 md:p-8 mb-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Imágenes del Producto</h2>
                <p className="text-sm text-gray-500">Actualiza las imágenes del producto</p>
              </div>
            </div>

            {/* Área de carga de imágenes */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all mb-6"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Añadir Imagen(es)</p>
                <p className="text-sm text-gray-500">Haz clic o arrastra imágenes aquí</p>
                <p className="text-xs text-gray-400 mt-2">JPG, PNG hasta 5MB cada una</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Galería de imágenes con controles de orden */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                    />
                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => moveImage(index, 'up')}
                          className="bg-blue-500 text-white rounded-full p-1.5 hover:bg-blue-600 transition-all shadow-lg"
                          title="Mover arriba"
                        >
                          <ArrowLeft className="w-3 h-3 rotate-90" />
                        </button>
                      )}
                      {index < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveImage(index, 'down')}
                          className="bg-blue-500 text-white rounded-full p-1.5 hover:bg-blue-600 transition-all shadow-lg"
                          title="Mover abajo"
                        >
                          <ArrowLeft className="w-3 h-3 -rotate-90" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-all shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                        Principal
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pestaña: Variantes */}
        {activeTab === 'variants' && (
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-6 md:p-8 mb-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Variantes del Producto</h2>
                <p className="text-sm text-gray-500">Agrega variantes como talla, color, etc.</p>
              </div>
            </div>

            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Funcionalidad próximamente</h3>
              <p className="text-gray-500">La gestión de variantes estará disponible en una futura actualización.</p>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Botón Eliminar */}
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving || isDeleting}
              className="w-full sm:w-auto px-6 py-3 text-red-600 bg-white border-2 border-red-300 rounded-xl hover:bg-red-50 hover:border-red-400 transition-all font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Eliminar Producto
            </button>

            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              {/* Botón Cancelar */}
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving || isDeleting}
              >
                Cancelar
              </button>

              {/* Botón Guardar */}
              <button
                type="submit"
                disabled={isSaving || isDeleting}
                className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-3 rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all disabled:from-teal-400 disabled:to-teal-500 shadow-lg font-semibold"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Eliminar Producto</h3>
                <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que deseas eliminar el producto <strong>{product?.name}</strong>? 
              El producto será marcado como inactivo.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
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

export default EditProductPage;

