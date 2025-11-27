import { v2 as cloudinary } from 'cloudinary';
import logger from '@/lib/logger';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Subir una imagen a Cloudinary desde un buffer
 * @param {Buffer} imageBuffer - Buffer de la imagen
 * @param {string} folder - Carpeta donde guardar (ej: 'products')
 * @param {string} publicId - ID público opcional (si no se proporciona, se genera automáticamente)
 * @returns {Promise<{url: string, public_id: string, secure_url: string}>}
 */
export async function uploadImageToCloudinary(imageBuffer, folder = 'products', publicId = null) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto', // Detecta automáticamente el tipo (image, video, etc.)
      transformation: [
        {
          quality: 'auto', // Optimización automática de calidad
          fetch_format: 'auto', // Convierte a WebP automáticamente si el navegador lo soporta
        }
      ],
    };

    // Si se proporciona un publicId, usarlo para sobrescribir o actualizar
    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.url,
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        }
      }
    );

    // Enviar el buffer al stream
    uploadStream.end(imageBuffer);
  });
}

/**
 * Subir un PDF a Cloudinary desde un buffer
 * @param {Buffer} pdfBuffer - Buffer del PDF
 * @param {string} folder - Carpeta donde guardar (ej: 'reports')
 * @param {string} publicId - ID público opcional
 * @returns {Promise<{url: string, public_id: string, secure_url: string}>}
 */
export async function uploadPDFToCloudinary(pdfBuffer, folder = 'reports', publicId = null) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      resource_type: 'raw', // Para PDFs y otros archivos
      format: 'pdf',
      // Asegurar que el archivo sea accesible públicamente
      access_mode: 'public',
      // Tipo de almacenamiento
      type: 'upload',
      // Permitir acceso público sin autenticación
      use_filename: false,
      unique_filename: true,
      // IMPORTANTE: No usar signed URLs para que sea accesible públicamente
      sign_url: false,
    };

    // Si se proporciona un publicId, usarlo para sobrescribir o actualizar
    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          // Para archivos raw, usar la URL de descarga directa de Cloudinary
          // La URL debe ser: https://res.cloudinary.com/{cloud_name}/raw/upload/{public_id}.pdf
          // O usar cloudinary.url() con resource_type: 'raw'
          let secureUrl = result.secure_url || result.url;
          
          // Si la URL no es HTTPS o no es accesible, generar una nueva
          if (!secureUrl || !secureUrl.startsWith('https://')) {
            secureUrl = cloudinary.url(result.public_id, {
              resource_type: 'raw',
              secure: true,
              format: 'pdf',
              // Asegurar que sea accesible públicamente
              sign_url: false, // No usar signed URL para que sea accesible públicamente
            });
          }
          
          // Verificar que la URL tenga el formato correcto para archivos raw
          // Debe ser: https://res.cloudinary.com/{cloud_name}/raw/upload/{public_id}.pdf
          // Para archivos raw, Cloudinary puede devolver una URL diferente
          // Asegurarnos de usar la URL de descarga directa
          const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
          if (!secureUrl || !secureUrl.includes('/raw/upload/')) {
            // Reconstruir la URL con el formato correcto para archivos raw
            // Limpiar el public_id de duplicaciones de folder
            let cleanPublicId = result.public_id;
            // Remover duplicaciones como "reports/reports/"
            cleanPublicId = cleanPublicId.replace(/^reports\/reports\//, 'reports/');
            
            const publicIdWithFormat = cleanPublicId.endsWith('.pdf') 
              ? cleanPublicId 
              : `${cleanPublicId}.pdf`;
            
            secureUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${publicIdWithFormat}`;
          }
          
          // Asegurar que la URL no tenga signed parameters que bloqueen el acceso
          // Remover cualquier parámetro de firma o autenticación
          if (secureUrl.includes('?')) {
            const urlParts = secureUrl.split('?');
            secureUrl = urlParts[0]; // Usar solo la URL base sin parámetros
          }
          
          logger.info('PDF subido a Cloudinary', {
            publicId: result.public_id,
            secureUrl: secureUrl,
            originalUrl: result.url,
            bytes: result.bytes
          });
          
          // Intentar actualizar el acceso del archivo a público explícitamente
          // Esto ayuda a asegurar que el archivo sea accesible
          // Usar .then() en lugar de await porque el callback no es async
          cloudinary.uploader.explicit(result.public_id, {
            resource_type: 'raw',
            type: 'upload',
            access_mode: 'public'
          })
          .then(() => {
            logger.info('Acceso del PDF actualizado a público', {
              publicId: result.public_id
            });
          })
          .catch((explicitError) => {
            logger.warn('No se pudo actualizar el acceso del PDF explícitamente', {
              error: explicitError.message,
              publicId: result.public_id
            });
            // Continuar de todas formas, el archivo puede estar accesible
          });
          
          // Resolver inmediatamente sin esperar la actualización del acceso
          // La actualización se hace en segundo plano
          resolve({
            url: result.url,
            secure_url: secureUrl,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes,
          });
        }
      }
    );

    // Enviar el buffer al stream
    uploadStream.end(pdfBuffer);
  });
}

/**
 * Subir una imagen desde un File object (Next.js FormData)
 * @param {File} imageFile - Archivo de imagen
 * @param {string} folder - Carpeta donde guardar
 * @param {string} publicId - ID público opcional
 * @returns {Promise<{url: string, public_id: string, secure_url: string}>}
 */
export async function uploadImageFile(imageFile, folder = 'products', publicId = null) {
  // Convertir File a Buffer
  const bytes = await imageFile.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  return uploadImageToCloudinary(buffer, folder, publicId);
}

/**
 * Eliminar una imagen de Cloudinary
 * @param {string} publicId - ID público de la imagen
 * @returns {Promise<void>}
 */
export async function deleteImageFromCloudinary(publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Obtener la URL de una imagen con transformaciones
 * @param {string} publicId - ID público de la imagen
 * @param {Object} options - Opciones de transformación (width, height, crop, etc.)
 * @returns {string} URL transformada
 */
export function getImageUrl(publicId, options = {}) {
  return cloudinary.url(publicId, {
    secure: true,
    ...options,
  });
}

export default cloudinary;

