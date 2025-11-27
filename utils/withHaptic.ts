/**
 * Helper para agregar vibración háptica a cualquier función onClick
 * 
 * Uso:
 * const handleClick = withHaptic(() => {
 *   // tu código aquí
 * });
 * 
 * O con parámetros:
 * const handleClick = withHaptic((param1, param2) => {
 *   // tu código aquí
 * });
 */

import { triggerHaptic } from './haptic';

export function withHaptic<T extends (...args: any[]) => any>(
  fn: T,
  hapticType: 'light' | 'medium' | 'heavy' = 'light'
): T {
  return ((...args: Parameters<T>) => {
    // Disparar vibración háptica (no bloqueante)
    triggerHaptic(hapticType).catch(() => {
      // Silenciar errores
    });
    
    // Ejecutar la función original
    return fn(...args);
  }) as T;
}

