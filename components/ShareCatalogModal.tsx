"use client";

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ShareCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

const ShareCatalogModal: React.FC<ShareCatalogModalProps> = ({ isOpen, onClose, userId }) => {
  const [copied, setCopied] = useState(false);
  const [catalogUrl, setCatalogUrl] = useState('');
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (userId && typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      setCatalogUrl(`${baseUrl}/catalog/${userId}`);
      
      // Verificar si la API de compartir está disponible
      setCanShare(typeof navigator !== 'undefined' && 'share' in navigator);
    }
  }, [userId]);

  const handleCopy = async () => {
    if (catalogUrl) {
      try {
        await navigator.clipboard.writeText(catalogUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Error al copiar:', err);
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share && catalogUrl) {
      try {
        await navigator.share({
          title: 'Catálogo de Productos',
          text: 'Mira nuestro catálogo de productos',
          url: catalogUrl,
        });
      } catch (err) {
        // Usuario canceló o error
        console.error('Error al compartir:', err);
      }
    } else {
      // Fallback a copiar
      handleCopy();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Título */}
        <div className="mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center">Compartir Catálogo</h2>
          <p className="text-gray-500 text-center mt-2">Comparte tu catálogo con tus clientes</p>
        </div>

        {/* Código QR */}
        <div className="mb-6 flex justify-center">
          <div className="bg-white p-4 rounded-2xl border-2 border-purple-100">
            {catalogUrl && (
              <QRCodeSVG
                value={catalogUrl}
                size={200}
                level="H"
                includeMargin={true}
              />
            )}
          </div>
        </div>

        {/* Link */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enlace del Catálogo
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={catalogUrl}
              readOnly
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-700"
            />
            <button
              onClick={handleCopy}
              className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
              title="Copiar enlace"
            >
              {copied ? (
                <Check className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-sm text-green-600 mt-2 text-center">¡Enlace copiado!</p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="space-y-3">
          {canShare && (
            <button
              onClick={handleShare}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:shadow-lg transition-all"
            >
              <Share2 className="w-5 h-5" />
              <span>Compartir</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <Copy className="w-5 h-5" />
            <span>Copiar Enlace</span>
          </button>
        </div>

        {/* Información */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Escanea el código QR o comparte el enlace para que tus clientes vean los productos disponibles
        </p>
      </div>
    </div>
  );
};

export default ShareCatalogModal;
