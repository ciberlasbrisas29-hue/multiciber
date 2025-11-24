import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';
import { uploadImageFile, deleteImageFromCloudinary } from '@/lib/cloudinary';
import logger from '@/lib/logger';

// @desc    Obtener un producto por ID
export async function GET(req, { params }) {
  await dbConnect();

  try {
    const userId = await verifyAuth();
    
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    // Handle params (may be a Promise in Next.js 16+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID de producto no proporcionado' }, { status: 400 });
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('ID inválido:', id);
      return NextResponse.json({ success: false, message: 'ID de producto inválido' }, { status: 400 });
    }

    console.log('Buscando producto:', { id, userId, userIdType: typeof userId });

    const product = await Product.findOne({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: userId
    }).select('-createdBy');

    if (!product) {
      console.log('Producto no encontrado:', { id, userId });
      return NextResponse.json({ success: false, message: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Error al obtener producto:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

// @desc    Actualizar un producto
export async function PUT(req, { params }) {
  await dbConnect();
  
  try {
    const userId = await verifyAuth();
    
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    // Handle params (may be a Promise in Next.js 16+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'ID de producto inválido' }, { status: 400 });
    }
    
    // Handle both JSON and FormData
    let formData;
    let isFormData = false;
    
    try {
      formData = await req.formData();
      isFormData = true;
    } catch {
      formData = await req.json();
    }
    
    // Extract fields based on data type
    let name, price, cost, category, unit, barcode, stock, minStock, description, tags, imageFile;
    
    if (isFormData) {
      name = formData.get('name');
      price = formData.get('price');
      cost = formData.get('cost');
      category = formData.get('category');
      unit = formData.get('unit');
      barcode = formData.get('barcode') || '';
      stock = formData.get('stock') || '0';
      minStock = formData.get('minStock') || '0';
      description = formData.get('description') || '';
      imageFile = formData.get('image');
      const processedTags = formData.get('processedTags');
      tags = processedTags ? JSON.parse(processedTags) : [];
    } else {
      ({
        name,
        price,
        cost,
        category,
        unit,
        barcode = '',
        stock = 0,
        minStock = 0,
        description = '',
        tags = []
      } = formData);
    }
    
    const body = isFormData ? {} : formData;

    const product = await Product.findOne({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: userId
    });

    if (!product) {
      console.log('Producto no encontrado para actualizar:', { id, userId });
      return NextResponse.json({ success: false, message: 'Producto no encontrado' }, { status: 404 });
    }

    // Validación de categoría si se está cambiando
    if (category && category !== product.category) {
      const normalizedCategory = category.trim().toLowerCase();
      const categoryExists = await Category.findOne({
        name: normalizedCategory,
        createdBy: userId,
        isActive: true
      });

      if (!categoryExists) {
        return NextResponse.json(
          { success: false, message: 'La categoría especificada no existe o no está activa' },
          { status: 400 }
        );
      }
    }

    // Validación de barcode si se está cambiando (solo productos activos)
    if (barcode && barcode !== product.barcode) {
      const existingProduct = await Product.findOne({ 
        barcode: barcode,
        _id: { $ne: new mongoose.Types.ObjectId(id) },
        createdBy: userId,
        isActive: true  // Solo considerar productos activos
      });
      if (existingProduct) {
        return NextResponse.json({ success: false, message: 'El código de barras ya está en uso por un producto activo' }, { status: 400 });
      }
    }

    // Handle image upload to Cloudinary
    let imagePath = product.image; // Mantener la imagen actual por defecto
    let oldPublicId = null;
    
    // Detectar si la imagen actual es de Cloudinary (contiene cloudinary.com)
    const currentImageIsCloudinary = product.image && 
      product.image.includes('cloudinary.com') &&
      product.image.includes('/products/');
    
    // Extraer public_id de la imagen actual si es de Cloudinary
    if (currentImageIsCloudinary && imageFile) {
      try {
        // Extraer public_id de la URL de Cloudinary
        // Formato: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/products/public_id.jpg
        const urlParts = product.image.split('/products/');
        if (urlParts.length > 1) {
          const publicIdWithExt = urlParts[1].split('.')[0]; // Remover extensión y parámetros
          oldPublicId = `products/${publicIdWithExt}`;
        }
      } catch (e) {
        logger.debug('Could not extract public_id from current image', { error: e });
      }
    }
    
    if (imageFile && imageFile instanceof File) {
      try {
        logger.info('Uploading updated product image to Cloudinary', { 
          fileName: imageFile.name, 
          size: imageFile.size,
          oldPublicId 
        });

        // Si hay una imagen anterior de Cloudinary, usar el mismo public_id para sobrescribirla
        // Esto ayuda a mantener el mismo URL y limpiar imágenes antiguas
        const publicId = oldPublicId ? oldPublicId.split('/')[1] : null; // Solo el ID sin carpeta
        
        // Upload to Cloudinary (si hay publicId, se sobrescribirá automáticamente)
        const uploadResult = await uploadImageFile(imageFile, 'products', publicId);
        imagePath = uploadResult.secure_url;
        
        logger.info('Product image updated successfully', { 
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id 
        });
      } catch (uploadError) {
        logger.error('Error uploading image to Cloudinary:', uploadError);
        // Continue with current image if upload fails
      }
    }

    // Update product fields - handle both FormData and JSON
    if (isFormData) {
      // FormData case
      if (name !== undefined && name !== null) product.name = name.trim();
      if (description !== undefined && description !== null) product.description = description.trim();
      if (price !== undefined && price !== null) product.price = parseFloat(price);
      if (cost !== undefined && cost !== null) product.cost = parseFloat(cost);
      if (category !== undefined && category !== null) product.category = category.trim();
      if (unit !== undefined && unit !== null) product.unit = unit.trim();
      if (stock !== undefined && stock !== null) product.stock = parseInt(stock);
      if (minStock !== undefined && minStock !== null) product.minStock = parseInt(minStock);
      if (barcode !== undefined) product.barcode = barcode ? barcode.trim() : undefined;
      if (imagePath) product.image = imagePath;
      if (tags !== undefined) product.tags = Array.isArray(tags) ? tags : [];
    } else {
      // JSON case - update all fields from body
      if (body.name !== undefined) product.name = body.name.trim();
      if (body.description !== undefined) product.description = body.description.trim();
      if (body.price !== undefined) product.price = parseFloat(body.price);
      if (body.cost !== undefined) product.cost = parseFloat(body.cost);
      if (body.category !== undefined) product.category = body.category.trim();
      if (body.unit !== undefined) product.unit = body.unit.trim();
      if (body.stock !== undefined) product.stock = parseInt(body.stock);
      if (body.minStock !== undefined) product.minStock = parseInt(body.minStock);
      if (body.barcode !== undefined) product.barcode = body.barcode ? body.barcode.trim() : undefined;
      if (body.tags !== undefined) product.tags = Array.isArray(body.tags) ? body.tags : [];
      
      // Update other fields that might exist in JSON body
    Object.keys(body).forEach(key => {
        if (!['name', 'description', 'price', 'cost', 'category', 'unit', 'stock', 'minStock', 'barcode', 'image', 'tags'].includes(key) && body[key] !== undefined) {
        product[key] = body[key];
      }
    });
    }

    await product.save();

    return NextResponse.json({
      success: true,
      data: product.getPublicData(),
      message: 'Producto actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

// @desc    Eliminar un producto
export async function DELETE(req, { params }) {
  await dbConnect();

  try {
    const userId = await verifyAuth();
    
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    // Handle params (may be a Promise in Next.js 16+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'ID de producto inválido' }, { status: 400 });
    }

    const product = await Product.findOne({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: userId
    });

    if (!product) {
      return NextResponse.json({ success: false, message: 'Producto no encontrado' }, { status: 404 });
    }

    product.isActive = false;
    await product.save();

    return NextResponse.json({
      success: true,
      message: 'Producto desactivado exitosamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
