import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(req) {
  await dbConnect();

  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');

    if (!userId) {
        return NextResponse.json({ success: false, message: 'No se pudo verificar la identidad del usuario.' }, { status: 401 });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return NextResponse.json({ success: false, message: 'Usuario no encontrado' }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ success: false, message: 'Usuario inactivo' }, { status: 401 });
    }

    return NextResponse.json({
        success: true,
        data: {
          user: user.getPublicProfile()
        }
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
