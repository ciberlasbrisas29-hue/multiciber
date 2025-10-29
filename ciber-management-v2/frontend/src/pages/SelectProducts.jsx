import React from 'react';

const SelectProducts = ({ onBack, onCreateProduct, onCreateFreeSale }) => {
  return (
    <div className="select-products-page">
      {/* Header */}
      <div className="select-products-header">
        <button className="back-button" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="page-title">Seleccionar productos</h1>
        <div className="header-actions">
          <button className="action-button">
            <i className="fas fa-search"></i>
          </button>
          <button className="action-button">
            <i className="fas fa-barcode"></i>
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="select-products-content">
        {/* Ilustración */}
        <div className="empty-state">
          <div className="empty-illustration">
            <div className="box-icon">
              <i className="fas fa-box"></i>
            </div>
            <div className="warning-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
          </div>
          
          {/* Mensaje */}
          <h2 className="empty-title">No tienes productos creados</h2>
          <p className="empty-description">
            Créalos para crear ventas o registra una venta sin productos.
          </p>

          {/* Botones de acción */}
          <div className="empty-actions">
            <button className="btn-primary" onClick={onCreateProduct}>
              Crear producto
            </button>
            <button className="btn-secondary" onClick={onCreateFreeSale}>
              Crear venta libre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectProducts;
