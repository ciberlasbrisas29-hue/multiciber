import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { uploadImageFile } from '@/lib/cloudinary';
import logger from '@/lib/logger';

/**
 * Endpoint para subir imágenes a Cloudinary
 * POST /api/upload/image
 * Body: FormData con campo 'image' (File)
 */
export async function POST(req) {
  try {
    // Verificar autenticación
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener el archivo del FormData
    const formData = await req.formData();
    const imageFile = formData.get('image');

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        { success: false, message: 'No se proporcionó ninguna imagen' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { success: false, message: 'Tipo de archivo no permitido. Use JPG, PNG, WEBP o GIF' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'La imagen es demasiado grande. Tamaño máximo: 10MB' },
        { status: 400 }
      );
    }

    // Obtener carpeta opcional del formData
    const folder = formData.get('folder') || 'products';

    // Subir imagen a Cloudinary
    logger.info('Uploading image to Cloudinary', { 
      fileName: imageFile.name, 
      size: imageFile.size, 
      type: imageFile.type,
      folder 
    });

    const uploadResult = await uploadImageFile(imageFile, folder);

    logger.info('Image uploaded successfully', { 
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url 
    });

    return NextResponse.json({
      success: true,
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      },
      message: 'Imagen subida exitosamente'
    });

  } catch (error) {
    logger.error('Error uploading image:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Error al subir la imagen' 
      },
      { status: 500 }
    );
  }
}

