"use client";

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  duration = 3000 
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }[type];

  const Icon = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  }[type];

  return (
    <div className={`${bgColor} text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center space-x-3 min-w-[300px] max-w-[90vw] animate-slide-down`}>
      <Icon className="w-6 h-6 flex-shrink-0" />
      <p className="flex-1 font-medium">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:bg-white/20 rounded-full p-1 transition-colors"
        aria-label="Cerrar notificación"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;

