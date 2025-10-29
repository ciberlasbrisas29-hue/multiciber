import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NewSaleModal from '../components/NewSaleModal';
import SelectProducts from './SelectProducts';
import NewSale from './NewSale';
import Balance from './Balance';
import Debts from './Debts';
import Inventory from './Inventory';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [showSelectProducts, setShowSelectProducts] = useState(false);
  const [showNewSale, setShowNewSale] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [showDebts, setShowDebts] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  const handleOpenNewSaleModal = () => {
    setIsNewSaleModalOpen(true);
  };

  const handleCloseNewSaleModal = () => {
    setIsNewSaleModalOpen(false);
  };

  const handleSelectProductSale = () => {
    console.log('Venta de productos seleccionada');
    setIsNewSaleModalOpen(false);
    setShowSelectProducts(true);
  };

  const handleSelectFreeSale = () => {
    console.log('Venta libre seleccionada');
    setIsNewSaleModalOpen(false);
    setShowNewSale(true);
  };

  const handleBackFromProducts = () => {
    setShowSelectProducts(false);
  };

  const handleCreateProduct = () => {
    console.log('Crear producto');
    // Aquí irías a la página de crear producto
  };

  const handleNavigate = (view) => {
    // Resetear todas las vistas
    setShowBalance(false);
    setShowDebts(false);
    setShowInventory(false);
    setShowSelectProducts(false);
    setShowNewSale(false);
    setIsNewSaleModalOpen(false);

    // Mostrar la vista seleccionada
    switch (view) {
      case 'home':
        // Ya está en home por defecto
        break;
      case 'balance':
        setShowBalance(true);
        break;
      case 'debts':
        setShowDebts(true);
        break;
      case 'inventory':
        setShowInventory(true);
        break;
      default:
        break;
    }
  };

  const handleCreateFreeSale = () => {
    console.log('Crear venta libre');
    setShowSelectProducts(false);
    setShowNewSale(true);
  };

  const handleBackFromNewSale = () => {
    setShowNewSale(false);
  };

  const handleSaveSale = (saleData) => {
    console.log('Guardando venta:', saleData);
    // Aquí guardarías la venta en la base de datos
    setShowNewSale(false);
  };

  const handleShowBalance = () => {
    setShowBalance(true);
  };

  const handleBackFromBalance = () => {
    setShowBalance(false);
  };

  const handleNewExpense = () => {
    console.log('Nuevo gasto');
    // Aquí irías a la página de nuevo gasto
  };

  const handleShowDebts = () => {
    setShowDebts(true);
  };

  const handleBackFromDebts = () => {
    setShowDebts(false);
  };

  const handleShowInventory = () => {
    setShowInventory(true);
  };

  const handleBackFromInventory = () => {
    setShowInventory(false);
  };

  const handleLogout = () => {
    logout();
  };

  // Si se debe mostrar la vista de selección de productos
  if (showSelectProducts) {
    return (
      <SelectProducts
        onBack={handleBackFromProducts}
        onCreateProduct={handleCreateProduct}
        onCreateFreeSale={handleCreateFreeSale}
      />
    );
  }

  // Si se debe mostrar la vista de nueva venta
  if (showNewSale) {
    return (
      <NewSale
        onBack={handleBackFromNewSale}
        onSaveSale={handleSaveSale}
      />
    );
  }

  // Si se debe mostrar la vista de Balance
  if (showBalance) {
    return (
      <Balance
        onBack={handleBackFromBalance}
        onNewSale={handleOpenNewSaleModal}
        onNewExpense={handleNewExpense}
        onNavigate={handleNavigate}
      />
    );
  }

  // Si se debe mostrar la vista de Deudas
  if (showDebts) {
    return (
      <Debts
        onBack={handleBackFromDebts}
        onNewSale={handleOpenNewSaleModal}
        onNewExpense={handleNewExpense}
        onNavigate={handleNavigate}
      />
    );
  }

  // Si se debe mostrar la vista de Inventario
  if (showInventory) {
    return (
      <Inventory
        onBack={handleBackFromInventory}
        onCreateProduct={handleCreateProduct}
        onNavigate={handleNavigate}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa', paddingBottom: '80px', paddingTop: '0' }}>
      {/* Navbar Desktop */}
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            <img src="/assets/images/logo.png" alt="Multiciber Las Brisas" className="navbar-logo" />
            Ciber Las Brisas
          </a>
          
                 <div className="navbar-nav me-auto">
                   <a className="nav-link active" href="#" onClick={(e) => { e.preventDefault(); setShowBalance(false); setShowDebts(false); }}>
                     <i className="fas fa-home"></i> Home
                   </a>
                   <a className="nav-link" href="#" onClick={(e) => { e.preventDefault(); handleShowBalance(); setShowDebts(false); }}>
                     <i className="fas fa-file-alt"></i> Balance
                   </a>
                   <a className="nav-link" href="#" onClick={(e) => { e.preventDefault(); handleShowDebts(); setShowBalance(false); }}>
                     <i className="fas fa-percentage"></i> Deudas
                   </a>
                 </div>
          
          <div className="navbar-nav">
            <div className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown">
                <i className="fas fa-user"></i> Administrador
              </a>
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="#"><i className="fas fa-user-edit"></i> Perfil</a></li>
                <li><a className="dropdown-item" href="#"><i className="fas fa-cog"></i> Configuración</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item" href="#" onClick={logout}><i className="fas fa-sign-out-alt"></i> Cerrar Sesión</a></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* Header estilo Treinta */}
      <div className="header-section">
        <div className="header-content">
          <div className="user-info">
            <div className="user-avatar">
              <img src="/assets/images/logo.png" alt="Multiciber Las Brisas" />
            </div>
            <div className="user-details">
              <h4>Multiciber Las Brisas <i className="fas fa-chevron-down"></i></h4>
              <p>Propietario</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="action-btn">
              <i className="fas fa-question"></i>
            </button>
            <button className="action-btn">
              <i className="fas fa-bell"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div className="quick-access-section">
        <h2 className="section-title">Accesos rápidos</h2>
        <div className="quick-access-grid">
          <div className="quick-access-card primary" onClick={handleOpenNewSaleModal}>
            <i className="fas fa-chart-line"></i>
            <h5>Registrar</h5>
            <p>Venta</p>
          </div>
          <div className="quick-access-card">
            <i className="fas fa-chart-line" style={{ color: '#ffc107' }}></i>
            <h5>Registrar</h5>
            <p>Gasto</p>
          </div>
          <div className="quick-access-card">
            <i className="fas fa-boxes" style={{ color: '#2c5f5f' }}></i>
            <h5>Ver</h5>
            <p>Inventario</p>
          </div>
        </div>
      </div>


      {/* Estadísticas */}
      <div className="stats-section">
        <div className="stats-header">
          <h2 className="stats-title">
            <i className="fas fa-chart-bar"></i>
            Estadísticas del Día
          </h2>
        </div>
        <p className="stats-description">Resumen de ventas y productos más vendidos.</p>
        
        <div className="stats-cards">
          <div className="stats-card">
            <h5>Producto Estrella</h5>
            <div className="stats-content">
              <div className="product-info">
                <i className="fas fa-star" style={{ color: '#ffc107', fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
                <h4>Tiempo de Internet</h4>
                <p>15 ventas hoy</p>
              </div>
            </div>
          </div>
          <div className="stats-card">
            <h5>Ganancias del Día</h5>
            <div className="stats-content">
              <div className="earnings-info">
                <i className="fas fa-dollar-sign" style={{ color: '#28a745', fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
                <h4>$1,250.00</h4>
                <p>+12% vs ayer</p>
              </div>
            </div>
          </div>
          <div className="stats-card">
            <h5>Clientes Atendidos</h5>
            <div className="stats-content">
              <div className="customers-info">
                <i className="fas fa-users" style={{ color: '#2c5f5f', fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
                <h4>28</h4>
                <p>clientes hoy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

             {/* Navegación Inferior */}
             <div className="bottom-nav">
               <a href="#" className="nav-item active" onClick={(e) => { e.preventDefault(); setShowBalance(false); setShowDebts(false); setShowInventory(false); }}>
                 <i className="fas fa-home"></i>
                 <span>Home</span>
               </a>
               <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); handleShowBalance(); setShowDebts(false); setShowInventory(false); }}>
                 <i className="fas fa-file-alt"></i>
                 <span>Balance</span>
               </a>
               <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); handleShowDebts(); setShowBalance(false); setShowInventory(false); }}>
                 <i className="fas fa-percentage"></i>
                 <span>Deudas</span>
               </a>
               <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); handleShowInventory(); setShowBalance(false); setShowDebts(false); }}>
                 <i className="fas fa-boxes"></i>
                 <span>Inventario</span>
               </a>
             </div>

      {/* Modal de Nueva Venta */}
      <NewSaleModal
        isOpen={isNewSaleModalOpen}
        onClose={handleCloseNewSaleModal}
        onSelectProductSale={handleSelectProductSale}
        onSelectFreeSale={handleSelectFreeSale}
      />
    </div>
  );
};

export default Dashboard;