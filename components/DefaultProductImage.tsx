"use client";

import React from 'react';

interface DefaultProductImageProps {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

const DefaultProductImage: React.FC<DefaultProductImageProps> = ({ 
  className = "", 
  width = 48, 
  height = 48,
  alt = "Producto sin imagen" 
}) => {
  return (
    <div 
      className={`bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <div className="text-center">
        <div className="text-gray-400 mb-1">
          <svg 
            width="20" 
            height="20" 
            fill="currentColor" 
            viewBox="0 0 24 24" 
            className="mx-auto"
          >
            <path d="M19 7h-2V6a3 3 0 0 0-3-3H10a3 3 0 0 0-3 3v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM9 6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9V6zm8 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h2v1a1 1 0 0 0 2 0V9h2v10z"/>
          </svg>
        </div>
        <p className="text-gray-500 text-xs">Sin imagen</p>
      </div>
    </div>
  );
};

export default DefaultProductImage;