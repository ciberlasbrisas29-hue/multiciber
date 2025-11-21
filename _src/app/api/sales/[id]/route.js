import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db';
import Sale from '@/lib/models/Sale';

// @desc    Obtener una venta específica
export async function GET(req, { params }) {
  await dbConnect();

  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const { id } = params;

    const sale = await Sale.findOne({
      _id: id,
      createdBy: userId
    }).populate('createdBy', 'username');

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
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const { id } = params;
    const body = await req.json();

    const sale = await Sale.findOne({
      _id: id,
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

    // Recalcular si es necesario
    if (body.paidAmount !== undefined && sale.status === 'debt') {
        if (sale.paidAmount >= sale.total) {
            sale.status = 'paid';
            sale.debtAmount = 0;
        } else {
            sale.debtAmount = sale.total - sale.paidAmount;
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
