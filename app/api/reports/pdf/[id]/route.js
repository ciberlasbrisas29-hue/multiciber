import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getAdvancedReportData } from '@/lib/reports';
import { generateReportPDF } from '@/lib/pdf-generator';

/**
 * Endpoint para generar y servir el PDF del reporte
 * GET /api/reports/pdf/[id]?period=today&userId=xxx
 * 
 * NOTA: Este endpoint requiere autenticación o userId en query params
 * para generar el reporte correcto del usuario
 */
export async function GET(req, { params }) {
  try {
    // En Next.js 16+, params puede ser una Promise
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'today';
    const userIdFromQuery = searchParams.get('userId');

    // Validar que el ID tenga un formato razonable
    if (!id || id.length < 5) {
      return NextResponse.json(
        { success: false, message: 'ID de reporte inválido' },
        { status: 400 }
      );
    }

    // Obtener userId: primero intentar autenticación, luego query param
    let userId = null;
    
    try {
      userId = await verifyAuth();
    } catch (authError) {
      // Si la autenticación falla, intentar usar userId del query param
      if (userIdFromQuery) {
        userId = userIdFromQuery;
      } else {
        return NextResponse.json(
          { success: false, message: 'No autorizado' },
          { status: 401 }
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Usuario no identificado' },
        { status: 401 }
      );
    }

    // Obtener datos del reporte
    const reportData = await getAdvancedReportData(userId, period);

    // Generar PDF
    const pdfBuffer = await generateReportPDF(reportData, period);

    // Validar que el PDF se generó correctamente
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('PDF generado está vacío');
      return NextResponse.json(
        { success: false, message: 'Error al generar PDF: archivo vacío' },
        { status: 500 }
      );
    }

    // Retornar PDF como respuesta con headers para que sea accesible públicamente
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="reporte-avanzado-${period}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        // Headers para permitir acceso desde cualquier origen (necesario para Twilio)
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        // Cache por un tiempo corto para mejorar rendimiento
        'Cache-Control': 'public, max-age=300', // 5 minutos
      }
    });
  } catch (error) {
    console.error('Error generando PDF del reporte:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error al generar PDF',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Manejar OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

