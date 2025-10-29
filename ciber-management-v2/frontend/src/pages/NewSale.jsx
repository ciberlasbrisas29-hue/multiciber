import React, { useState } from 'react';

const NewSale = ({ onBack, onSaveSale }) => {
  const [saleData, setSaleData] = useState({
    type: 'debt', // 'paid' o 'debt'
    date: 'hoy, 28 octubre',
    value: '',
    totalValue: 0,
    client: '',
    discountPercent: 0,
    discountAmount: 0,
    paymentMethod: 'cash', // 'cash', 'card', 'other', 'transfer'
    concept: ''
  });

  const handleInputChange = (field, value) => {
    setSaleData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePaymentMethodChange = (method) => {
    setSaleData(prev => ({
      ...prev,
      paymentMethod: method
    }));
  };

  const handleTypeChange = (type) => {
    setSaleData(prev => ({
      ...prev,
      type: type
    }));
  };

  const handleSave = () => {
    console.log('Guardando venta:', saleData);
    onSaveSale(saleData);
  };

  return (
    <div className="new-sale-page">
      {/* Header */}
      <div className="new-sale-header">
        <button className="back-button" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="page-title">Nueva venta</h1>
      </div>

      {/* Contenido principal */}
      <div className="new-sale-content">
        {/* Toggle de tipo de venta */}
        <div className="sale-type-toggle">
          <button 
            className={`toggle-button ${saleData.type === 'paid' ? 'active' : ''}`}
            onClick={() => handleTypeChange('paid')}
          >
            Pagado
          </button>
          <button 
            className={`toggle-button ${saleData.type === 'debt' ? 'active' : ''}`}
            onClick={() => handleTypeChange('debt')}
          >
            Deuda
          </button>
        </div>

        {/* Banner informativo para deuda */}
        {saleData.type === 'debt' && (
          <div className="debt-info-banner">
            <i className="fas fa-info-circle"></i>
            <span>Al finalizar te llevaremos a la sección 'Deudas'</span>
          </div>
        )}

        {/* Fecha de la venta */}
        <div className="form-group">
          <label className="form-label required">Fecha de la venta</label>
          <div className="input-group">
            <input 
              type="text" 
              className="form-input" 
              value={saleData.date}
              readOnly
            />
            <i className="fas fa-calendar input-icon"></i>
          </div>
        </div>

        {/* Valor */}
        <div className="form-group">
          <label className="form-label required">Valor</label>
          <div className="input-group">
            <input 
              type="number" 
              className="form-input" 
              value={saleData.value}
              onChange={(e) => handleInputChange('value', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        {/* Valor Total */}
        <div className="form-group">
          <label className="form-label">Valor Total</label>
          <div className="input-group">
            <input 
              type="text" 
              className="form-input" 
              value={`$${saleData.totalValue}`}
              readOnly
            />
          </div>
        </div>

        {/* Cliente */}
        <div className="form-group">
          <label className="form-label">Cliente</label>
          <div className="input-group">
            <input 
              type="text" 
              className="form-input" 
              value={saleData.client}
              onChange={(e) => handleInputChange('client', e.target.value)}
              placeholder="Selecciona un cliente"
            />
            <i className="fas fa-chevron-down input-icon"></i>
          </div>
        </div>

        {/* Descuento */}
        <div className="form-group">
          <label className="form-label">Descuento</label>
          <div className="discount-inputs">
            <div className="input-group">
              <input 
                type="number" 
                className="form-input" 
                value={saleData.discountPercent}
                onChange={(e) => handleInputChange('discountPercent', e.target.value)}
                placeholder="0%"
              />
            </div>
            <span className="equals-sign">=</span>
            <div className="input-group">
              <input 
                type="text" 
                className="form-input" 
                value={`$${saleData.discountAmount}`}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Método de pago */}
        <div className="form-group">
          <label className="form-label required">Método de pago</label>
          <div className="payment-methods">
            <button 
              className={`payment-method ${saleData.paymentMethod === 'cash' ? 'selected' : ''}`}
              onClick={() => handlePaymentMethodChange('cash')}
            >
              <i className="fas fa-wallet"></i>
              <span>Efectivo</span>
            </button>
            <button 
              className={`payment-method ${saleData.paymentMethod === 'card' ? 'selected' : ''}`}
              onClick={() => handlePaymentMethodChange('card')}
            >
              <i className="fas fa-credit-card"></i>
              <span>Tarjeta</span>
            </button>
            <button 
              className={`payment-method ${saleData.paymentMethod === 'other' ? 'selected' : ''}`}
              onClick={() => handlePaymentMethodChange('other')}
            >
              <i className="fas fa-ellipsis-h"></i>
              <span>Otro</span>
            </button>
            <button 
              className={`payment-method ${saleData.paymentMethod === 'transfer' ? 'selected' : ''}`}
              onClick={() => handlePaymentMethodChange('transfer')}
            >
              <i className="fas fa-university"></i>
              <span>Transferencia bancaria</span>
            </button>
          </div>
        </div>

        {/* Concepto */}
        <div className="form-group">
          <label className="form-label">Concepto</label>
          <div className="input-group">
            <input 
              type="text" 
              className="form-input" 
              value={saleData.concept}
              onChange={(e) => handleInputChange('concept', e.target.value)}
              placeholder="Dale un nombre a tu venta"
            />
          </div>
        </div>

        {/* Abono - Solo para deudas */}
        {saleData.type === 'debt' && (
          <div className="form-group">
            <label className="form-label">Abono</label>
            <div className="abono-button" onClick={() => console.log('Agregar abono')}>
              <i className="fas fa-camera"></i>
              <span>Agregar abono</span>
              <i className="fas fa-chevron-right"></i>
            </div>
          </div>
        )}
      </div>

      {/* Botón de crear venta */}
      <div className="create-sale-section">
        <button className="create-sale-button" onClick={handleSave}>
          <span>Crear venta</span>
          <div className="sale-total">
            <span>${saleData.totalValue}</span>
            <i className="fas fa-chevron-right"></i>
          </div>
        </button>
      </div>
    </div>
  );
};

export default NewSale;
