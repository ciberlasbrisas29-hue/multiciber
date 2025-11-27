/**
 * Utilidad para agregar feedback háptico (vibración) a cualquier elemento clickeable
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

  // Detectar iOS (incluyendo iPad con iOS 13+)
  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
    // Detectar iOS en PWA
    (typeof window !== 'undefined' && (window as any).navigator?.standalone === true)
  );

  // Para iOS, usar patrones de vibración más largos
  // iOS requiere patrones más largos y específicos para que se sientan
  if (isIOS && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const patterns = {
      light: [10, 5, 10],      // Patrón: vibrar 10ms, pausa 5ms, vibrar 10ms
      medium: [15, 5, 15],     // Patrón más fuerte
      heavy: [20, 5, 20]       // Patrón más fuerte aún
    };
    
    try {
      navigator.vibrate(patterns[type]);
    } catch (error) {
      // Silenciar errores
    }
    return;
  }

  // Para Android y otros navegadores que soportan vibrate API
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
