import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Supplier from '@/lib/models/Supplier';
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
        { error: 'ID de proveedor inválido' },
        { status: 400 }
      );
    }

    const supplier = await Supplier.findOne({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: userId
    }).lean();

    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json(
      { error: 'Error al obtener proveedor' },
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
        { error: 'ID de proveedor inválido' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, phone, email, address, notes, isActive } = body;

    const supplier = await Supplier.findOne({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: userId
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json(
          { error: 'El nombre del proveedor es requerido' },
          { status: 400 }
        );
      }
      supplier.name = name.trim();
    }

    if (phone !== undefined) supplier.phone = phone?.trim() || '';
    if (email !== undefined) supplier.email = email?.trim().toLowerCase() || '';
    if (address !== undefined) supplier.address = address?.trim() || '';
    if (notes !== undefined) supplier.notes = notes?.trim() || '';
    if (isActive !== undefined) supplier.isActive = isActive;

    await supplier.save();

    return NextResponse.json({ supplier: supplier.toObject() });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Error al actualizar proveedor' },
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
        { error: 'ID de proveedor inválido' },
        { status: 400 }
      );
    }

    const supplier = await Supplier.findOne({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: userId
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete: marcar como inactivo en lugar de eliminar
    supplier.isActive = false;
    await supplier.save();

    return NextResponse.json({ message: 'Proveedor eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Error al eliminar proveedor' },
      { status: 500 }
    );
  }
}

