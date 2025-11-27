import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Sale from '@/lib/models/Sale';
import Payment from '@/lib/models/Payment';
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

    // IMPORTANTE: Guardar el paidAmount anterior ANTES de actualizar el objeto
    const previousPaidAmount = parseFloat(sale.paidAmount || 0);

    // Actualizar campos permitidos
    const allowedUpdates = ['status', 'notes', 'paymentMethod', 'client', 'paidAmount', 'debtAmount'];
    allowedUpdates.forEach(field => {
      if (body[field] !== undefined) {
        sale[field] = body[field];
      }
    });

    // Recalcular debtAmount y status si se actualiza paidAmount
    if (body.paidAmount !== undefined) {
      const newPaidAmount = parseFloat(body.paidAmount);
      const paymentAmount = newPaidAmount - previousPaidAmount;
      const newDebtAmount = Math.max(0, sale.total - newPaidAmount);
      
      console.log('PUT /api/sales/[id]: Actualizando paidAmount', {
        saleId: sale._id.toString(),
        previousPaidAmount,
        newPaidAmount,
        paymentAmount,
        saleTotal: sale.total,
        userId: userId.toString()
      });
      
      // Solo crear registro de Payment si hay un incremento en el pago (abono)
      if (paymentAmount > 0) {
        try {
          console.log('✅ Creando Payment - referenceId:', sale._id.toString(), 'amount:', paymentAmount, 'userId:', userId.toString());
          const payment = new Payment({
            referenceType: 'sale',
            referenceId: sale._id,
            amount: paymentAmount,
            paymentMethod: body.paymentMethod || sale.paymentMethod || 'cash',
            notes: body.paymentNotes || '',
            createdBy: userId,
            paymentDate: new Date()
          });
          const savedPayment = await payment.save();
          console.log('✅ Payment creado exitosamente:', {
            paymentId: savedPayment._id.toString(),
            amount: savedPayment.amount,
            createdBy: savedPayment.createdBy.toString(),
            referenceId: savedPayment.referenceId.toString(),
            referenceType: savedPayment.referenceType
          });
        } catch (paymentError) {
          console.error('❌ Error creando Payment:', paymentError);
          console.error('Error details:', paymentError.message);
          if (paymentError.errors) {
            console.error('Validation errors:', paymentError.errors);
          }
          // No fallar la actualización de la venta si falla el Payment
        }
      } else {
        console.log('⚠️ No se crea Payment - paymentAmount <= 0:', {
          paymentAmount,
          previousPaidAmount,
          newPaidAmount,
          reason: paymentAmount <= 0 ? 'No hay incremento' : 'Monto inválido'
        });
      }
      
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
