"use client";

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BarcodeScanner from '@/components/BarcodeScanner';
import { Camera, Upload, X, Save, ArrowLeft, Image as ImageIcon, Scan, Tag, DollarSign, Package, ShoppingCart, BarChart3, Hash, Building2 } from 'lucide-react';

const CreateProductPage = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const [images, setImages] = useState<Array<{ file: File; preview: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [error, setError] = useState('');

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
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
    setIsLoading(true);
    setError('');

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

      // Agregar primera imagen (el API actual solo acepta una)
      if (images.length > 0) {
        submitData.append('image', images[0].file);
      }

      // Procesar tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      submitData.append('processedTags', JSON.stringify(tags));

      // Enviar al API
      const response = await fetch('/api/products', {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Mostrar el mensaje de error del servidor o un mensaje genérico
        const errorMessage = result.message || `Error ${response.status}: ${response.statusText}`;
        console.error('Error creating product:', {
          status: response.status,
          statusText: response.statusText,
          result
        });
        throw new Error(errorMessage);
      }

      // Producto creado exitosamente
      router.push('/inventory?success=created');
      
    } catch (err: any) {
      setError(err.message || 'Error interno del servidor');
    } finally {
      setIsLoading(false);
    }
  };

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
          <div>
            <h1 className="text-xl font-bold text-white">Crear Producto</h1>
            <p className="text-sm text-white/80">Agrega un nuevo producto al inventario</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Tarjeta Principal del Formulario */}
        <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-6 md:p-8 mb-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Información del Producto</h2>
              <p className="text-sm text-gray-500">Completa los datos básicos del producto</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Sección: Nombre y Descripción */}
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

            {/* Sección: Precios */}
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

            {/* Sección: Categoría y Unidad */}
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

            {/* Sección: Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div>
                <label htmlFor="stock" className="flex items-center space-x-2 text-sm font-semibold text-gray-800 mb-3">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Stock Inicial</span>
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

            {/* Sección: Código de Barras */}
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

            {/* Sección: Proveedor */}
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

            {/* Sección: Etiquetas */}
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

        {/* Sección: Imágenes del Producto */}
        <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-6 md:p-8 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Imágenes del Producto</h2>
              <p className="text-sm text-gray-500">Añade una o más imágenes del producto</p>
            </div>
          </div>

          {/* Área de carga de imágenes */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all"
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

          {/* Galería de imágenes */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium shadow-sm"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-3 rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all disabled:from-teal-400 disabled:to-teal-500 shadow-lg font-semibold"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Guardar Producto</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onScan={handleBarcodeScanned}
        onClose={() => setShowBarcodeScanner(false)}
      />
    </div>
  );
};

export default CreateProductPage;
