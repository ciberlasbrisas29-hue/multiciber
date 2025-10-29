import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Limpiar errores al cambiar los inputs
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        navigate('/');
      }
    } catch (error) {
      console.error('Error en login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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
    <div className="login-container">
      {/* Panel izquierdo - Formulario */}
      <section className="login-section">
        <div className="login-wrapper">
          {/* Logo */}
          <div className="login-logo">
            <img 
              src="/assets/images/logo.png" 
              alt="Multiciber Las Brisas" 
              onError={(e) => {
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
              <span>Usuario</span>
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
                <span>Contraseña</span>
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
      <section className="wallpaper">
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
};

export default Login;
