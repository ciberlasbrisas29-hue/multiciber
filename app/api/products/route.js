import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
// Removed fs/promises imports - not available in serverless environments

import logger from '@/lib/logger';
import { handleError } from '@/lib/errors';
import { verifyAuth } from '@/lib/auth';

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
    
    if (category) filters.category = category;
    if (isActive !== null) filters.isActive = isActive === 'true';
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

    // Validation
    if (!name || !price || !cost || !category || !unit) {
      return NextResponse.json(
        { success: false, message: 'Faltan campos requeridos: name, price, cost, category, unit' }, 
        { status: 400 }
      );
    }

    if (price <= 0 || cost <= 0) {
      return NextResponse.json(
        { success: false, message: 'El precio y costo deben ser mayor a 0' }, 
        { status: 400 }
      );
    }

    if (stock < 0 || minStock < 0) {
      return NextResponse.json(
        { success: false, message: 'El stock y stock mínimo no pueden ser negativos' }, 
        { status: 400 }
      );
    }

    // Check if barcode is unique (if provided)
    if (barcode) {
      const existingProduct = await Product.findOne({ 
        barcode, 
        createdBy: user._id 
      });
      
      if (existingProduct) {
        return NextResponse.json(
          { success: false, message: 'El código de barras ya está en uso' }, 
          { status: 400 }
        );
      }
    }

    // Check if name is unique for this user
    const existingName = await Product.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }, 
      createdBy: user._id 
    });
    
    if (existingName) {
      return NextResponse.json(
        { success: false, message: 'Ya existe un producto con ese nombre' }, 
        { status: 400 }
      );
    }

    // Handle image upload if present
    // In serverless environments (Vercel), we can't write to filesystem
    // Solution: Convert image to base64 and store in MongoDB or use cloud storage
    let imagePath = '/assets/images/products/default-product.svg';
    
    if (imageFile && imageFile instanceof File) {
      try {
        // Convert file to base64 for storage in MongoDB
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');
        const mimeType = imageFile.type || 'image/jpeg';
        
        // Store as data URL (can be stored in MongoDB or used directly in img src)
        // Format: data:image/jpeg;base64,/9j/4AAQSkZJRg...
        imagePath = `data:${mimeType};base64,${base64Image}`;
        
        console.log('Image converted to base64 successfully');
      } catch (uploadError) {
        console.error('Error processing image:', uploadError);
        // Continue with default image if processing fails
        imagePath = '/assets/images/products/default-product.svg';
      }
    }

    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      cost: parseFloat(cost),
      category: category.trim(),
      unit: unit.trim(),
      stock: parseInt(stock),
      minStock: parseInt(minStock),
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