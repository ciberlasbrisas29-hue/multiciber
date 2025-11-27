/**
 * Utilidad para agregar feedback háptico a cualquier elemento clickeable
 * Uso: onClick={(e) => { triggerHaptic(); tuFuncion(); }}
 */

export async function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  // Verificar si estamos en un entorno móvil (Capacitor)
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
      }
      return;
    } catch (error) {
      // Fallback a vibrate API si Capacitor Haptics falla
    }
  }

  // Fallback para navegadores web que soportan vibrate API
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const patterns = {
      light: 10,      // 10ms - vibración muy leve
      medium: 20,     // 20ms - vibración media
      heavy: 30       // 30ms - vibración más fuerte
    };
    
    try {
      navigator.vibrate(patterns[type]);
    } catch (error) {
      // Silenciar errores si vibrate no está disponible
    }
  }
}

