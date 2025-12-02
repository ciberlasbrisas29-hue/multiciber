"use client";

import { useState } from 'react';
import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  width = 80, 
  height = 80, 
  className = "", 
  alt = "Logo Multiciber" 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = () => {
    console.error('Error loading logo image');
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  if (imageError) {
    // Fallback: mostrar un ícono o texto cuando la imagen falla
    return (
      <div 
        className={`flex items-center justify-center bg-teal-600 text-white font-bold rounded ${className}`}
        style={{ width, height }}
      >
        <span className="text-lg">MC</span>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width, height }}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width, height }}
        />
      )}
      <Image
        src="/assets/images/logo.png"
        alt={alt}
        width={width}
        height={height}
        onError={handleImageError}
        onLoad={handleImageLoad}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 object-contain`}
        priority={true}
        unoptimized={true}
      />
    </div>
  );
};

export default Logo;