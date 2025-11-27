"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '@/components/Toast';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  toasts: ToastMessage[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: ToastMessage = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, toasts }}>
      {children}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[10000] pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto mb-2">
            <Toast
              message={toast.message}
              type={toast.type}
              isVisible={true}
              onClose={() => removeToast(toast.id)}
              duration={toast.duration}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

