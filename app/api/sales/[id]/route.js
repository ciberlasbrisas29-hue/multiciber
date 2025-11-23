import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Sale from '@/lib/models/Sale';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// @desc    Obtener una venta específica
export async function GET(req, { params }) {
  await dbConnect();

  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'ID de venta inválido' }, { status: 400 });
    }

    const sale = await Sale.findOne({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: userId
    }).populate('createdBy', 'username').lean();

    if (!sale) {
      return NextResponse.json({ success: false, message: 'Venta no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: sale
    });

  } catch (error) {
    console.error('Error obteniendo venta:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

// @desc    Actualizar una venta
export async function PUT(req, { params }) {
  await dbConnect();
  
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'ID de venta inválido' }, { status: 400 });
    }
    const body = await req.json();

    const sale = await Sale.findOne({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: userId
    });

    if (!sale) {
      return NextResponse.json({ success: false, message: 'Venta no encontrada' }, { status: 404 });
    }

    // Actualizar campos permitidos
    const allowedUpdates = ['status', 'notes', 'paymentMethod', 'client', 'paidAmount', 'debtAmount'];
    allowedUpdates.forEach(field => {
      if (body[field] !== undefined) {
        sale[field] = body[field];
      }
    });

    // Recalcular debtAmount y status si se actualiza paidAmount
    if (body.paidAmount !== undefined) {
      const newPaidAmount = body.paidAmount;
      const newDebtAmount = Math.max(0, sale.total - newPaidAmount);
      
      sale.paidAmount = newPaidAmount;
      sale.debtAmount = newDebtAmount;
      
      // Actualizar updatedAt para que aparezca en los últimos movimientos
      sale.updatedAt = new Date();
      
      // Si se pagó completamente, cambiar status a 'paid'
      if (newDebtAmount <= 0) {
        sale.status = 'paid';
        sale.debtAmount = 0;
      } else {
        sale.status = 'debt';
      }
    }


    await sale.save();

    return NextResponse.json({
      success: true,
      message: 'Venta actualizada exitosamente',
      data: sale
    });

  } catch (error) {
    console.error('Error actualizando venta:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

// @desc    Eliminar una venta
export async function DELETE(req, { params }) {
  await dbConnect();

  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const { id } = params;

    const sale = await Sale.findOneAndDelete({
      _id: id,
      createdBy: userId
    });

    if (!sale) {
      return NextResponse.json({ success: false, message: 'Venta no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Venta eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('Error eliminando venta:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
