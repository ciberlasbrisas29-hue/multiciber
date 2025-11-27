# Guía de Vibración Háptica

Este proyecto incluye feedback háptico (vibración) en todos los botones para mejorar la experiencia de usuario en dispositivos móviles.

## 📦 Instalación

El plugin de Capacitor Haptics ya está instalado. Si necesitas reinstalarlo:

```bash
npm install @capacitor/haptics
npx cap sync android
```

## 🎯 Uso

### Opción 1: Función `triggerHaptic` (Recomendado)

```tsx
import { triggerHaptic } from '@/utils/haptic';

<button 
  onClick={async () => {
    triggerHaptic('light'); // 'light', 'medium', o 'heavy'
    // tu código aquí
  }}
>
  Click me
</button>
```

### Opción 2: Helper `withHaptic`

```tsx
import { withHaptic } from '@/utils/withHaptic';

const handleClick = withHaptic(() => {
  // tu código aquí
  router.push('/page');
});

<button onClick={handleClick}>
  Click me
</button>
```

### Opción 3: Hook `useHapticFeedback`

```tsx
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const MyComponent = () => {
  const { triggerHaptic } = useHapticFeedback();
  
  return (
    <button onClick={() => triggerHaptic('light')}>
      Click me
    </button>
  );
};
```

### Opción 4: Componente `HapticButton`

```tsx
import HapticButton from '@/components/HapticButton';

<HapticButton 
  hapticType="light"
  onClick={() => {
    // tu código aquí
  }}
  className="..."
>
  Click me
</HapticButton>
```

## 📱 Tipos de Vibración

- **`light`**: Vibración muy leve (10ms) - Para acciones normales
- **`medium`**: Vibración media (20ms) - Para acciones importantes
- **`heavy`**: Vibración fuerte (30ms) - Para acciones críticas

## 🔧 Compatibilidad

- **Android (Capacitor)**: Usa el plugin nativo de Capacitor Haptics
- **Web (Navegadores)**: Usa la API `navigator.vibrate()` (si está disponible)
- **iOS (Capacitor)**: Usa el plugin nativo de Capacitor Haptics

## 📝 Aplicar a Todos los Botones

Para aplicar vibración háptica a todos los botones del proyecto, busca todos los `onClick` y agrega:

```tsx
// Antes:
onClick={() => router.push('/page')}

// Después:
onClick={async () => {
  await import('@/utils/haptic').then(m => m.triggerHaptic('light'));
  router.push('/page');
}}
```

O usando el helper:

```tsx
import { withHaptic } from '@/utils/withHaptic';

// Antes:
onClick={() => router.push('/page')}

// Después:
onClick={withHaptic(() => router.push('/page'))}
```

## ✅ Ya Implementado

Los siguientes componentes ya tienen vibración háptica:
- ✅ `components/BottomNavbar.tsx` - Navegación inferior
- ✅ `app/page.tsx` - Botones de acción principales

## 🚀 Próximos Pasos

Aplicar vibración háptica a:
- [ ] Botones de formularios (crear venta, gasto, etc.)
- [ ] Botones de modales
- [ ] Botones de acciones (editar, eliminar, etc.)
- [ ] Botones de navegación
- [ ] Cualquier otro botón interactivo

## 💡 Tips

1. Usa `light` para la mayoría de botones (menos intrusivo)
2. Usa `medium` para acciones importantes (guardar, enviar)
3. Usa `heavy` para acciones críticas (eliminar, confirmar)
4. La vibración es no bloqueante, no afecta el rendimiento

