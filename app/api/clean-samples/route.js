import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Sale from '@/lib/models/Sale';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

// Helper function to get user from token
async function getUserFromToken(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const user = await User.findById(decoded.id);
    
    return user;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export async function DELETE(req) {
  await dbConnect();
  
  try {
    const user = await getUserFromToken(req);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' }, 
        { status: 401 }
      );
    }

    // Only admin can clean sample data
    if (user.username !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Solo el administrador puede limpiar datos de prueba' }, 
        { status: 403 }
      );
    }

    console.log('🧹 Cleaning sample sales data...');

    // Count sales before deletion
    const totalSales = await Sale.countDocuments({ createdBy: user._id });
    
    if (totalSales === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay ventas para eliminar',
        data: {
          deletedCount: 0,
          totalSales: 0
        }
      });
    }

    // Delete all sales for this user
    const result = await Sale.deleteMany({ createdBy: user._id });

    console.log(`✅ Deleted ${result.deletedCount} sample sales`);

    return NextResponse.json({
      success: true,
      message: `Eliminadas ${result.deletedCount} ventas de ejemplo exitosamente`,
      data: {
        deletedCount: result.deletedCount,
        totalSales: 0,
        status: 'Base de datos limpia'
      }
    });

  } catch (error) {
    console.error('Error cleaning sample data:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}

export async function GET(req) {
  await dbConnect();
  
  try {
    const user = await getUserFromToken(req);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' }, 
        { status: 401 }
      );
    }

    // Get count of current sales
    const totalSales = await Sale.countDocuments({ createdBy: user._id });
    
    return NextResponse.json({
      success: true,
      data: {
        totalSales: totalSales,
        canClean: totalSales > 0,
        message: totalSales > 0 ? `${totalSales} ventas encontradas` : 'No hay ventas para limpiar'
      }
    });

  } catch (error) {
    console.error('Error getting sample data info:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}