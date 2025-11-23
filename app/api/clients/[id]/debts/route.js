import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Sale from '@/lib/models/Sale';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID de cliente inválido' },
        { status: 400 }
      );
    }

    // Buscar todas las ventas con deuda para este cliente
    const clientDebts = await Sale.find({
      createdBy: userId,
      status: 'debt',
      'client.name': { $exists: true }
    })
    .lean();

    // Filtrar por el nombre del cliente (ya que solo almacenamos el nombre en el objeto client)
    // Primero necesitamos obtener el nombre del cliente desde la colección de clientes
    const Client = require('@/lib/models/Client').default || require('@/lib/models/Client');
    const client = await Client.findOne({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: userId
    }).lean();

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Filtrar las ventas que pertenecen a este cliente por nombre (comparación case-insensitive)
    const clientNameLower = client.name.toLowerCase().trim();
    const clientSales = clientDebts.filter((sale) => {
      const saleClientName = sale.client?.name?.toLowerCase().trim();
      return saleClientName === clientNameLower;
    });

    // Calcular el total de deudas
    const totalDebt = clientSales.reduce((sum, sale) => {
      const debtAmount = sale.debtAmount || (sale.total - (sale.paidAmount || 0));
      return sum + (debtAmount > 0 ? debtAmount : 0);
    }, 0);

    return NextResponse.json({
      totalDebt,
      debts: clientSales.map((sale) => ({
        id: sale._id,
        saleNumber: sale.saleNumber,
        concept: sale.concept,
        total: sale.total,
        paidAmount: sale.paidAmount || 0,
        debtAmount: sale.debtAmount || (sale.total - (sale.paidAmount || 0)),
        createdAt: sale.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching client debts:', error);
    return NextResponse.json(
      { error: 'Error al obtener deudas del cliente' },
      { status: 500 }
    );
  }
}

