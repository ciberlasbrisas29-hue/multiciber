import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';

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

    // Validación de barcode si se está cambiando
    if (barcode && barcode !== product.barcode) {
      const existingProduct = await Product.findOne({ 
        barcode: barcode,
        _id: { $ne: new mongoose.Types.ObjectId(id) },
        createdBy: userId
      });
      if (existingProduct) {
        return NextResponse.json({ success: false, message: 'El código de barras ya está en uso' }, { status: 400 });
      }
    }

    // Handle image upload if present
    // In serverless environments (Vercel), we can't write to filesystem
    // Solution: Convert image to base64 and store in MongoDB
    let imagePath = product.image; // Mantener la imagen actual por defecto
    
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
        // Continue with current image if processing fails
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
