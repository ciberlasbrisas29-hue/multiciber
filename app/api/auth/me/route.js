import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import logger from '@/lib/logger';

export async function GET(req) {
  await dbConnect();

  try {
    const userId = await verifyAuth();

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'No se pudo verificar la identidad del usuario.' 
      }, { status: 401 });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      logger.warn('User not found in /auth/me', { userId });
      return NextResponse.json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      }, { status: 404 });
    }

    if (!user.isActive) {
      logger.warn('Inactive user tried to access /auth/me', { userId });
      return NextResponse.json({ 
        success: false, 
        message: 'Usuario inactivo' 
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    logger.error('Error obteniendo usuario:', error);
    const errorResponse = handleError(error, req);
    
    return NextResponse.json(
      {
        success: errorResponse.success,
        message: errorResponse.message,
      },
      { status: errorResponse.statusCode }
    );
  }
}
