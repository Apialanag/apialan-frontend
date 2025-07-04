// src/components/CuponForm.jsx
import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './CuponForm.css'; // Crearemos este archivo para estilos

registerLocale('es', es);

function CuponForm({ initialData, onSubmit, onCancel, isLoading = false }) {
  const [formData, setFormData] = useState({
    codigo: '',
    tipo_descuento: 'porcentaje', // 'porcentaje' o 'fijo'
    valor_descuento: '', // number
    fecha_validez_desde: null, // Date object or null
    fecha_validez_hasta: null, // Date object or null
    usos_maximos: '', // number or '' for null
    monto_minimo_reserva_neto: '', // number or '' for null
    descripcion: '',
    activo: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        codigo: initialData.codigo || '',
        tipo_descuento: initialData.tipo_descuento || 'porcentaje',
        valor_descuento: initialData.valor_descuento || '',
        fecha_validez_desde: initialData.fecha_validez_desde ? new Date(initialData.fecha_validez_desde) : null,
        fecha_validez_hasta: initialData.fecha_validez_hasta ? new Date(initialData.fecha_validez_hasta) : null,
        usos_maximos: initialData.usos_maximos === null ? '' : initialData.usos_maximos || '',
        monto_minimo_reserva_neto: initialData.monto_minimo_reserva_neto === null ? '' : initialData.monto_minimo_reserva_neto || '',
        descripcion: initialData.descripcion || '',
        activo: initialData.activo === undefined ? true : initialData.activo,
      });
    } else {
      // Reset a estado inicial si no hay initialData (ej. para creación)
      setFormData({
        codigo: '',
        tipo_descuento: 'porcentaje',
        valor_descuento: '',
        fecha_validez_desde: null,
        fecha_validez_hasta: null,
        usos_maximos: '',
        monto_minimo_reserva_neto: '',
        descripcion: '',
        activo: true,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDateChange = (date, name) => {
    setFormData(prev => ({ ...prev, [name]: date }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.codigo.trim()) newErrors.codigo = 'El código es requerido.';
    if (!formData.tipo_descuento) newErrors.tipo_descuento = 'El tipo de descuento es requerido.';
    if (formData.valor_descuento === '' || isNaN(parseFloat(formData.valor_descuento)) || parseFloat(formData.valor_descuento) <= 0) {
      newErrors.valor_descuento = 'El valor debe ser un número positivo.';
    } else if (formData.tipo_descuento === 'porcentaje' && parseFloat(formData.valor_descuento) > 100) {
      newErrors.valor_descuento = 'El porcentaje no puede ser mayor a 100.';
    }

    if (formData.usos_maximos !== '' && (isNaN(parseInt(formData.usos_maximos, 10)) || parseInt(formData.usos_maximos, 10) < 0)) {
      newErrors.usos_maximos = 'Debe ser un número entero no negativo, o vacío para ilimitado.';
    }
    if (formData.monto_minimo_reserva_neto !== '' && (isNaN(parseFloat(formData.monto_minimo_reserva_neto)) || parseFloat(formData.monto_minimo_reserva_neto) < 0)) {
      newErrors.monto_minimo_reserva_neto = 'Debe ser un número no negativo, o vacío.';
    }

    if (formData.fecha_validez_desde && formData.fecha_validez_hasta && formData.fecha_validez_desde > formData.fecha_validez_hasta) {
      newErrors.fecha_validez_hasta = 'La fecha "hasta" no puede ser anterior a la fecha "desde".';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const dataToSubmit = {
      ...formData,
      valor_descuento: parseFloat(formData.valor_descuento),
      // Formatear fechas a YYYY-MM-DD o enviar null
      fecha_validez_desde: formData.fecha_validez_desde
        ? formData.fecha_validez_desde.toISOString().split('T')[0]
        : null,
      fecha_validez_hasta: formData.fecha_validez_hasta
        ? formData.fecha_validez_hasta.toISOString().split('T')[0]
        : null,
      usos_maximos: formData.usos_maximos === '' ? null : parseInt(formData.usos_maximos, 10),
      monto_minimo_reserva_neto: formData.monto_minimo_reserva_neto === '' ? null : parseFloat(formData.monto_minimo_reserva_neto),
    };
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="cupon-form">
      <div className="form-group">
        <label htmlFor="codigo">Código del Cupón <span className="required-asterisk">*</span></label>
        <input
          type="text"
          id="codigo"
          name="codigo"
          value={formData.codigo}
          onChange={handleChange}
          className={errors.codigo ? 'input-error' : ''}
        />
        {errors.codigo && <p className="error-message">{errors.codigo}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="tipo_descuento">Tipo de Descuento <span className="required-asterisk">*</span></label>
        <select
          id="tipo_descuento"
          name="tipo_descuento"
          value={formData.tipo_descuento}
          onChange={handleChange}
        >
          <option value="porcentaje">Porcentaje</option>
          <option value="fijo">Monto Fijo</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="valor_descuento">Valor del Descuento <span className="required-asterisk">*</span></label>
        <input
          type="number"
          id="valor_descuento"
          name="valor_descuento"
          value={formData.valor_descuento}
          onChange={handleChange}
          step="0.01"
          className={errors.valor_descuento ? 'input-error' : ''}
        />
        {errors.valor_descuento && <p className="error-message">{errors.valor_descuento}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="descripcion">Descripción</label>
        <textarea
          id="descripcion"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          rows="3"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="fecha_validez_desde">Válido Desde</label>
          <DatePicker
            selected={formData.fecha_validez_desde}
            onChange={(date) => handleDateChange(date, 'fecha_validez_desde')}
            selectsStart
            startDate={formData.fecha_validez_desde}
            endDate={formData.fecha_validez_hasta}
            dateFormat="dd/MM/yyyy"
            locale="es"
            isClearable
            placeholderText="Opcional"
            className="date-picker-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="fecha_validez_hasta">Válido Hasta</label>
          <DatePicker
            selected={formData.fecha_validez_hasta}
            onChange={(date) => handleDateChange(date, 'fecha_validez_hasta')}
            selectsEnd
            startDate={formData.fecha_validez_desde}
            endDate={formData.fecha_validez_hasta}
            minDate={formData.fecha_validez_desde}
            dateFormat="dd/MM/yyyy"
            locale="es"
            isClearable
            placeholderText="Opcional"
            className={`date-picker-input ${errors.fecha_validez_hasta ? 'input-error' : ''}`}
          />
           {errors.fecha_validez_hasta && <p className="error-message">{errors.fecha_validez_hasta}</p>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="usos_maximos">Usos Máximos</label>
          <input
            type="number"
            id="usos_maximos"
            name="usos_maximos"
            value={formData.usos_maximos}
            onChange={handleChange}
            placeholder="Vacío para ilimitado"
            min="0"
            className={errors.usos_maximos ? 'input-error' : ''}
          />
          {errors.usos_maximos && <p className="error-message">{errors.usos_maximos}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="monto_minimo_reserva_neto">Monto Mínimo Reserva (Neto)</label>
          <input
            type="number"
            id="monto_minimo_reserva_neto"
            name="monto_minimo_reserva_neto"
            value={formData.monto_minimo_reserva_neto}
            onChange={handleChange}
            step="0.01"
            placeholder="Vacío si no aplica"
            min="0"
            className={errors.monto_minimo_reserva_neto ? 'input-error' : ''}
          />
          {errors.monto_minimo_reserva_neto && <p className="error-message">{errors.monto_minimo_reserva_neto}</p>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="activo" className="checkbox-label">
          <input
            type="checkbox"
            id="activo"
            name="activo"
            checked={formData.activo}
            onChange={handleChange}
          />
          Cupón Activo
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="boton-principal" disabled={isLoading}>
          {isLoading ? (initialData ? 'Actualizando...' : 'Creando...') : (initialData ? 'Actualizar Cupón' : 'Crear Cupón')}
        </button>
        <button type="button" onClick={onCancel} className="boton-secundario" disabled={isLoading}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default CuponForm;
