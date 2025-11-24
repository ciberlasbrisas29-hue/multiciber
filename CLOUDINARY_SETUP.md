# Configuración de Cloudinary para Imágenes

## 📦 ¿Qué es Cloudinary?

Cloudinary es un servicio de gestión de imágenes en la nube que proporciona:
- ✅ **CDN global** para carga rápida de imágenes
- ✅ **Optimización automática** (compresión, WebP, etc.)
- ✅ **Transformaciones on-the-fly** (redimensionar, recortar, etc.)
- ✅ **Plan gratuito generoso**: 25GB almacenamiento, 25GB transferencia/mes
- ✅ **Escalable**: Sin límites de tamaño de Base64

## 🚀 Configuración Rápida

### 1. Crear cuenta en Cloudinary

1. Ve a [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Regístrate con tu email (cuenta gratuita disponible)
3. Verifica tu email

### 2. Obtener credenciales

Una vez registrado, en el Dashboard verás:
- **Cloud Name** (ej: `dxyz123abc`)
- **API Key** (ej: `123456789012345`)
- **API Secret** (ej: `abcdefghijklmnopqrstuvwxyz123456`)

### 3. Configurar variables de entorno

Agrega estas variables a tu archivo `.env.local` (o `.env` en producción):

```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name_aqui
CLOUDINARY_API_KEY=tu_api_key_aqui
CLOUDINARY_API_SECRET=tu_api_secret_aqui
```

**⚠️ IMPORTANTE**: Nunca subas el archivo `.env.local` a Git. El `.gitignore` ya está configurado para ignorarlo.

### 4. Para Vercel (Producción)

Si estás usando Vercel, agrega las variables de entorno en:
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega las 3 variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Haz redeploy del proyecto

## 📝 Cambios Implementados

### Archivos creados:
- `lib/cloudinary.js` - Utilidades para Cloudinary
- `app/api/upload/image/route.js` - Endpoint para subir imágenes directamente

### Archivos modificados:
- `app/api/products/route.js` - Ahora sube imágenes a Cloudinary en lugar de Base64
- `app/api/products/[id]/route.js` - Actualiza imágenes en Cloudinary

## 🔄 Migración de Imágenes Existentes

Las imágenes existentes que están en formato Base64 seguirán funcionando normalmente. Cuando actualices un producto con imagen Base64 y subas una nueva imagen, esta se subirá a Cloudinary automáticamente.

**Opcional**: Puedes crear un script de migración para mover todas las imágenes Base64 a Cloudinary, pero no es necesario para que funcione.

## 🎯 Ventajas vs Base64

| Característica | Base64 (Anterior) | Cloudinary (Nuevo) |
|----------------|-------------------|-------------------|
| **Límite de tamaño** | ~16MB (límite MongoDB) | Sin límite práctico |
| **Velocidad de carga** | Lenta (base de datos) | Rápida (CDN) |
| **Optimización** | Manual | Automática |
| **Formato** | Original | WebP automático |
| **Escalabilidad** | Limitada | Ilimitada |
| **Costo** | Gratis | Gratis (hasta 25GB) |

## 🔧 Uso de la API

### Subir imagen directamente

```javascript
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('/api/upload/image', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.data.url); // URL de la imagen en Cloudinary
```

### Crear producto con imagen

El endpoint `/api/products` acepta imágenes automáticamente:

```javascript
const formData = new FormData();
formData.append('name', 'Mi Producto');
formData.append('image', imageFile);
// ... otros campos

const response = await fetch('/api/products', {
  method: 'POST',
  body: formData
});
```

## 📊 Monitoreo

Puedes monitorear tu uso en el Dashboard de Cloudinary:
- [https://cloudinary.com/console](https://cloudinary.com/console)

## 💡 Tips

1. **Límite gratuito**: 25GB almacenamiento y 25GB transferencia/mes suele ser suficiente para miles de productos
2. **Optimización automática**: Cloudinary automáticamente convierte a WebP para navegadores modernos
3. **Transformaciones**: Puedes redimensionar imágenes on-the-fly añadiendo parámetros a la URL
4. **Caché**: Las imágenes se cachean automáticamente en el CDN global

## 🆘 Solución de Problemas

### Error: "Invalid credentials"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de copiar las credenciales completas sin espacios

### Error: "Upload failed"
- Verifica que el archivo sea una imagen válida (JPG, PNG, WEBP, GIF)
- Tamaño máximo: 10MB (configurable en `app/api/upload/image/route.js`)

### Las imágenes no cargan
- Verifica que la URL de Cloudinary esté accesible
- Revisa la consola del navegador para errores CORS (no debería haberlos)

## 📚 Documentación Adicional

- [Documentación oficial de Cloudinary](https://cloudinary.com/documentation)
- [Node.js SDK de Cloudinary](https://cloudinary.com/documentation/node_integration)

