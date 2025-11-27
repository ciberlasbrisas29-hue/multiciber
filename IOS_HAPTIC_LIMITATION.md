# Limitación de Vibración Háptica en iOS PWA

## ⚠️ Problema

**iOS Safari NO soporta la API de vibración web (`navigator.vibrate()`)**, incluso en PWAs instaladas. Esta es una limitación del sistema operativo iOS por razones de seguridad y privacidad.

## ✅ Solución: App Nativa con Capacitor

La única forma de tener vibración háptica real en iOS es usando la **app nativa con Capacitor**, no la PWA.

### Pasos para usar la app nativa:

1. **Construir la app nativa:**
   ```bash
   npm run build
   npm run cap:sync
   npm run cap:open
   ```

2. **Abrir en Xcode:**
   - Se abrirá Android Studio (para Android)
   - Para iOS, necesitas abrir el proyecto en Xcode desde `ios/` (si tienes iOS configurado)

3. **Compilar y ejecutar:**
   - En Xcode, selecciona tu dispositivo iOS
   - Presiona "Run" para instalar la app nativa
   - La vibración funcionará correctamente

## 📱 Diferencias

| Plataforma | PWA | App Nativa (Capacitor) |
|------------|-----|------------------------|
| **Android** | ✅ Vibración funciona | ✅ Vibración funciona |
| **iOS** | ❌ Vibración NO funciona | ✅ Vibración funciona |

## 🔧 Estado Actual

- ✅ **Android PWA**: Vibración funciona correctamente
- ✅ **Android App Nativa**: Vibración funciona correctamente
- ❌ **iOS PWA**: Vibración NO funciona (limitación de iOS)
- ✅ **iOS App Nativa**: Vibración funciona correctamente (requiere Capacitor)

## 💡 Alternativas para iOS PWA

Si necesitas feedback en iOS PWA, puedes usar:
- Efectos visuales (animaciones, cambios de color)
- Sonidos muy cortos (aunque puede ser molesto)
- Feedback táctil mediante CSS (limitado)

## 📝 Nota

El código ya está preparado para funcionar en app nativa. Solo necesitas compilar la app nativa con Capacitor para iOS.

