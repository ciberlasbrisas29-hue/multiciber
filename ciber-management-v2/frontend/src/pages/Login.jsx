import React, { useState, useEffect, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Flag global para evitar doble renderizado
let loginRenderCount = 0;

const Login = memo(() => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, error, clearError } = useAuth();
  
  // Debug: Log del error (solo en desarrollo)
  useEffect(() => {
    if (error && process.env.NODE_ENV === 'development') {
      console.log('🔴 Error en Login:', error);
    }
  }, [error]);

  // Debug: Log cuando el componente se monta
  loginRenderCount++;
  // Solo log en desarrollo y las primeras veces
  if (process.env.NODE_ENV === 'development' && loginRenderCount <= 3) {
    console.log('🔵 Login component mounted', { 
      renderCount: loginRenderCount,
      timestamp: new Date().toISOString() 
    });
  }

  // Limpiar errores solo cuando el usuario empiece a escribir
  useEffect(() => {
    if (error && (formData.username || formData.password)) {
      clearError();
    }
  }, [formData.username, formData.password, error, clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Solo mostrar loading si no está ya en loading
    if (!isLoading) {
      setIsLoading(true);
    }

    try {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Login exitoso');
        }
        // No necesitamos navegar, el App.jsx se encarga de renderizar Dashboard
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Login fallido:', result.error);
        }
        // El error ya se maneja en el contexto de autenticación
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error en login:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Efecto para aplicar estilos responsive
  React.useEffect(() => {
    const applyResponsiveStyles = () => {
      const loginContainer = document.querySelector('.login-container');
      const loginSection = document.querySelector('.login-section');
      const wallpaper = document.querySelector('.wallpaper');
      
      if (loginContainer && loginSection && wallpaper) {
        const width = window.innerWidth;
        
        if (width <= 768) {
          // Mobile
          loginContainer.style.flexDirection = 'column';
          loginSection.style.maxWidth = '100%';
          loginSection.style.minWidth = 'auto';
          loginSection.style.flex = '1';
          loginSection.style.padding = '1.5rem 1rem';
          wallpaper.style.height = '300px';
          wallpaper.style.flex = 'none';
          wallpaper.style.order = '2';
        } else if (width <= 1024) {
          // Tablet
          loginContainer.style.flexDirection = 'row';
          loginSection.style.maxWidth = '45%';
          loginSection.style.minWidth = '350px';
          loginSection.style.flex = '0 0 45%';
          loginSection.style.padding = '2rem 1.5rem';
          wallpaper.style.height = '100vh';
          wallpaper.style.flex = '1';
          wallpaper.style.order = 'unset';
        } else {
          // Desktop
          loginContainer.style.flexDirection = 'row';
          loginSection.style.maxWidth = '40%';
          loginSection.style.minWidth = '400px';
          loginSection.style.flex = '0 0 40%';
          loginSection.style.padding = '3rem 2rem';
          wallpaper.style.height = '100vh';
          wallpaper.style.flex = '1';
          wallpaper.style.order = 'unset';
        }
      }
    };
    
    applyResponsiveStyles();
    window.addEventListener('resize', applyResponsiveStyles);
    
    return () => {
      window.removeEventListener('resize', applyResponsiveStyles);
    };
  }, []);

  // Efecto para manejar las animaciones de labels flotantes
  React.useEffect(() => {
    const inputs = document.querySelectorAll('.login-input');
    const button = document.querySelector('.login-button');

    const updateLabel = (input) => {
      const span = input.previousElementSibling;
      if (span) {
        const shouldBeActive = input.value !== '' || input === document.activeElement;
        
        if (shouldBeActive) {
          span.classList.add('span-active');
        } else {
          span.classList.remove('span-active');
        }
      }
    };

    const handleFocus = (e) => {
      updateLabel(e.target);
    };

    const handleBlur = (e) => {
      updateLabel(e.target);
    };

    const handleInput = (e) => {
      updateLabel(e.target);
      
      // Actualizar estado del botón
      const [username, password] = inputs;
      if (username && password && button) {
        if (username.value && password.value.length >= 6) {
          button.removeAttribute('disabled');
        } else {
          button.setAttribute('disabled', '');
        }
      }
    };

    // Agregar event listeners
    inputs.forEach((input) => {
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
      input.addEventListener('input', handleInput);
    });

    // Auto-focus en el campo de usuario
    if (inputs.length > 0) {
      inputs[0].focus();
    }

    // Limpiar event listeners al desmontar
    return () => {
      inputs.forEach((input) => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
        input.removeEventListener('input', handleInput);
      });
    };
  }, []);

  return (
    <div 
      className="login-container"
      style={{
        height: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        display: 'flex',
        background: 'linear-gradient(135deg, #2c5f5f 0%, #4a9d9d 100%)'
      }}
    >
      {/* Panel izquierdo - Formulario */}
      <section 
        className="login-section"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '500px',
          minWidth: '400px',
          height: '100vh',
          padding: 'clamp(20px, 5%, 50px)',
          background: '#FFF',
          flex: '0 0 40%',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        <div className="login-wrapper">
          {/* Logo */}
          <div className="login-logo">
            <img 
              src="/assets/images/logo.png" 
              alt="Multiciber Las Brisas" 
              onError={(e) => {
                console.log('Error cargando logo:', e.target.src);
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <i className="fas fa-desktop" style={{display: 'none'}}></i>
          </div>

          <h1 className="login-title">Multiciber Las Brisas</h1>
          <p className="login-subtitle">Sistema de Gestión Integral</p>

          {/* Error */}
          {error && (
            <div className="alert">
              <i className="fas fa-exclamation-triangle" style={{marginRight: '8px'}}></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Usuario */}
            <label className="login-label">
              <span className="desktop-label">Usuario</span>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="login-input"
                required
              />
            </label>

            {/* Contraseña */}
            <div className="password-input-container">
              <label className="login-label">
                <span className="desktop-label">Contraseña</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="login-input"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </label>
            </div>
          </form>
        </div>

        <div className="login-wrapper">
          {/* Botón de login */}
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !formData.username || formData.password.length < 6}
            className="login-button"
            style={{
              transform: isLoading ? 'scale(0.95)' : 'scale(1)',
              transition: 'all 0.3s ease'
            }}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                <path d="M438.6 278.6l-160 160C272.4 444.9 264.2 448 256 448s-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L338.8 288H32C14.33 288 .0016 273.7 .0016 256S14.33 224 32 224h306.8l-105.4-105.4c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160C451.1 245.9 451.1 266.1 438.6 278.6z"/>
              </svg>
            )}
          </button>

          {/* Enlace de recuperación */}
          <a href="#" className="login-link">¿Olvidaste tu contraseña?</a>
        </div>
      </section>

      {/* Panel derecho - Características */}
      <section 
        className="wallpaper"
        style={{
          width: '100%',
          height: '100vh',
          background: 'linear-gradient(135deg, #2c5f5f, #4a9d9d)',
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(255, 193, 7, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 193, 7, 0.1) 0%, transparent 50%)
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          minWidth: 0,
          boxSizing: 'border-box'
        }}
      >
        <div className="wallpaper-content">
          <h1>Bienvenido</h1>
          <p>Gestiona tu ciber de manera profesional</p>
          
          <div className="features-list">
            <div className="feature-item" style={{animationDelay: '0.1s'}}>
              <i className="fas fa-chart-line"></i>
              <span>Control de ventas y gastos</span>
            </div>
            <div className="feature-item" style={{animationDelay: '0.2s'}}>
              <i className="fas fa-boxes"></i>
              <span>Gestión de inventario</span>
            </div>
            <div className="feature-item" style={{animationDelay: '0.3s'}}>
              <i className="fas fa-file-pdf"></i>
              <span>Reportes en PDF</span>
            </div>
            <div className="feature-item" style={{animationDelay: '0.4s'}}>
              <i className="fas fa-users"></i>
              <span>Gestión de empleados</span>
            </div>
            <div className="feature-item" style={{animationDelay: '0.5s'}}>
              <i className="fas fa-mobile-alt"></i>
              <span>Acceso desde móvil</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});

export default Login;
