import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req) {
  // Limpiar la cookie del token en el lado del servidor
  cookies().set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    expires: new Date(0), // Expira inmediatamente
    path: '/',
  });
  
  return NextResponse.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
}
