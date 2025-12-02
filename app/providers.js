"use client";

import { AuthProvider } from "../contexts/AuthContext";
import { ScannerProvider } from "../contexts/ScannerContext";
import { ToastProvider } from "../contexts/ToastContext";
import RouteGuard from "../components/RouteGuard";

export function Providers({ children }) {
  return (
    <AuthProvider>
      <ScannerProvider>
        <ToastProvider>
        <RouteGuard>
          {children}
        </RouteGuard>
        </ToastProvider>
      </ScannerProvider>
    </AuthProvider>
  );
}
