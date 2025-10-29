import React from 'react';

const Inventory = ({ onBack, onCreateProduct, onNavigate }) => {
  return (
    <div className="inventory-page">
      {/* Header estilo Treinta */}
      <div className="header-section">
        <div className="header-content">
          <div className="user-info">
            <div className="user-avatar">
              <img src="/assets/images/logo.png" alt="Multiciber Las Brisas" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
              <i className="fas fa-user" style={{ display: 'none' }}></i>
            </div>
            <div className="user-details">
              <h4>Multiciber Las Brisas <i className="fas fa-chevron-down"></i></h4>
              <p>Propietario</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="action-btn">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="inventory-content">
        {/* Estado vacío */}
        <div className="empty-state">
          <div className="empty-illustration">
            <img 
              src="/assets/images/inventory-empty.png" 
              alt="No hay productos creados" 
              className="inventory-illustration"
            />
          </div>
          <h3>Aún no tienes productos creados</h3>
          <p>Empieza agregando uno en el botón "Crear producto".</p>
          <button className="create-product-btn" onClick={onCreateProduct}>
            Crear producto
          </button>
        </div>
      </div>

      {/* Navegación inferior */}
      <div className="bottom-nav">
        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>
          <i className="fas fa-home"></i>
          <span>Home</span>
        </a>
        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); onNavigate('balance'); }}>
          <i className="fas fa-file-alt"></i>
          <span>Balance</span>
        </a>
        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); onNavigate('debts'); }}>
          <i className="fas fa-percentage"></i>
          <span>Deudas</span>
        </a>
        <a href="#" className="nav-item active">
          <i className="fas fa-boxes"></i>
          <span>Inventario</span>
        </a>
      </div>
    </div>
  );
};

export default Inventory;
