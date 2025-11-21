# Generación de Iconos para PWA

Para completar la configuración PWA, necesitas crear los siguientes iconos:

## Iconos Requeridos:

1. **icon-192x192.png** - 192x192 píxeles
2. **icon-512x512.png** - 512x512 píxeles  
3. **apple-touch-icon.png** - 180x180 píxeles (para iOS)

## Cómo Generarlos:

### Opción 1: Usar el logo existente
Puedes usar `/assets/images/logo.png` como base y redimensionarlo a estos tamaños.

### Opción 2: Herramientas Online
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator
- https://favicon.io/

### Opción 3: Usar ImageMagick o similar
```bash
# Si tienes ImageMagick instalado
convert assets/images/logo.png -resize 192x192 public/icon-192x192.png
convert assets/images/logo.png -resize 512x512 public/icon-512x512.png
convert assets/images/logo.png -resize 180x180 public/apple-touch-icon.png
```

## Nota:
Los iconos deben ser cuadrados y preferiblemente con fondo transparente o sólido.
Para iOS, el apple-touch-icon debe tener esquinas redondeadas (iOS las aplica automáticamente).

