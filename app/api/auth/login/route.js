import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validate } from '@/lib/validators';
import { userLoginSchema } from '@/lib/validators';
import { handleError } from '@/lib/errors';
import logger from '@/lib/logger';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido en las variables de entorno');
}

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

export async function POST(req) {
  try {
    // Connect to database
    await dbConnect();
    logger.debug('Database connected successfully');

    // Parse and validate request body
    const body = await req.json();
    const { data: validatedData } = validate(userLoginSchema, body);
    const { username, password } = validatedData;

    logger.info('Login attempt', { username });

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    }).select('+password');

    if (!user) {
      logger.warn('Login failed: user not found', { username });
      return NextResponse.json(
        { success: false, message: 'Credenciales inválidas' }, 
        { status: 401 }
      );
    }

    if (!user.isActive) {
      logger.warn('Login failed: user inactive', { userId: user._id });
      return NextResponse.json(
        { success: false, message: 'Usuario inactivo' }, 
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      logger.warn('Login failed: invalid password', { userId: user._id });
      return NextResponse.json(
        { success: false, message: 'Credenciales inválidas' }, 
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Set cookie (httpOnly para seguridad)
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    logger.info('Login successful', { userId: user._id, username: user.username });

    return NextResponse.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: user.getPublicProfile(),
        // También retornar token para compatibilidad con localStorage (se puede eliminar después)
        token
      }
    });

  } catch (error) {
    logger.error('Error en login:', error);
    const errorResponse = handleError(error, req);
    
    return NextResponse.json(
      {
        success: errorResponse.success,
        message: errorResponse.message,
        ...(errorResponse.errors && { errors: errorResponse.errors }),
      },
      { status: errorResponse.statusCode }
    );
  }
}