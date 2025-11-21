"use client";

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { X, Camera, Scan } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    try {
      setError('');
      
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        setError('El escáner no está disponible en el servidor.');
        return;
      }
      
      // Check if getUserMedia is supported
      if (!navigator?.mediaDevices?.getUserMedia) {
        setError('Tu navegador no soporta el acceso a la cámara. Intenta con Chrome o actualiza Safari.');
        return;
      }
      
      codeReader.current = new BrowserMultiFormatReader();
      
      // Try to get available video devices with fallback
      try {
        const videoDevices = await codeReader.current.listVideoInputDevices();
        setDevices(videoDevices);
        
        if (videoDevices.length > 0) {
          // Prefer back camera on mobile devices
          const backCamera = videoDevices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
          );
          
          const deviceId = backCamera?.deviceId || videoDevices[0].deviceId;
          setSelectedDeviceId(deviceId);
          startScanning(deviceId);
        } else {
          // Fallback: try without specific device ID
          startScanning('');
        }
      } catch (deviceError) {
        console.warn('Could not enumerate devices, trying fallback:', deviceError);
        // Fallback: try without device enumeration
        startScanning('');
      }
    } catch (err) {
      console.error('Error initializing scanner:', err);
      setError('Error al inicializar el escáner. Verifica los permisos de cámara.');
    }
  };

  const startScanning = async (deviceId: string) => {
    if (!codeReader.current || !videoRef.current) return;

    try {
      setIsScanning(true);
      setError('');

      // Check if getUserMedia is available before using it
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia no está disponible');
      }

      // Verificar permisos de cámara antes de solicitar
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (permissionStatus.state === 'denied') {
          setError('Permisos de cámara denegados. Por favor, habilita los permisos de cámara en la configuración de tu dispositivo.');
          setIsScanning(false);
          return;
        }
      } catch (permError) {
        // Algunos navegadores no soportan permissions.query, continuar normalmente
        console.log('No se pudo verificar permisos, continuando...');
      }

      // Start decoding from video device with fallback constraints
      let constraints;
      
      if (deviceId) {
        constraints = {
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
      } else {
        constraints = {
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: { ideal: 'environment' }
          }
        };
      }

      // Solicitar permisos de cámara (esto mostrará el diálogo nativo)
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;

      // Start continuous scanning with fallback
      try {
        if (deviceId) {
          codeReader.current.decodeFromVideoDevice(
            deviceId,
            videoRef.current,
            (result, err) => {
              if (result) {
                const scannedText = result.getText();
                console.log('Barcode scanned:', scannedText);
                onScan(scannedText);
                stopScanner();
              }
              
              if (err && !(err instanceof NotFoundException)) {
                console.warn('Scan error:', err);
              }
            }
          );
        } else {
          // Fallback: decode from video device with null deviceId
          codeReader.current.decodeFromVideoDevice(
            null,
            videoRef.current,
            (result, err) => {
              if (result) {
                const scannedText = result.getText();
                console.log('Barcode scanned:', scannedText);
                onScan(scannedText);
                stopScanner();
              }
              
              if (err && !(err instanceof NotFoundException)) {
                console.warn('Scan error:', err);
              }
            }
          );
        }
      } catch (decodeError) {
        console.error('Decode error:', decodeError);
        setError('Error al inicializar el escáner');
        setIsScanning(false);
      }
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      
      // Manejo específico de errores de permisos
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permisos de cámara denegados. Por favor, permite el acceso a la cámara en la configuración de tu navegador o dispositivo.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No se encontró ninguna cámara. Verifica que tu dispositivo tenga una cámara disponible.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('La cámara está siendo usada por otra aplicación. Cierra otras apps que usen la cámara e intenta de nuevo.');
      } else {
        setError('Error al acceder a la cámara. Verifica los permisos y que la cámara esté disponible.');
      }
      
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const switchCamera = async () => {
    if (devices.length <= 1) return;
    
    stopScanner();
    
    const currentIndex = devices.findIndex(device => device.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDeviceId = devices[nextIndex].deviceId;
    
    setSelectedDeviceId(nextDeviceId);
    startScanning(nextDeviceId);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Escanear Código de Barras</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Video Preview */}
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg bg-black"
              style={{ maxHeight: '300px', objectFit: 'cover' }}
            />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-green-500 bg-transparent rounded-lg p-8">
                <div className="w-48 h-32 border-2 border-dashed border-green-400 rounded flex items-center justify-center">
                  <Scan className="w-8 h-8 text-green-500 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Scanning Status */}
            {isScanning && (
              <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                Escaneando...
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">Apunta la cámara hacia el código de barras</p>
            <p className="mb-2">El escaneo será automático cuando se detecte el código</p>
            {error && (
              <div className="text-xs text-orange-600 mt-2">
                <p>💡 Tip: Si no funciona, intenta abrir en Chrome o usar HTTPS</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-3">
            {devices.length > 1 && (
              <button
                onClick={switchCamera}
                disabled={!isScanning}
                className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-400"
                type="button"
              >
                <Camera className="w-4 h-4" />
                <span>Cambiar Cámara</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              type="button"
            >
              Cancelar
            </button>
          </div>

          {/* Device Info */}
          {devices.length > 0 && (
            <div className="text-xs text-gray-500 text-center">
              Cámara: {devices.find(d => d.deviceId === selectedDeviceId)?.label || 'Desconocida'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;