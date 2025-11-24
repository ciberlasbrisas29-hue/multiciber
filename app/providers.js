"use client";

import { AuthProvider } from "../contexts/AuthContext";
import { ScannerProvider } from "../contexts/ScannerContext";
import RouteGuard from "../components/RouteGuard";

export function Providers({ children }) {
  return (
    <AuthProvider>
      <ScannerProvider>
        <RouteGuard>
          {children}
        </RouteGuard>
      </ScannerProvider>
    </AuthProvider>
  );
}
