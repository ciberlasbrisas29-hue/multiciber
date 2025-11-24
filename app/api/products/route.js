import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
// Removed fs/promises imports - not available in serverless environments

import logger from '@/lib/logger';
import { handleError } from '@/lib/errors';
import { verifyAuth } from '@/lib/auth';
import { uploadImageFile, deleteImageFromCloudinary } from '@/lib/cloudinary';

// Helper function to get user from token
async function getUserFromToken(req) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return null;
    }
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    logger.debug('Error verifying token:', error);
    return null;
  }
}

// @desc    Obtener todos los productos
export async function GET(req) {
  await dbConnect();
  
  try {
    const user = await getUserFromToken(req);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    const filters = { createdBy: user._id };
    
    // Por defecto, solo mostrar productos activos (a menos que se especifique lo contrario)
    if (isActive !== null) {
      filters.isActive = isActive === 'true';
    } else {
      filters.isActive = true;  // Por defecto solo productos activos
    }
    
    if (category) filters.category = category;
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    logger.debug('Fetching products with filters:', filters);

    const products = await Product.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-createdBy -__v');

    const total = await Product.countDocuments(filters);

    logger.debug(`Found ${products.length} products, total: ${total}`);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Error al obtener productos:', error);
    const errorResponse = handleError(error, req);
    
    return NextResponse.json(
      {
        success: errorResponse.success,
        message: errorResponse.message,
      },
      { status: errorResponse.statusCode }
    );
  }
}

// @desc    Crear un nuevo producto
export async function POST(req) {
  await dbConnect();

  try {
    const user = await getUserFromToken(req);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' }, 
        { status: 401 }
      );
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

    // Parse numeric values
    const priceNum = parseFloat(price);
    const costNum = parseFloat(cost);
    const stockNum = parseInt(stock || '0');
    const minStockNum = parseInt(minStock || '0');

    // Validation
    if (!name || !price || !cost || !category || !unit) {
      logger.error('Validation failed: Missing required fields', { name, price, cost, category, unit });
      return NextResponse.json(
        { success: false, message: 'Faltan campos requeridos: name, price, cost, category, unit' }, 
        { status: 400 }
      );
    }

    // Validar que la categoría exista y esté activa
    const normalizedCategory = category.trim().toLowerCase();
    const categoryExists = await Category.findOne({
      name: normalizedCategory,
      createdBy: user._id,
      isActive: true
    });

    if (!categoryExists) {
      logger.error('Validation failed: Category does not exist', { category: normalizedCategory, userId: user._id });
      return NextResponse.json(
        { success: false, message: 'La categoría especificada no existe o no está activa' }, 
        { status: 400 }
      );
    }

    // Asegurar que usamos el nombre normalizado de la categoría
    const finalCategory = normalizedCategory;

    if (isNaN(priceNum) || isNaN(costNum) || priceNum <= 0 || costNum <= 0) {
      logger.error('Validation failed: Invalid price or cost', { priceNum, costNum });
      return NextResponse.json(
        { success: false, message: 'El precio y costo deben ser mayor a 0' }, 
        { status: 400 }
      );
    }

    if (isNaN(stockNum) || isNaN(minStockNum) || stockNum < 0 || minStockNum < 0) {
      logger.error('Validation failed: Invalid stock values', { stockNum, minStockNum });
      return NextResponse.json(
        { success: false, message: 'El stock y stock mínimo no pueden ser negativos' }, 
        { status: 400 }
      );
    }

    // Check if barcode is unique (if provided) - solo productos activos
    if (barcode) {
      const existingProduct = await Product.findOne({ 
        barcode, 
        createdBy: user._id,
        isActive: true  // Solo considerar productos activos
      });
      
      if (existingProduct) {
        return NextResponse.json(
          { success: false, message: 'El código de barras ya está en uso por un producto activo' }, 
          { status: 400 }
        );
      }
    }

    // Check if name is unique for this user (solo productos activos)
    const existingName = await Product.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }, 
      createdBy: user._id,
      isActive: true  // Solo considerar productos activos
    });
    
    if (existingName) {
      return NextResponse.json(
        { success: false, message: 'Ya existe un producto activo con ese nombre' }, 
        { status: 400 }
      );
    }

    // Handle image upload to Cloudinary
    let imagePath = '/assets/images/products/default-product.svg';
    let uploadedImagePublicId = null; // Para poder eliminar la imagen si falla la creación
    
    // Verificar que Cloudinary esté configurado
    const cloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                  process.env.CLOUDINARY_API_KEY && 
                                  process.env.CLOUDINARY_API_SECRET;
    
    if (imageFile && imageFile instanceof File) {
      if (!cloudinaryConfigured) {
        logger.warn('Cloudinary not configured, skipping image upload', {
          hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
          hasApiKey: !!process.env.CLOUDINARY_API_KEY,
          hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
        });
        // Continue without uploading to Cloudinary
      } else {
        try {
          logger.info('Uploading product image to Cloudinary', { 
            fileName: imageFile.name, 
            size: imageFile.size 
          });

          // Upload to Cloudinary in the 'products' folder
          const uploadResult = await uploadImageFile(imageFile, 'products');
          imagePath = uploadResult.secure_url;
          uploadedImagePublicId = uploadResult.public_id; // Guardar el publicId para poder eliminarlo si falla
          
          logger.info('Product image uploaded successfully', { 
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id 
          });
        } catch (uploadError) {
          logger.error('Error uploading image to Cloudinary:', {
            error: uploadError.message,
            stack: uploadError.stack
          });
          // Continue with default image if upload fails
          imagePath = '/assets/images/products/default-product.svg';
        }
      }
    }

    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      cost: costNum,
      category: finalCategory, // Usar la categoría normalizada y validada
      unit: unit.trim(),
      stock: stockNum,
      minStock: minStockNum,
      barcode: barcode ? barcode.trim() : undefined,
      image: imagePath,
      tags: Array.isArray(tags) ? tags : [],
      isActive: true,
      createdBy: user._id
    });

    await product.save();

    logger.info('Product created successfully', { productId: product._id, name: product.name });

    // Return product without sensitive fields
    const productData = product.toObject();
    delete productData.createdBy;
    delete productData.__v;

    return NextResponse.json({
      success: true,
      data: productData,
      message: 'Producto creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    logger.error('Error al crear producto:', error);
    
    // Si se subió una imagen a Cloudinary pero falló la creación del producto, eliminarla
    if (uploadedImagePublicId) {
      try {
        logger.info('Eliminando imagen de Cloudinary debido a error en la creación del producto', {
          publicId: uploadedImagePublicId
        });
        await deleteImageFromCloudinary(uploadedImagePublicId);
        logger.info('Imagen eliminada exitosamente de Cloudinary', {
          publicId: uploadedImagePublicId
        });
      } catch (deleteError) {
        logger.error('Error al eliminar imagen de Cloudinary después de fallo en creación:', {
          publicId: uploadedImagePublicId,
          error: deleteError.message,
          stack: deleteError.stack
        });
        // No lanzar el error, solo loguearlo, ya que el error principal es la creación del producto
      }
    }
    
    const errorResponse = handleError(error, req);
    
    return NextResponse.json(
      {
        success: errorResponse.success,
        message: errorResponse.message,
        ...(errorResponse.errors && { errors: errorResponse.errors }),
      },
      { status: errorResponse.statusCode }
    );
  }
}