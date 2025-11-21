import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validate } from '@/lib/validators';
import { userRegisterSchema } from '@/lib/validators';
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
  await dbConnect();

  try {
    const body = await req.json();
    
    // Validate input
    const { data: validatedData } = validate(userRegisterSchema, body);
    const { username, email, password } = validatedData;

    logger.info('Registration attempt', { username, email });

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      logger.warn('Registration failed: user already exists', { username, email });
      return NextResponse.json({ 
        success: false, 
        message: 'El usuario o email ya existe' 
      }, { status: 400 });
    }

    const user = new User({
      username,
      email,
      password
    });

    await user.save();

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

    logger.info('Registration successful', { userId: user._id, username: user.username });

    return NextResponse.json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: user.getPublicProfile(),
        // También retornar token para compatibilidad (se puede eliminar después)
        token
      }
    }, { status: 201 });

  } catch (error) {
    logger.error('Error en registro:', error);
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
