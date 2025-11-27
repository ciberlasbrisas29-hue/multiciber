# Configurar Variable de Entorno en Vercel para PDFs

## Problema
El error "Invalid media URL(s) (21620)" ocurre porque la URL del PDF no se está generando correctamente. La URL generada es relativa (`/api/api/reports/pdf/...`) en lugar de absoluta con HTTPS.

## Solución

### Opción 1: Configurar Variable de Entorno en Vercel (Recomendado)

1. **Ve al Dashboard de Vercel:**
   - Accede a [vercel.com](https://vercel.com)
   - Selecciona tu proyecto `multiciber`

2. **Ve a Settings → Environment Variables**

3. **Agrega la siguiente variable:**
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://multiciber-fzio.vercel.app`
   - **Environment:** Production, Preview, Development (marca todas)

4. **Guarda los cambios**

5. **Redeploy la aplicación:**
   - Ve a Deployments
   - Haz clic en los tres puntos del último deployment
   - Selecciona "Redeploy"

### Opción 2: Verificar que VERCEL_URL esté disponible

Vercel debería configurar `VERCEL_URL` automáticamente, pero a veces no está disponible en el runtime del servidor.

Para verificar:
1. Ve a Deployments → [tu último deployment] → Functions
2. Revisa los logs para ver si `VERCEL_URL` está disponible
3. Si no está, usa la Opción 1

### Opción 3: Usar la URL directamente en el código (Temporal)

Si necesitas una solución rápida, puedes hardcodear la URL temporalmente en `lib/twilio.js`:

```javascript
// TEMPORAL: Hardcodear la URL de Vercel
const baseUrl = 'https://multiciber-fzio.vercel.app';
```

**NOTA:** Esto no es recomendado para producción, pero funciona como solución temporal.

## Verificación

Después de configurar la variable de entorno:

1. **Redeploy la aplicación en Vercel**
2. **Prueba enviar un reporte**
3. **Revisa los logs en Vercel** para verificar que la URL generada sea correcta:
   - Debería ser: `https://multiciber-fzio.vercel.app/api/reports/pdf/...`
   - NO debería ser: `/api/api/reports/pdf/...`

## Logs a Revisar

En los logs de Vercel, busca:
```
Usando endpoint del servidor para PDF
```

Deberías ver:
- `url: https://multiciber-fzio.vercel.app/api/reports/pdf/...`
- `baseUrl: https://multiciber-fzio.vercel.app`
- `isHttps: true`

Si ves `baseUrl: null` o `baseUrl: undefined`, significa que las variables de entorno no están configuradas correctamente.

