import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';

export async function POST(req) {
  try {
    // Limpiar la cookie del token en el lado del servidor
    const cookieStore = await cookies();
    cookieStore.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0), // Expira inmediatamente
      path: '/',
    });
    
    logger.info('User logged out successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    logger.error('Error en logout:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al cerrar sesión'
    }, { status: 500 });
  }
}
