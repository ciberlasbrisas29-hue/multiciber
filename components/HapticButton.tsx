"use client";

import React from 'react';
import { triggerHaptic } from '@/hooks/useHapticFeedback';

interface HapticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  hapticType?: 'light' | 'medium' | 'heavy';
  children: React.ReactNode;
  className?: string;
}

/**
 * Componente de botón con feedback háptico automático
 * Wrapper alrededor de button que agrega vibración al hacer clic
 */
const HapticButton: React.FC<HapticButtonProps> = ({
  hapticType = 'light',
  children,
  className = '',
  onClick,
  ...props
}) => {
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Disparar vibración háptica (no bloqueante)
    triggerHaptic(hapticType).catch(() => {
      // Silenciar errores
    });
    
    // Ejecutar el onClick original si existe
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      {...props}
      className={className}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export default HapticButton;

