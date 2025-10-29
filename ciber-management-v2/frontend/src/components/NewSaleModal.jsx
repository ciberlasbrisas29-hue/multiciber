import React from 'react';

const NewSaleModal = ({ isOpen, onClose, onSelectProductSale, onSelectFreeSale }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header del modal */}
        <div className="modal-header">
          <h2 className="modal-title">Nueva venta</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Instrucciones */}
        <p className="modal-instruction">
          Selecciona el tipo de venta que quieres hacer.
        </p>

        {/* Opciones de venta */}
        <div className="modal-options">
          {/* Venta de productos */}
          <div className="modal-option" onClick={onSelectProductSale}>
            <div className="option-icon">
              <i className="fas fa-shopping-basket"></i>
            </div>
            <div className="option-content">
              <h3 className="option-title">Venta de productos</h3>
              <p className="option-description">
                Registra una venta seleccionando los productos de tu inventario.
              </p>
            </div>
            <div className="option-arrow">
              <i className="fas fa-chevron-right"></i>
            </div>
          </div>

          {/* Venta libre */}
          <div className="modal-option" onClick={onSelectFreeSale}>
            <div className="option-icon">
              <i className="fas fa-money-bill-wave"></i>
            </div>
            <div className="option-content">
              <h3 className="option-title">Venta libre</h3>
              <p className="option-description">
                Registra un ingreso sin seleccionar productos de tu inventario.
              </p>
            </div>
            <div className="option-arrow">
              <i className="fas fa-chevron-right"></i>
            </div>
          </div>
        </div>

        {/* Indicador de swipe */}
        <div className="modal-indicator"></div>
      </div>
    </div>
  );
};

export default NewSaleModal;
