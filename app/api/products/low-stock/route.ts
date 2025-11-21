import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import jwt, { JwtPayload } from 'jsonwebtoken';

async function getUserFromToken() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return null;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as JwtPayload;
        
        if (!decoded || typeof decoded === 'string' || !decoded.id) {
            return null;
        }

        const user = await User.findById(decoded.id);

        return user;
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}

export async function GET() {
    await dbConnect();

    try {
        const user = await getUserFromToken();

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'No autorizado' },
                { status: 401 }
            );
        }

        // Find products where stock is less than or equal to minStock
        const lowStockProducts = await Product.find({
            createdBy: user._id,
            isActive: true,
            $expr: { $lte: ['$stock', '$minStock'] }
        })
            .select('name stock minStock category price')
            .sort({ stock: 1 }) // Sort by lowest stock first
            .limit(20);

        // Calculate severity for each product
        const productsWithSeverity = lowStockProducts.map(product => {
            const stockPercentage = product.minStock > 0
                ? (product.stock / product.minStock) * 100
                : 0;

            let severity: 'critical' | 'warning' | 'low';
            if (product.stock === 0) {
                severity = 'critical';
            } else if (stockPercentage <= 50) {
                severity = 'critical';
            } else if (stockPercentage <= 100) {
                severity = 'warning';
            } else {
                severity = 'low';
            }

            return {
                ...product.toObject(),
                severity,
                stockPercentage: Math.round(stockPercentage)
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                products: productsWithSeverity,
                count: productsWithSeverity.length,
                critical: productsWithSeverity.filter(p => p.severity === 'critical').length,
                warning: productsWithSeverity.filter(p => p.severity === 'warning').length
            }
        });

    } catch (error) {
        console.error('Error fetching low stock products:', error);
        return NextResponse.json(
            { success: false, message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
