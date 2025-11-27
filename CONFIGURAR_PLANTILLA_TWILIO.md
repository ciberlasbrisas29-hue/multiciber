# 🔧 Configurar Plantilla de Twilio para Solucionar Error 63015

## 📋 Información de tu Plantilla

Según la imagen de Twilio Console, tienes una plantilla:
- **Nombre**: "Appointment Reminders"
- **Content SID**: `HXb5b62575e6e4ff6129ad7c8efe1f983e`
- **Variables**: `{{1}}` (fecha) y `{{2}}` (hora)

## ✅ Paso 1: Agregar Content SID a .env.local

Abre tu archivo `.env.local` y agrega:

```env
TWILIO_CONTENT_SID=HXb5b62575e6e4ff6129ad7c8efe1f983e
```

## ✅ Paso 2: Reiniciar el Servidor

Después de agregar la variable:

1. **Detén el servidor** (Ctrl+C en la terminal donde corre `npm run dev`)
2. **Reinicia el servidor**: `npm run dev`
3. **Espera a que compile**

## ✅ Paso 3: Probar con la Plantilla

La plantilla "Appointment Reminders" tiene este formato:
```
Your appointment is coming up on {{1}} at {{2}}. If you need to change it, please reply back and let us know.
```

Cuando envíes un mensaje personalizado desde la aplicación:
- La variable `{{1}}` recibirá el mensaje que escribas
- La variable `{{2}}` recibirá "3pm" (valor por defecto)

## ⚠️ Limitación de la Plantilla Actual

La plantilla "Appointment Reminders" está diseñada para recordatorios de citas, no para mensajes personalizados genéricos.

### Opción A: Usar la Plantilla Actual (Temporal)

Puedes usar esta plantilla para pruebas, pero el mensaje se verá como:
```
Your appointment is coming up on [tu mensaje] at 3pm. If you need to change it, please reply back and let us know.
```

### Opción B: Crear una Plantilla Genérica (Recomendado)

Para mensajes personalizados, es mejor crear una plantilla genérica:

1. **Ve a Twilio Console**: https://console.twilio.com
2. **Navega a**: Messaging → Content Template Builder
3. **Crea una nueva plantilla**:
   - Nombre: "Mensaje Genérico" o "Generic Message"
   - Tipo: "Text"
   - Contenido: `{{1}}` (solo una variable para el mensaje completo)
4. **Copia el nuevo Content SID**
5. **Actualiza `.env.local`** con el nuevo Content SID

## 🎯 Próximos Pasos

1. **Agrega `TWILIO_CONTENT_SID` a `.env.local`**
2. **Reinicia el servidor**
3. **Prueba enviar un mensaje** desde la aplicación
4. **El mensaje debería llegar** usando la plantilla

---

**Nota**: Si prefieres crear una plantilla genérica para mensajes personalizados, sigue la Opción B. La plantilla actual funcionará, pero el formato del mensaje será limitado.

