import { NextResponse } from 'next/server';

/**
 * Endpoint de prueba para verificar que el PDF sea accesible
 * GET /api/debug/test-pdf-access?userId=xxx
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId requerido en query params' },
        { status: 400 }
      );
    }

    // Construir URL del PDF
    const reportId = 'test-' + Date.now().toString(36);
    const period = 'today';
    
    // Intentar determinar la URL base
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL;
    
    if (baseUrl && !baseUrl.startsWith('http')) {
      // Si es una ruta relativa, construir URL completa
      if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else {
        baseUrl = 'https://multiciber-fzio.vercel.app';
      }
    }
    
    if (!baseUrl || (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://'))) {
      baseUrl = 'https://multiciber-fzio.vercel.app';
    }
    
    baseUrl = baseUrl.replace(/\/$/, '');
    
    const pdfUrl = `${baseUrl}/api/reports/pdf/${reportId}?period=${period}&userId=${userId}`;
    
    // Intentar hacer una petición HEAD al endpoint del PDF para verificar que sea accesible
    try {
      const response = await fetch(pdfUrl, { method: 'HEAD' });
      
      return NextResponse.json({
        success: true,
        data: {
          pdfUrl,
          status: response.status,
          statusText: response.statusText,
          accessible: response.ok,
          headers: {
            'content-type': response.headers.get('content-type'),
            'content-length': response.headers.get('content-length'),
            'access-control-allow-origin': response.headers.get('access-control-allow-origin')
          }
        }
      });
    } catch (fetchError) {
      return NextResponse.json({
        success: false,
        message: 'Error al verificar acceso al PDF',
        error: fetchError.message,
        pdfUrl
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error en test-pdf-access:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error interno',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

