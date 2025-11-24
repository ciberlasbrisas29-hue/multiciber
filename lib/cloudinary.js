import { v2 as cloudinary } from 'cloudinary';

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

