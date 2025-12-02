"use client";

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { X, Camera, Scan, Plus, Minus, Check, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { useScanner } from '@/contexts/ScannerContext';
import SwipeableProductCard from './SwipeableProductCard';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
  continuousMode?: boolean; // Modo continuo: no se cierra después de escanear
  scannedProducts?: Array<{ id: string; name: string; quantity: number; price: number; image?: string; stock: number }>; // Productos escaneados
  onUpdateQuantity?: (productId: string, change: number) => void; // Callback para actualizar cantidad
  onRemoveProduct?: (productId: string) => void; // Callback para eliminar producto
  onFinish?: () => void; // Callback para finalizar escaneo
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onScan, 
  onClose, 
  isOpen, 
  continuousMode = false,
  scannedProducts = [],
  onUpdateQuantity,
  onRemoveProduct,
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
  const processingCodesRef = useRef<Set<string>>(new Set()); // Set de códigos que están siendo procesados
  const SCAN_COOLDOWN = 5000; // 5 segundos de cooldown entre escaneos del mismo código
  const productsListRef = useRef<HTMLDivElement>(null); // Ref para el contenedor de productos (auto-scroll)
  const [isExpanded, setIsExpanded] = useState(false); // Estado para controlar expansión/colapso del stack

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
      // Limpiar los Sets de códigos cuando se cierra el escáner
      scannedCodesSetRef.current.clear();
      processingCodesRef.current.clear();
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
              
              // Verificar si este código ya fue escaneado exitosamente en esta sesión (permanente)
              if (scannedCodesSetRef.current.has(normalizedBarcode)) {
                // Ignorar escaneo de código ya procesado - NO llamar al callback
                console.log('Código de barras ya escaneado en esta sesión, ignorado');
                return; // Salir sin procesar - el escáner continúa funcionando
              }
              
              // Verificar si este código está siendo procesado actualmente
              if (processingCodesRef.current.has(normalizedBarcode)) {
                // Ignorar escaneo duplicado mientras se procesa
                console.log('Código de barras ya está siendo procesado, ignorado');
                return; // Salir sin procesar - el escáner continúa funcionando
              }
              
              // Verificar si es el mismo código escaneado recientemente (dentro del cooldown)
              const isSameCode = lastScannedCodeRef.current === normalizedBarcode;
              const timeSinceLastScan = currentTime - lastScanTimeRef.current;
              
              if (isSameCode && timeSinceLastScan < SCAN_COOLDOWN) {
                // Ignorar escaneo repetido del mismo código - NO llamar al callback
                console.log('Escaneo repetido ignorado (cooldown activo)');
                return; // Salir sin procesar - el escáner continúa funcionando
              }
              
              // Marcar como "procesando" para prevenir múltiples llamadas simultáneas
              processingCodesRef.current.add(normalizedBarcode);
              
              // Limpiar el código del Set de "procesando" después de 3 segundos (timeout de seguridad)
              setTimeout(() => {
                processingCodesRef.current.delete(normalizedBarcode);
              }, 3000);
              
              // Actualizar referencias del último escaneo (antes de procesar)
              lastScannedCodeRef.current = normalizedBarcode;
              lastScanTimeRef.current = currentTime;
              
              console.log('Barcode scanned:', scannedText);
              
              // Reproducir beep cuando se detecta un código
              playBeep();
              
              // Llamar al callback - el handler decidirá si marcar el código en scannedCodesSetRef
              // Si el handler es exitoso, marcará el código. Si falla, no lo marcará y podrá escanearse de nuevo
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

  const getTotal = () => {
    return scannedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  };

  // Auto-scroll cuando se agrega un producto
  // IMPORTANTE: Este hook debe estar antes del return condicional para cumplir con las reglas de Hooks
  useEffect(() => {
    if (continuousMode && scannedProducts.length > 0 && productsListRef.current && isOpen) {
      // Scroll suave hacia abajo cuando se agrega un producto
      setTimeout(() => {
        if (productsListRef.current) {
          productsListRef.current.scrollTo({
            top: productsListRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [scannedProducts.length, continuousMode, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-[9999]">
      {/* Estilos para animación estilo iOS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInFromTop {
          from {
            transform: translateY(-30px) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes stackCollapse {
          from {
            transform: translateY(0) scale(1);
          }
          to {
            transform: translateY(8px) scale(0.97);
          }
        }
        @keyframes expandList {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}} />
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

      {/* Lista de Productos Escaneados (solo en modo continuo) - Apilado estilo iOS */}
      {continuousMode && scannedProducts.length > 0 && (
        <>
          {/* Overlay para cerrar cuando está expandido */}
          {isExpanded && (
            <div 
              className="fixed inset-0 bg-black/20 z-[9998]"
              onClick={() => setIsExpanded(false)}
            />
          )}
          <div className="bg-white border-t border-gray-200 flex-shrink-0 relative z-[9999] shadow-lg">
            <div ref={productsListRef} className={`overflow-y-auto overflow-x-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-[60vh]' : 'max-h-[40vh]'}`}>
              <div className="p-4 relative">
                {!isExpanded ? (
                /* Modo Stack Apilado - Solo mostrar el último producto completo */
                <div className="relative" style={{ minHeight: `${Math.min(scannedProducts.length, 4) * 14 + 120}px` }}>
                  {scannedProducts.slice(-4).map((product, sliceIndex) => {
                    const startIndex = Math.max(0, scannedProducts.length - 4);
                    const realIndex = startIndex + sliceIndex;
                    const reverseIndex = scannedProducts.length - 1 - realIndex;
                    
                    if (reverseIndex < 0 || reverseIndex > 3) return null;
                    
                    const offset = reverseIndex * 14; // Más compacto: 14px en lugar de 16px
                    const zIndex = reverseIndex + 10;
                    const scale = Math.max(1 - (reverseIndex * 0.05), 0.85); // Más diferencia de escala
                    // El último producto (reverseIndex === 0) debe tener opacidad 1.0, los demás progresivamente menos
                    const opacity = reverseIndex === 0 ? 1.0 : Math.max(1 - (reverseIndex * 0.2), 0.3);
                    const isNewest = reverseIndex === 0; // Solo el más reciente (reverseIndex 0)
                    
                    return (
                      <div
                        key={`${product.id}-${realIndex}`}
                        className={`absolute left-4 right-4 transition-all duration-500 ease-out ${
                          isNewest ? 'cursor-pointer' : ''
                        }`}
                        style={{
                          top: `${offset}px`,
                          zIndex: zIndex,
                          transform: `scale(${scale}) translateY(${reverseIndex > 0 ? reverseIndex * 1.5 : 0}px)`,
                          opacity: opacity,
                          animation: isNewest ? 'slideInFromTop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                          pointerEvents: reverseIndex > 2 ? 'none' : (isNewest ? 'auto' : 'none'), // Solo el más reciente es clickeable
                          transformOrigin: 'top center',
                          willChange: 'transform, opacity'
                        }}
                        onClick={(e) => {
                          // Solo el último producto (reverseIndex === 0) puede expandir, y solo si no se hace click en los botones
                          if (isNewest && !(e.target as HTMLElement).closest('button')) {
                            e.stopPropagation();
                            setIsExpanded(true);
                          }
                        }}
                      >
                        <SwipeableProductCard
                          product={product}
                          onUpdateQuantity={onUpdateQuantity}
                          onRemove={onRemoveProduct}
                        />
                      </div>
                    );
                  })}
                  
                  {/* Indicador de más productos si hay más de 4 */}
                  {scannedProducts.length > 4 && (
                    <div 
                      className="absolute left-4 right-4"
                      style={{
                        top: `${Math.min(scannedProducts.length, 4) * 14 + 16}px`,
                        zIndex: 5,
                        pointerEvents: 'none'
                      }}
                    >
                      <div className="bg-gray-50 rounded-xl p-2 text-center border border-dashed border-gray-300">
                        <p className="text-xs font-medium text-gray-500">
                          +{scannedProducts.length - 4} producto{scannedProducts.length - 4 !== 1 ? 's' : ''} más
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Modo Lista Expandida */
                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                    <h3 className="text-base font-bold text-gray-900">Productos escaneados ({scannedProducts.length})</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(false);
                      }}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95 shadow-sm"
                      title="Colapsar"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {scannedProducts.map((product, index) => (
                      <div
                        key={`${product.id}-expanded-${index}`}
                        style={{
                          animation: `expandList 0.3s ease-out ${index * 0.03}s both`
                        }}
                      >
                        <SwipeableProductCard
                          product={product}
                          onUpdateQuantity={onUpdateQuantity}
                          onRemove={onRemoveProduct}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </>
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