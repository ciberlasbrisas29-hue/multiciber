/**
 * Ejemplo de uso del middleware de autenticación y autorización
 * 
 * Este archivo muestra cómo usar el middleware en tus rutas API
 */

import { withAuth } from './middleware';
import { NextResponse } from 'next/server';

// Ejemplo 1: Ruta que solo requiere autenticación
export async function GET(req, context) {
  return withAuth(async (req, context, userId) => {
    // userId está disponible aquí
    // Tu lógica aquí
    return NextResponse.json({ success: true, userId });
  })(req, context);
}

// Ejemplo 2: Ruta que requiere rol de admin
export async function POST(req, context) {
  return withAuth(async (req, context, userId, user) => {
    // userId y user están disponibles aquí
    // user.role será 'admin' o 'employee'
    // Tu lógica aquí
    return NextResponse.json({ success: true, userId, role: user.role });
  }, { roles: ['admin'] })(req, context);
}

// Ejemplo 3: Ruta que permite admin o employee
export async function PUT(req, context) {
  return withAuth(async (req, context, userId, user) => {
    // Tu lógica aquí
    return NextResponse.json({ success: true });
  }, { roles: ['admin', 'employee'] })(req, context);
}

