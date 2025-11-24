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

  // Función para reproducir un beep corto y agudo (como escáner de supermercado)
  const playBeep = () => {
    try {
      // Crear un contexto de audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Crear un oscilador para generar el tono
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Configurar el oscilador (frecuencia más alta para sonido agudo como cajero)
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 2800; // Frecuencia más aguda (2800Hz - típico de escáneres de supermercado)
      oscillator.type = 'sine'; // Tipo de onda (sine = suave)
      
      // Configurar el volumen (gain) para un beep corto y claro
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime); // Volumen inicial un poco más alto
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08); // Fade out rápido
      
      // Reproducir el beep por 80ms (más corto y agudo)
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.08);
      
      // Limpiar el contexto después de que termine
      oscillator.onended = () => {
        audioContext.close();
      };
    } catch (error) {
      // Si falla la reproducción del beep, no interrumpir el flujo
      console.warn('No se pudo reproducir el beep:', error);
    }
  };

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
        
        // Filtrar y excluir cámaras frontales más agresivamente
        const backCameras = videoDevices.filter(device => {
          const label = device.label.toLowerCase();
          
          // Excluir cámaras frontales - lista más exhaustiva
          const isFrontal = 
            label.includes('front') || 
            label.includes('user') || 
            label.includes('facing') ||
            label.includes('selfie') ||
            label.includes('frontal') ||
            label.includes('1') ||  // Muchos dispositivos marcan la frontal como "1"
            label.includes('facing: user') ||
            label === 'camera' && videoDevices.length > 1; // Si hay múltiples y una se llama solo "camera", es probablemente frontal
          
          // Incluir solo cámaras traseras
          const isBack = 
            label.includes('back') || 
            label.includes('rear') || 
            label.includes('environment') ||
            label.includes('trasera') ||
            label.includes('2') ||  // Muchos dispositivos marcan la trasera como "2"
            label.includes('facing: environment') ||
            (!label.includes('front') && !label.includes('user') && !label.includes('facing'));
          
          // Solo incluir si NO es frontal Y es claramente trasera o no hay otra opción
          if (videoDevices.length === 1) {
            return true; // Si solo hay una cámara, usarla
          }
          return !isFrontal && isBack;
        });
        
        // Solo usar las cámaras traseras filtradas
        const availableDevices = backCameras.length > 0 ? backCameras : [];
        setDevices(availableDevices);
        
        if (availableDevices.length > 0) {
          // Buscar la mejor cámara trasera
          let selectedCamera = availableDevices.find(device => {
            const label = device.label.toLowerCase();
            return label.includes('back') || 
                   label.includes('rear') || 
                   label.includes('environment') ||
                   label.includes('trasera');
          });
          
          // Si no encontramos una claramente trasera, usar la primera disponible (que ya fue filtrada)
          if (!selectedCamera) {
            selectedCamera = availableDevices[0];
          }
          
          // Verificar una vez más que no sea frontal antes de usar el deviceId
          const label = selectedCamera.label.toLowerCase();
          const isFrontal = label.includes('front') || 
                           label.includes('user') || 
                           label.includes('frontal') ||
                           label.includes('selfie');
          
          if (isFrontal) {
            // Si resulta ser frontal después de todo, no usar deviceId y forzar environment
            console.warn('Device seleccionado parece ser frontal, usando solo facingMode');
            setSelectedDeviceId('');
            startScanning('');
          } else {
            const deviceId = selectedCamera.deviceId;
            setSelectedDeviceId(deviceId);
            startScanning(deviceId);
          }
        } else {
          // Si no hay cámaras traseras filtradas, intentar sin deviceId pero forzando environment
          console.warn('No se encontraron cámaras traseras, usando modo environment');
          setSelectedDeviceId('');
          startScanning('');
        }
      } catch (deviceError) {
        console.warn('Could not enumerate devices, trying fallback:', deviceError);
        // Fallback: intentar sin enumeración de dispositivos pero forzando environment
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
      
      // SIEMPRE usar solo facingMode para forzar cámara trasera, sin deviceId
      // Esto evita conflictos entre deviceId y facingMode
      // Si el deviceId es de una cámara frontal, no funcionará con facingMode: environment
      constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: { exact: 'environment' } // Usar 'exact' para forzar SOLO cámara trasera
        }
      };

      // Solicitar permisos de cámara (esto mostrará el diálogo nativo)
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;

      // Start continuous scanning - siempre usar null deviceId y dejar que facingMode maneje
      // Esto asegura que solo se use la cámara trasera
      try {
        // Siempre usar null para deviceId y dejar que facingMode: environment seleccione la cámara trasera
        codeReader.current.decodeFromVideoDevice(
          null, // null deviceId permite que facingMode funcione correctamente
          videoRef.current,
          (result, err) => {
            if (result) {
              const scannedText = result.getText();
              console.log('Barcode scanned:', scannedText);
              
              // Detener el escáner INMEDIATAMENTE para que la cámara se apague
              stopScanner();
              
              // Reproducir beep cuando se detecta un código
              playBeep();
              
              // Llamar al callback después de detener el escáner
              onScan(scannedText);
            }
            
            if (err && !(err instanceof NotFoundException)) {
              console.warn('Scan error:', err);
            }
          }
        );
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
    // Detener el decodificador primero
    if (codeReader.current) {
      try {
        codeReader.current.reset();
      } catch (e) {
        console.warn('Error al resetear codeReader:', e);
      }
    }
    
    // Detener todos los tracks del stream activo
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      setStream(null);
    }
    
    // También detener cualquier stream que pueda estar en el video element
    if (videoRef.current && videoRef.current.srcObject) {
      const currentStream = videoRef.current.srcObject as MediaStream;
      if (currentStream) {
        currentStream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }
      videoRef.current.srcObject = null;
    }
    
    // Pausar el video element
    if (videoRef.current) {
      videoRef.current.pause();
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
            {/* Removido el botón de cambiar cámara - solo se permite cámara trasera */}
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