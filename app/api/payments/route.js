import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/lib/models/Payment';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// @desc    Crear un nuevo pago (abono)
export async function POST(req) {
  await dbConnect();

  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { referenceType, referenceId, amount, paymentMethod, notes } = body;

    // Validaciones
    if (!referenceType || !['sale', 'expense'].includes(referenceType)) {
      return NextResponse.json({ success: false, message: 'Tipo de referencia inválido' }, { status: 400 });
    }

    if (!referenceId) {
      return NextResponse.json({ success: false, message: 'ID de referencia requerido' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'El monto debe ser mayor a 0' }, { status: 400 });
    }

    const validPaymentMethods = ['cash', 'card', 'transfer', 'check', 'other'];
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json({ success: false, message: 'Método de pago inválido' }, { status: 400 });
    }

    // Crear el registro de pago
    const payment = new Payment({
      referenceType,
      referenceId,
      amount,
      paymentMethod,
      notes: notes || '',
      createdBy: userId,
      paymentDate: new Date()
    });

    await payment.save();

    return NextResponse.json({
      success: true,
      message: 'Pago registrado exitosamente',
      data: payment
    });

  } catch (error) {
    console.error('Error creando pago:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

// @desc    Obtener pagos recientes
export async function GET(req) {
  await dbConnect();

  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const referenceType = searchParams.get('referenceType');
    const referenceId = searchParams.get('referenceId');

    // Asegurar que userId sea ObjectId
    const userIdObj = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    
    const query = { createdBy: userIdObj };
    
    if (referenceType) {
      query.referenceType = referenceType;
    }
    
    if (referenceId) {
      query.referenceId = typeof referenceId === 'string' ? new mongoose.Types.ObjectId(referenceId) : referenceId;
    }

    console.log('GET /api/payments: Query:', JSON.stringify(query));
    console.log('GET /api/payments: userId:', userId.toString());
    console.log('GET /api/payments: userIdObj:', userIdObj.toString());
    
    // Verificar si hay pagos sin filtro primero
    const allPayments = await Payment.find({}).limit(5).lean();
    console.log('GET /api/payments: Total de pagos en BD (sin filtro):', allPayments.length);
    if (allPayments.length > 0) {
      console.log('GET /api/payments: Ejemplo de pago:', {
        _id: allPayments[0]._id,
        createdBy: allPayments[0].createdBy,
        createdByType: typeof allPayments[0].createdBy,
        referenceType: allPayments[0].referenceType,
        amount: allPayments[0].amount
      });
    }
    
    const payments = await Payment.find(query)
      .sort({ paymentDate: -1, createdAt: -1 })
      .limit(limit)
      .populate('createdBy', 'username')
      .lean();

    console.log('GET /api/payments: Encontrados', payments.length, 'pagos con el query');

    // Obtener información de las referencias (ventas/gastos)
    const saleIds = payments.filter(p => p.referenceType === 'sale').map(p => p.referenceId);
    const expenseIds = payments.filter(p => p.referenceType === 'expense').map(p => p.referenceId);

    let salesInfo = [];
    let expensesInfo = [];

    if (saleIds.length > 0) {
      const Sale = (await import('@/lib/models/Sale')).default;
      salesInfo = await Sale.find({ _id: { $in: saleIds } })
        .select('_id saleNumber concept client type')
        .lean();
    }

    if (expenseIds.length > 0) {
      const Expense = (await import('@/lib/models/Expense')).default;
      expensesInfo = await Expense.find({ _id: { $in: expenseIds } })
        .select('_id expenseNumber description vendor category')
        .lean();
    }

    // Agregar información de referencia a cada pago
    const salesMap = new Map(salesInfo.map(s => [s._id.toString(), s]));
    const expensesMap = new Map(expensesInfo.map(e => [e._id.toString(), e]));

    const paymentsWithRefs = payments.map(payment => {
      const paymentObj = { ...payment };
      const refIdStr = payment.referenceId?.toString ? payment.referenceId.toString() : String(payment.referenceId);
      if (payment.referenceType === 'sale') {
        paymentObj.referenceInfo = salesMap.get(refIdStr);
      } else if (payment.referenceType === 'expense') {
        paymentObj.referenceInfo = expensesMap.get(refIdStr);
      }
      return paymentObj;
    });

    return NextResponse.json({
      success: true,
      data: paymentsWithRefs
    });

  } catch (error) {
    console.error('Error obteniendo pagos:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

