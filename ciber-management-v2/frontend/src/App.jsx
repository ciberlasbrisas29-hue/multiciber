import React, { useEffect, useRef, memo } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';

// Flag global para evitar doble renderizado
let appContentRenderCount = 0;

// Componente principal de la aplicación - versión ultra optimizada
const AppContent = memo(() => {
  const { isAuthenticated, isLoading } = useAuth();
  const hasRendered = useRef(false);

  useEffect(() => {
    if (hasRendered.current) return;
    hasRendered.current = true;
    
    console.log('🚀 AppContent useEffect ejecutándose', new Date().toISOString());
  }, []);

  appContentRenderCount++;
  console.log('🔄 AppContent renderizando', { 
    renderCount: appContentRenderCount,
    isLoading, 
    isAuthenticated
  });

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Renderizar según el estado de autenticación
  if (isAuthenticated) {
    return <Dashboard />;
  } else {
    return <Login />;
  }
});

// Componente raíz con providers - también memoizado
const App = memo(() => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
});

export default App;