import React, { useState } from 'react';

const Debts = ({ onBack, onNewSale, onNewExpense, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('por-cobrar'); // 'por-cobrar' o 'por-pagar'

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="debts-page">
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

      {/* Tabs de Por cobrar/Por pagar */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'por-cobrar' ? 'active' : ''}`}
            onClick={() => handleTabChange('por-cobrar')}
          >
            Por cobrar
          </button>
          <button 
            className={`tab ${activeTab === 'por-pagar' ? 'active' : ''}`}
            onClick={() => handleTabChange('por-pagar')}
          >
            Por pagar
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="debts-content">
        {/* Estado vacío para Por cobrar */}
        {activeTab === 'por-cobrar' && (
          <div className="empty-state">
            <div className="empty-illustration">
              <img 
                src="/assets/images/icono-dollar.png" 
                alt="No hay deudas por cobrar" 
                className="debt-illustration"
              />
            </div>
            <h3>No tienes deudas por cobrar</h3>
            <p>Créalas en 'Nueva venta'</p>
          </div>
        )}

        {/* Estado vacío para Por pagar */}
        {activeTab === 'por-pagar' && (
          <div className="empty-state">
            <div className="empty-illustration">
              <img 
                src="/assets/images/icono-dollar.png" 
                alt="No hay deudas por pagar" 
                className="debt-illustration"
              />
            </div>
            <h3>No tienes deudas por pagar</h3>
            <p>Créalas en "Nueva gasto"</p>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="action-buttons">
        <button className="action-btn-primary" onClick={onNewSale}>
          <i className="fas fa-plus"></i>
          Nueva venta
        </button>
        <button className="action-btn-secondary" onClick={onNewExpense}>
          <i className="fas fa-minus"></i>
          Nuevo gasto
        </button>
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
        <a href="#" className="nav-item active">
          <i className="fas fa-percentage"></i>
          <span>Deudas</span>
        </a>
        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); onNavigate('inventory'); }}>
          <i className="fas fa-boxes"></i>
          <span>Inventario</span>
        </a>
      </div>
    </div>
  );
};

export default Debts;
