# Solución Error 63019: Media Failed to Download

## Problema
El error 63019 de Twilio indica que no puede descargar el PDF desde Cloudinary. Esto generalmente ocurre porque el archivo está **"Blocked for delivery"** en Cloudinary.

## Solución

### Opción 1: Configurar acceso público en Cloudinary (Recomendado)

1. **Ve al Dashboard de Cloudinary:**
   - Accede a [https://cloudinary.com/console](https://cloudinary.com/console)
   - Ve a la carpeta `reports` donde está el PDF

2. **Cambiar Access Control del archivo:**
   - Selecciona el PDF que quieres enviar
   - En el panel derecho, busca "Access control" o "Access mode"
   - Cambia de "Blocked for delivery" a **"Public"** o **"Open"**
   - Guarda los cambios

3. **Configurar acceso público por defecto:**
   - Ve a **Settings** → **Security**
   - En "Access mode for uploaded assets", selecciona **"Public"**
   - Esto hará que todos los archivos nuevos se suban como públicos

### Opción 2: Usar URL de descarga directa

Si el archivo sigue bloqueado, puedes usar la URL de descarga directa de Cloudinary:

```
https://res.cloudinary.com/{TU_CLOUD_NAME}/raw/upload/{PUBLIC_ID}.pdf
```

Reemplaza:
- `{TU_CLOUD_NAME}` con tu Cloud Name de Cloudinary
- `{PUBLIC_ID}` con el Public ID del archivo (ej: `reports/reporte-avanzado-today-2025-11-26...`)

### Opción 3: Verificar configuración de Cloudinary

Asegúrate de que en `.env.local` tengas:

```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

## Verificación

1. **Probar la URL directamente:**
   - Copia la URL del PDF desde Cloudinary
   - Ábrela en una ventana de incógnito del navegador
   - Si se descarga el PDF, la URL es accesible
   - Si da error 403 o "Access Denied", el archivo está bloqueado

2. **Verificar en los logs:**
   - Revisa los logs del servidor cuando se envía el reporte
   - Busca la línea que dice "PDF subido a Cloudinary"
   - Verifica que la `secureUrl` sea una URL HTTPS válida

## Notas Importantes

- **Tamaño máximo:** WhatsApp permite archivos de hasta 5MB
- **Formato:** El PDF debe ser accesible sin autenticación
- **HTTPS:** La URL debe ser HTTPS (no HTTP)
- **Acceso público:** El archivo debe estar configurado como "Public" en Cloudinary

## Si el problema persiste

1. Verifica que el PDF no exceda 5MB
2. Asegúrate de que la URL sea HTTPS
3. Prueba accediendo a la URL directamente desde el navegador
4. Verifica que Cloudinary no tenga restricciones de IP o geográficas
5. Considera usar el endpoint alternativo del servidor (`/api/reports/pdf/[id]`)

