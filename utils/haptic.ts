/**
 * Utilidad para agregar feedback háptico (vibración) a cualquier elemento clickeable
 * Uso: onClick={(e) => { triggerHaptic(); tuFuncion(); }}
 * 
 * NOTA: iOS Safari NO soporta navigator.vibrate() en navegadores web/PWA.
 * Solo funciona en apps nativas con Capacitor.
 */

// Variable global para el contexto de audio (feedback alternativo en iOS)
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  if (!audioContext) {
    try {
      // @ts-ignore - AudioContext puede tener diferentes nombres en diferentes navegadores
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
      }
    } catch (error) {
      // Silenciar errores
    }
  }
  
  return audioContext;
}

/**
 * Genera un sonido muy corto y sutil como feedback alternativo en iOS
 */
function playHapticSound(type: 'light' | 'medium' | 'heavy' = 'light') {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Frecuencias muy bajas y cortas para simular vibración
    const frequencies = {
      light: 40,    // 40Hz - muy bajo, casi imperceptible
      medium: 60,   // 60Hz
      heavy: 80     // 80Hz
    };

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequencies[type];
    oscillator.type = 'sine';

    // Volumen muy bajo (casi imperceptible)
    gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.01);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.01);
  } catch (error) {
    // Silenciar errores
  }
}

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

  // iOS NO soporta navigator.vibrate() en navegadores web/PWA
  // Solo funciona en apps nativas con Capacitor
  if (isIOS) {
    // Intentar vibrate por si acaso (aunque normalmente no funciona)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        const patterns = {
          light: [10, 5, 10],
          medium: [15, 5, 15],
          heavy: [20, 5, 20]
        };
        navigator.vibrate(patterns[type]);
      } catch (error) {
        // Silenciar errores
      }
    }
    
    // Feedback alternativo: sonido muy sutil (solo si el usuario tiene sonido activado)
    // Esto es solo un fallback, no es ideal pero es mejor que nada
    // playHapticSound(type);
    
    // En iOS PWA, la vibración simplemente no está disponible
    // El usuario necesita usar la app nativa con Capacitor
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
