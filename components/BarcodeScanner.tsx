"use client";

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { X, Camera, Scan, Plus, Minus, Check, Clock, ChevronRight } from 'lucide-react';
import { useScanner } from '@/contexts/ScannerContext';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
  continuousMode?: boolean; // Modo continuo: no se cierra después de escanear
  scannedProducts?: Array<{ id: string; name: string; quantity: number; price: number; image?: string; stock: number }>; // Productos escaneados
  onUpdateQuantity?: (productId: string, change: number) => void; // Callback para actualizar cantidad
  onFinish?: () => void; // Callback para finalizar escaneo
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onScan, 
  onClose, 
  isOpen, 
  continuousMode = false,
  scannedProducts = [],
  onUpdateQuantity,
  onFinish
}) => {
  const { setIsScannerOpen } = useScanner();
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // Usar ref para acceso directo al stream
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const lastScannedCodeRef = useRef<string>(''); // Último código escaneado
  const lastScanTimeRef = useRef<number>(0); // Tiempo del último escaneo
  const scannedCodesSetRef = useRef<Set<string>>(new Set()); // Set de códigos ya escaneados en esta sesión
  const SCAN_COOLDOWN = 5000; // 5 segundos de cooldown entre escaneos del mismo código

  // Sincronizar el estado del escáner con el contexto
  useEffect(() => {
    setIsScannerOpen(isOpen);
    
    // Prevenir scroll del body cuando el escáner está abierto
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      setIsScannerOpen(false);
    };
  }, [isOpen, setIsScannerOpen]);

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
      
      oscillator.frequency.value = 4200; // Frecuencia muy aguda (4200Hz - como escáner de supermercado)
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
      // Asegurar que la cámara se detenga cuando se cierra el modal
      stopScanner();
      // Limpiar el Set de códigos escaneados cuando se cierra el escáner
      scannedCodesSetRef.current.clear();
    }

    return () => {
      // Cleanup: siempre detener la cámara al desmontar o cambiar isOpen
      stopScanner();
      setIsScannerOpen(false);
      // Limpiar el Set de códigos escaneados cuando se cierra el escáner
      scannedCodesSetRef.current.clear();
    };
  }, [isOpen, setIsScannerOpen]);

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
      streamRef.current = mediaStream; // Guardar en ref para acceso directo
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
              const normalizedBarcode = scannedText.toLowerCase().trim();
              const currentTime = Date.now();
              
              // Verificar si este código ya fue escaneado en esta sesión (permanente)
              if (scannedCodesSetRef.current.has(normalizedBarcode)) {
                // Ignorar escaneo de código ya procesado - NO llamar al callback
                console.log('Código de barras ya escaneado en esta sesión, ignorado');
                return; // Salir sin procesar
              }
              
              // Verificar si es el mismo código escaneado recientemente (dentro del cooldown)
              const isSameCode = lastScannedCodeRef.current === normalizedBarcode;
              const timeSinceLastScan = currentTime - lastScanTimeRef.current;
              
              if (isSameCode && timeSinceLastScan < SCAN_COOLDOWN) {
                // Ignorar escaneo repetido del mismo código - NO llamar al callback
                console.log('Escaneo repetido ignorado (cooldown activo)');
                return; // Salir sin procesar
              }
              
              // IMPORTANTE: Marcar este código como escaneado INMEDIATAMENTE (antes de llamar al callback)
              // Esto previene que múltiples detecciones simultáneas pasen la validación
              scannedCodesSetRef.current.add(normalizedBarcode);
              
              // Actualizar referencias del último escaneo
              lastScannedCodeRef.current = normalizedBarcode;
              lastScanTimeRef.current = currentTime;
              
              console.log('Barcode scanned:', scannedText);
              
              // Reproducir beep cuando se detecta un código
              playBeep();
              
              // Llamar al callback inmediatamente
              onScan(scannedText);
              
              // Si NO es modo continuo, detener el escáner después de escanear
              if (!continuousMode) {
                // Pequeño delay para asegurar que la cámara se detuvo antes de continuar
                setTimeout(() => {
                  stopScanner();
                }, 100);
              }
              // Si es modo continuo, el escáner sigue activo para escanear más productos
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
        codeReader.current = null; // Limpiar la referencia
      } catch (e) {
        console.warn('Error al resetear codeReader:', e);
      }
    }
    
    // Detener todos los tracks del stream usando la ref (más confiable que el estado)
    const currentStream = streamRef.current || stream;
    if (currentStream) {
      try {
        currentStream.getTracks().forEach(track => {
          // Detener el track de forma agresiva
          track.stop();
          track.enabled = false;
          // Remover el track del stream
          currentStream.removeTrack(track);
        });
      } catch (e) {
        console.warn('Error al detener tracks del stream:', e);
      }
      streamRef.current = null;
      setStream(null);
    }
    
    // También detener cualquier stream que pueda estar en el video element
    if (videoRef.current) {
      try {
        if (videoRef.current.srcObject) {
          const videoStream = videoRef.current.srcObject as MediaStream;
          if (videoStream) {
            videoStream.getTracks().forEach(track => {
              track.stop();
              track.enabled = false;
            });
          }
        }
        // Limpiar el srcObject y pausar
        videoRef.current.srcObject = null;
        videoRef.current.pause();
        videoRef.current.load(); // Forzar recarga del elemento video
      } catch (e) {
        console.warn('Error al limpiar video element:', e);
      }
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

  const getTotal = () => {
    return scannedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-[9999]">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => {
            setIsScannerOpen(false);
            onClose();
          }}
          className="w-10 h-10 flex items-center justify-center active:opacity-70 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <h3 className="text-xl font-bold text-white">SCANEER</h3>
        <div className="w-10"></div> {/* Spacer para centrar */}
      </div>

      {/* Vista de cámara - Ocupa más espacio, se ajusta cuando hay productos */}
      <div className={`relative bg-black ${continuousMode && scannedProducts.length > 0 ? 'flex-1 min-h-[40vh]' : 'flex-1'}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Scanning Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border-2 border-green-500 bg-transparent rounded-lg p-8">
            <div className="w-64 h-40 border-2 border-dashed border-green-400 rounded flex items-center justify-center">
              <Scan className="w-10 h-10 text-green-500 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Scanning Status */}
        {isScanning && (
          <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
            Escaneando...
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border-2 border-red-300 rounded-lg p-4 max-w-md mx-4">
            <p className="text-red-700 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-sm font-medium text-gray-800 mb-1">Coloca un código de barras para escanear</p>
            {continuousMode && (
              <p className="text-xs text-gray-600">Puedes escanear múltiples productos seguidos</p>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Productos Escaneados (solo en modo continuo) - Scrollable */}
      {continuousMode && scannedProducts.length > 0 && (
        <div className="bg-white border-t border-gray-200 flex-shrink-0">
          <div className="max-h-[40vh] overflow-y-auto">
            <div className="p-4 space-y-3">
              {scannedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl p-4 shadow-md border border-purple-100"
                >
                  <div className="flex items-center space-x-4">
                    {/* Imagen del producto */}
                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-purple-100">
                      {product.image && product.image !== '/assets/images/products/default-product.jpg' ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {product.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Información del producto */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1.5 truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 flex items-center whitespace-nowrap">
                          <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                          {product.stock} disponibles
                        </span>
                      </div>
                      <p className="text-lg font-bold text-purple-600">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Controles de cantidad */}
                    {onUpdateQuantity && (
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => onUpdateQuantity(product.id, -1)}
                          disabled={product.quantity <= 1}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                            product.quantity <= 1
                              ? 'bg-gray-100 text-gray-400'
                              : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md'
                          }`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-bold text-gray-900 text-lg">
                          {product.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(product.id, 1)}
                          className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer con resumen y botón Finalizar */}
      {continuousMode && (
        <div className="bg-white border-t border-gray-200">
          {/* Resumen */}
          <div className="px-6 py-3 flex items-center justify-between border-b border-gray-100">
            <span className="text-sm text-gray-600 font-medium">Añadir productos</span>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-purple-600">
                ${getTotal().toFixed(2)}
              </span>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          {/* Botón Finalizar */}
          <div className="px-4 py-4">
            <button
              onClick={() => {
                setIsScannerOpen(false);
                if (onFinish) {
                  onFinish();
                } else {
                  onClose();
                }
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg text-sm uppercase"
            >
              FINALIZAR {scannedProducts.length} PRODUCTO{scannedProducts.length !== 1 ? 'S' : ''} ESCANEADO{scannedProducts.length !== 1 ? 'S' : ''}
            </button>
          </div>
        </div>
      )}

      {/* Botón Cancelar (si no es modo continuo) */}
      {!continuousMode && (
        <div className="bg-white border-t border-gray-200 p-4">
          <button
            onClick={() => {
              setIsScannerOpen(false);
              onClose();
            }}
            className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            type="button"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;