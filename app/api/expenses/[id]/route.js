import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/lib/models/Expense';
import Payment from '@/lib/models/Payment';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// @desc    Obtener un gasto específico
export async function GET(req, { params }) {
  await dbConnect();

  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'ID de gasto inválido' }, { status: 400 });
    }

    const expense = await Expense.findOne({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: userId
    }).populate('createdBy', 'username').lean();

    if (!expense) {
      return NextResponse.json({ success: false, message: 'Gasto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: expense
    });

  } catch (error) {
    console.error('Error obteniendo gasto:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

// @desc    Actualizar un gasto
export async function PUT(req, { params }) {
  await dbConnect();
  
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'ID de gasto inválido' }, { status: 400 });
    }

    const body = await req.json();

    const expense = await Expense.findOne({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: userId
    });

    if (!expense) {
      return NextResponse.json({ success: false, message: 'Gasto no encontrado' }, { status: 404 });
    }

    // Si se está cambiando el status a 'paid' y antes era 'pending', crear registro de Payment
    if (body.status === 'paid' && expense.status === 'pending') {
      const payment = new Payment({
        referenceType: 'expense',
        referenceId: expense._id,
        amount: expense.amount,
        paymentMethod: body.paymentMethod || expense.paymentMethod || 'cash',
        notes: body.paymentNotes || '',
        createdBy: userId,
        paymentDate: new Date()
      });
      await payment.save();
    }

    // Actualizar campos permitidos
    const allowedUpdates = [
      'category', 'description', 'amount', 'vendor', 
      'paymentMethod', 'receipt', 'status', 'notes',
      'isRecurring', 'recurringPeriod', 'nextDueDate'
    ];
    
    allowedUpdates.forEach(field => {
      if (body[field] !== undefined) {
        expense[field] = body[field];
      }
    });

    await expense.save();

    return NextResponse.json({
      success: true,
      message: 'Gasto actualizado exitosamente',
      data: expense
    });

  } catch (error) {
    console.error('Error actualizando gasto:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

// @desc    Eliminar un gasto
export async function DELETE(req, { params }) {
  await dbConnect();

  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'ID de gasto inválido' }, { status: 400 });
    }

    const expense = await Expense.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: userId
    });

    if (!expense) {
      return NextResponse.json({ success: false, message: 'Gasto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Gasto eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error eliminando gasto:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
