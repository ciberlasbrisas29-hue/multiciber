import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Supplier from '@/lib/models/Supplier';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    await dbConnect();
    
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    // Construir query
    const query = { createdBy: userId };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const suppliers = await Supplier.find(query)
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Error al obtener proveedores' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, phone, email, address, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre del proveedor es requerido' },
        { status: 400 }
      );
    }

    const supplier = new Supplier({
      name: name.trim(),
      phone: phone?.trim() || '',
      email: email?.trim().toLowerCase() || '',
      address: address?.trim() || '',
      notes: notes?.trim() || '',
      createdBy: userId,
      isActive: true
    });

    await supplier.save();

    return NextResponse.json(
      { supplier: supplier.toObject() },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating supplier:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Ya existe un proveedor con ese nombre' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear proveedor' },
      { status: 500 }
    );
  }
}

