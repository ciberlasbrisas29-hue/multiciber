import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Sale from '@/lib/models/Sale';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

// Helper function to get user from token
async function getUserFromToken(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.log('No se encontró token de autenticación.');
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log('Usuario no encontrado para el token dado.');
    }
    return user;
  } catch (error) {
    console.error('Error verificando token en getUserFromToken:', error);
    return null;
  }
}

// @desc    Obtener todas las ventas
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters = { createdBy: user._id };
    
    if (status) filters.status = status;
    if (startDate && endDate) {
      filters.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sales = await Sale.find(filters)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'username');

    const total = await Sale.countDocuments(filters);

    return NextResponse.json({
      success: true,
      data: sales,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

// @desc    Crear nueva venta (POS)
export async function POST(req) {
  await dbConnect();

  const productsToRevert = []; // Para almacenar productos y cantidades para revertir stock si falla
  try {
    const user = await getUserFromToken(req);
    
    if (!user) {
      console.log('POST /api/sales: Intento no autorizado.');
      return NextResponse.json(
        { success: false, message: 'No autorizado' }, 
        { status: 401 }
      );
    }
    console.log(`POST /api/sales: Usuario autenticado: ${user.username} (${user._id})`);

    const body = await req.json();
    const { items, paymentMethod, totalAmount } = body;
    console.log('POST /api/sales: Datos de entrada recibidos:', { items, paymentMethod, totalAmount });

    // Validaciones
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('POST /api/sales: Error de validación - No hay ítems en la venta.');
      return NextResponse.json({ 
        success: false, 
        message: 'Debe incluir al menos un producto en la venta' 
      }, { status: 400 });
    }

    if (!paymentMethod || !['cash', 'card', 'transfer'].includes(paymentMethod)) {
      console.log(`POST /api/sales: Error de validación - Método de pago inválido: ${paymentMethod}`);
      return NextResponse.json({ 
        success: false, 
        message: 'Método de pago inválido' 
      }, { status: 400 });
    }

    if (isNaN(totalAmount) || totalAmount <= 0) {
      console.log(`POST /api/sales: Error de validación - Total de venta inválido: ${totalAmount}`);
      return NextResponse.json({ 
        success: false, 
        message: 'El total de la venta debe ser un número positivo' 
      }, { status: 400 });
    }

    let actualCalculatedTotal = 0;
    const itemsForSale = [];

    // Verificar stock y calcular el total real en el backend
    for (const item of items) {
      console.log(`POST /api/sales: Procesando ítem - productId: ${item.productId}, quantity: ${item.quantity}`);
      const product = await Product.findById(item.productId);
      if (!product) {
        console.log(`POST /api/sales: Producto no encontrado con ID: ${item.productId}`);
        // Revertir stock de los productos que ya se habían descontado
        for (const p of productsToRevert) {
            await Product.findByIdAndUpdate(p.id, { $inc: { stock: p.quantity } });
            console.log(`POST /api/sales: Stock revertido para ${p.id}, cantidad: ${p.quantity}`);
        }
        return NextResponse.json({ 
          success: false, 
          message: `Producto no encontrado con ID: ${item.productId}` 
        }, { status: 404 });
      }

      if (product.stock < item.quantity) {
        console.log(`POST /api/sales: Stock insuficiente para ${product.name}. Disponible: ${product.stock}, solicitado: ${item.quantity}`);
        // Revertir stock de los productos que ya se habían descontado
        for (const p of productsToRevert) {
            await Product.findByIdAndUpdate(p.id, { $inc: { stock: p.quantity } });
            console.log(`POST /api/sales: Stock revertido para ${p.id}, cantidad: ${p.quantity}`);
        }
        return NextResponse.json({ 
          success: false, 
          message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, solicitado: ${item.quantity}` 
        }, { status: 400 });
      }
      
      const priceToUse = item.priceAtSale || product.price;
      actualCalculatedTotal += priceToUse * item.quantity;

      itemsForSale.push({
        product: product._id,
        productName: product.name, // Corrección: Coincidir con el modelo Sale.js
        quantity: item.quantity,
        unitPrice: priceToUse,      // Corrección: Coincidir con el modelo Sale.js
        totalPrice: priceToUse * item.quantity,
      });

      // Reducir stock del producto
      product.stock -= item.quantity;
      await product.save();
      productsToRevert.push({ id: product._id, quantity: item.quantity }); // Almacenar para un posible rollback
      console.log(`POST /api/sales: Stock de ${product.name} actualizado a ${product.stock}`);
    }
    console.log(`POST /api/sales: Total calculado en backend: ${actualCalculatedTotal.toFixed(2)}`);
    console.log(`POST /api/sales: Total recibido del frontend: ${totalAmount.toFixed(2)}`);

    // Verificar que el totalAmount enviado por el frontend coincida con el calculado en el backend
    if (Math.abs(actualCalculatedTotal - totalAmount) > 0.01) { // Tolerancia para errores de punto flotante
      console.log('POST /api/sales: Discrepancia en el total de la venta.');
      // Revertir stock si hay una discrepancia en el total
      for (const p of productsToRevert) {
          await Product.findByIdAndUpdate(p.id, { $inc: { stock: p.quantity } });
          console.log(`POST /api/sales: Stock revertido por discrepancia en total para ${p.id}, cantidad: ${p.quantity}`);
      }
      return NextResponse.json({ 
        success: false, 
        message: 'Discrepancia en el total de la venta. Por favor, reintente.' 
      }, { status: 400 });
    }

    // Crear la venta
    const sale = new Sale({
      items: itemsForSale,
      paymentMethod,
      subtotal: actualCalculatedTotal,
      total: actualCalculatedTotal,
      paidAmount: actualCalculatedTotal, // Asumiendo pago exacto por ahora
      change: 0,
      status: 'paid', // Asumiendo que las ventas registradas son pagadas
      type: 'product', // Corrección: Coincidir con el enum ['product', 'free'] del modelo Sale.js
      createdBy: user._id,
      createdAt: new Date()
    });

    await sale.save();
    console.log('POST /api/sales: Venta guardada exitosamente:', sale._id);

    // Poblar datos del usuario para la respuesta
    await sale.populate('createdBy', 'username');
    console.log('POST /api/sales: Venta poblada con datos del usuario.');

    return NextResponse.json({
      success: true,
      message: 'Venta procesada exitosamente',
      sale: sale
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/sales: Error inesperado procesando venta:', error);
    
    // Si ocurre un error inesperado (no capturado por validaciones o stock),
    // intentar revertir el stock de los productos que ya se descontaron.
    // Esto es un esfuerzo de "mejor intento" para un rollback simple.
    for (const p of productsToRevert) {
        try {
            await Product.findByIdAndUpdate(p.id, { $inc: { stock: p.quantity } });
            console.log(`POST /api/sales: (Rollback) Stock revertido para ${p.id}, cantidad: ${p.quantity} debido a error inesperado.`);
        } catch (rollbackError) {
            console.error(`POST /api/sales: Error al intentar revertir stock para ${p.id}:`, rollbackError);
        }
    }

    // Manejar errores de validación de Mongoose específicamente
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      console.error('POST /api/sales: Mongoose ValidationError:', messages);
      return NextResponse.json(
        { success: false, message: `Error de validación: ${messages.join(', ')}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Error interno del servidor al procesar la venta. Verifique los logs del servidor.' 
    }, { status: 500 });
  }
}