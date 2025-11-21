"use client";

import { useEffect } from 'react';

export default function PWADetector() {
  useEffect(() => {
    // Detectar si está en modo standalone (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      // Prevenir que los enlaces externos abran el navegador
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a');
        
        if (link && link.href) {
          const url = new URL(link.href, window.location.origin);
          
          // Si el enlace es externo, prevenir comportamiento por defecto
          if (url.origin !== window.location.origin && !link.hasAttribute('data-allow-external')) {
            e.preventDefault();
            // Opcional: mostrar mensaje o abrir en la misma ventana
            console.warn('Enlace externo bloqueado en modo PWA:', link.href);
          }
        }
      }, true);

      // Prevenir window.open que abra el navegador
      const originalOpen = window.open;
      window.open = function(url?: string | URL, target?: string, features?: string) {
        if (url && typeof url === 'string') {
          const urlObj = new URL(url, window.location.origin);
          if (urlObj.origin !== window.location.origin) {
            console.warn('window.open bloqueado en modo PWA:', url);
            return null;
          }
        }
        return originalOpen(url, target, features);
      };
    }

    return () => {
      // Cleanup si es necesario
    };
  }, []);

  return null;
}

