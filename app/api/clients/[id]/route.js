import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Client from '@/lib/models/Client';
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

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Error al obtener cliente' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
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

    const body = await req.json();
    const { name, phone, email, address, notes, isActive } = body;

    const client = await Client.findOne({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: userId
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json(
          { error: 'El nombre del cliente es requerido' },
          { status: 400 }
        );
      }
      client.name = name.trim();
    }

    if (phone !== undefined) client.phone = phone?.trim() || '';
    if (email !== undefined) client.email = email?.trim().toLowerCase() || '';
    if (address !== undefined) client.address = address?.trim() || '';
    if (notes !== undefined) client.notes = notes?.trim() || '';
    if (isActive !== undefined) client.isActive = isActive;

    await client.save();

    return NextResponse.json({ client: client.toObject() });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
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

    const client = await Client.findOne({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: userId
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete: marcar como inactivo en lugar de eliminar
    client.isActive = false;
    await client.save();

    return NextResponse.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    );
  }
}

