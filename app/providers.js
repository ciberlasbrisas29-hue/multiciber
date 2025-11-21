"use client";

import { AuthProvider } from "../contexts/AuthContext";
import RouteGuard from "../components/RouteGuard";

export function Providers({ children }) {
  return (
    <AuthProvider>
      <RouteGuard>
        {children}
      </RouteGuard>
    </AuthProvider>
  );
}
