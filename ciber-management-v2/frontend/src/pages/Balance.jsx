import React, { useState } from 'react';

const Balance = ({ onBack, onNewSale, onNewExpense, onNavigate }) => {
  const [selectedDate, setSelectedDate] = useState('28 oct');
  const [activeTab, setActiveTab] = useState('ingresos'); // 'ingresos' o 'egresos'

  const dates = ['25 oct', '26 oct', '27 oct', '28 oct', '29 oct', '30 oct', '31 oct'];

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="balance-page">
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
            <button className="action-btn">
              <i className="fas fa-filter"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Selector de fechas */}
      <div className="date-selector">
        <div className="date-scroll">
          {dates.map((date) => (
            <button
              key={date}
              className={`date-button ${selectedDate === date ? 'active' : ''}`}
              onClick={() => handleDateSelect(date)}
            >
              {date}
            </button>
          ))}
        </div>
        <button className="calendar-button">
          <i className="fas fa-calendar"></i>
        </button>
      </div>

      {/* Tarjeta de Balance */}
      <div className="balance-card">
        <div className="balance-header">
          <h3>Balance</h3>
          <span className="balance-amount">$0</span>
        </div>
        
        <div className="balance-summary">
          <div className="summary-item">
            <div className="summary-icon income">
              <i className="fas fa-arrow-up"></i>
            </div>
            <div className="summary-content">
              <span className="summary-label">Ingresos</span>
              <span className="summary-value">$0</span>
            </div>
          </div>
          
          <div className="summary-item">
            <div className="summary-icon expense">
              <i className="fas fa-check"></i>
            </div>
            <div className="summary-content">
              <span className="summary-label">Egresos</span>
              <span className="summary-value">$0</span>
            </div>
          </div>
        </div>

        <div className="balance-actions">
          <button className="action-link">Descargar Reportes</button>
          <button className="action-link">Ver Balance <i className="fas fa-chevron-right"></i></button>
        </div>
      </div>

      {/* Tabs de Ingresos/Egresos */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'ingresos' ? 'active' : ''}`}
            onClick={() => handleTabChange('ingresos')}
          >
            Ingresos
          </button>
          <button 
            className={`tab ${activeTab === 'egresos' ? 'active' : ''}`}
            onClick={() => handleTabChange('egresos')}
          >
            Egresos
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="balance-content">
        {/* Estado vacío */}
        <div className="empty-state">
          <div className="empty-illustration">
            <i className="fas fa-hourglass-half"></i>
            <i className="fas fa-coins"></i>
          </div>
          <h3>No tienes registros creados en esta fecha.</h3>
        </div>
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
        <a href="#" className="nav-item active">
          <i className="fas fa-file-alt"></i>
          <span>Balance</span>
        </a>
        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); onNavigate('debts'); }}>
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

export default Balance;
