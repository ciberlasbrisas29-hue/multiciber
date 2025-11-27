# 🔐 Verificar Credenciales de Twilio

## ⚠️ Importante: Credenciales de Prueba vs Producción

Las **credenciales de prueba** (Test Credentials) tienen limitaciones:
- Solo funcionan con números de prueba
- Pueden causar errores como 63015
- No funcionan con el Sandbox de WhatsApp

## ✅ Usar Credenciales de Producción

Para el Sandbox de WhatsApp, necesitas las **credenciales de producción** (Live Credentials):

### Paso 1: Obtener Credenciales de Producción

1. **Ve a Twilio Console**: https://console.twilio.com
2. **En el Dashboard principal**, busca:
   - **Account SID** (no "Test Account SID")
   - **Auth Token** (no "Test Auth Token")
3. **Haz clic en "Show"** para ver el Auth Token
4. **Copia ambas credenciales**

### Paso 2: Actualizar .env.local

Abre tu archivo `.env.local` y verifica que tengas:

```env
# Credenciales de PRODUCCIÓN (no de prueba)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_de_produccion
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_CONTENT_SID=HXb5b62575e6e4ff6129ad7c8efe1f983e
```

### Paso 3: Verificar que NO sean Credenciales de Prueba

**Las credenciales de prueba** empiezan con:
- Account SID: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (pero son de prueba)
- Se encuentran en: Console → Test Credentials

**Las credenciales de producción** también empiezan con:
- Account SID: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (pero son de producción)
- Se encuentran en: Console → Dashboard (página principal)

### Paso 4: Reiniciar el Servidor

Después de actualizar las credenciales:

1. **Detén el servidor** (Ctrl+C)
2. **Reinicia**: `npm run dev`
3. **Prueba enviar un mensaje** desde la aplicación

## 🔍 Cómo Identificar Credenciales Correctas

**Credenciales de Prueba:**
- Aparecen en una sección separada "Test Credentials"
- Tienen limitaciones
- No funcionan con el Sandbox de WhatsApp

**Credenciales de Producción:**
- Aparecen en el Dashboard principal
- Funcionan con el Sandbox de WhatsApp
- Son las que necesitas usar

## ⚠️ Seguridad

**NUNCA** compartas tus credenciales:
- No las subas a Git
- No las compartas en imágenes
- Guárdalas solo en `.env.local` (que está en `.gitignore`)

Si accidentalmente compartiste credenciales:
1. **Ve a Twilio Console**
2. **Regenera el Auth Token** inmediatamente
3. **Actualiza `.env.local`** con el nuevo token

## 🎯 Próximos Pasos

1. **Verifica que estés usando credenciales de producción**
2. **Actualiza `.env.local`** si es necesario
3. **Reinicia el servidor**
4. **Prueba enviar un mensaje**

---

**Nota**: Si estás usando credenciales de prueba, cámbialas a credenciales de producción. Esto debería resolver el error 63015.

