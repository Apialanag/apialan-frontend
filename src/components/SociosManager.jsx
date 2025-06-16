// src/components/SociosManager.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';

function SociosManager() {
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para el formulario de nuevo socio
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [rutNuevo, setRutNuevo] = useState('');

  // Estados para el modo de edición en línea
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nombre_completo: '', rut: '', estado: '' });

  // Función para obtener todos los socios desde el backend
  const fetchSocios = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/socios');
      setSocios(response.data);
    } catch (err) {
      setError('No se pudieron cargar los socios.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar los socios cuando el componente se monta por primera vez
  useEffect(() => {
    fetchSocios();
  }, []);

  // Manejador para el envío del formulario de nuevo socio
  const handleAddSocio = async (e) => {
    e.preventDefault();
    if (!nombreNuevo || !rutNuevo) {
      setError('Nombre y RUT son obligatorios.');
      return;
    }
    try {
      await api.post('/admin/socios', { nombre_completo: nombreNuevo, rut: rutNuevo });
      setNombreNuevo('');
      setRutNuevo('');
      setError('');
      fetchSocios(); // Recargar la lista para mostrar el nuevo socio
    } catch (err) {
      setError(err.response?.data?.error || 'Error al añadir socio.');
    }
  };

  // Manejador para eliminar un socio
  const handleDeleteSocio = async (id) => {
    // Usamos un modal de confirmación nativo (se puede mejorar)
    if (window.confirm('¿Estás seguro de que deseas eliminar este socio? Esta acción no se puede deshacer.')) {
      try {
        await api.delete(`/admin/socios/${id}`);
        fetchSocios(); // Recargar la lista
      } catch (err) {
        setError('Error al eliminar socio.');
      }
    }
  };

  // Manejador para activar el modo de edición de una fila
  const handleEditClick = (socio) => {
    setEditingId(socio.id);
    setEditForm(socio);
  };

  // Manejador para guardar los cambios de un socio editado
  const handleUpdateSocio = async (id) => {
    try {
      await api.put(`/admin/socios/${id}`, editForm);
      setEditingId(null); // Salir del modo de edición
      fetchSocios(); // Recargar la lista
    } catch (err) {
      setError('Error al actualizar socio.');
    }
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <p>Cargando socios...</p>;

  return (
    <div>
      <p>Añade, edita o elimina socios de la asociación.</p>
      {error && <p className="mensaje-error" style={{textAlign: 'center'}}>{error}</p>}
      
      {/* Formulario para añadir nuevo socio */}
      <div className="form-add-socio">
        <h3>Añadir Nuevo Socio</h3>
        <form onSubmit={handleAddSocio}>
          <input 
            type="text" 
            placeholder="Nombre completo del socio" 
            value={nombreNuevo} 
            onChange={(e) => setNombreNuevo(e.target.value)} 
            required 
          />
          <input 
            type="text" 
            placeholder="RUT del socio (ej: 12.345.678-9)" 
            value={rutNuevo} 
            onChange={(e) => setRutNuevo(e.target.value)} 
            required 
          />
          <button type="submit" className="boton-principal">Añadir</button>
        </form>
      </div>

      {/* Tabla de socios existentes */}
      <div className="reservas-table-container" style={{marginTop: '2rem'}}>
        <table className="reservas-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre Completo</th>
              <th>RUT</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {socios.map(socio => (
              <tr key={socio.id}>
                {editingId === socio.id ? (
                  // --- Fila en modo de EDICIÓN ---
                  <>
                    <td>{socio.id}</td>
                    <td><input type="text" name="nombre_completo" value={editForm.nombre_completo} onChange={handleFormChange} /></td>
                    <td><input type="text" name="rut" value={editForm.rut} onChange={handleFormChange} /></td>
                    <td>
                      <select name="estado" value={editForm.estado} onChange={handleFormChange}>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </td>
                    <td>
                      <button className="action-button edit" onClick={() => handleUpdateSocio(socio.id)}>Guardar</button>
                      <button className="action-button cancel" onClick={() => setEditingId(null)}>Cancelar</button>
                    </td>
                  </>
                ) : (
                  // --- Fila en modo de VISTA ---
                  <>
                    <td>{socio.id}</td>
                    <td>{socio.nombre_completo}</td>
                    <td>{socio.rut}</td>
                    <td>
                      <span className={`status-badge ${socio.estado === 'activo' ? 'status-confirmada' : 'status-cancelada_por_admin'}`}>
                        {socio.estado}
                      </span>
                    </td>
                    <td>
                      <button className="action-button edit" onClick={() => handleEditClick(socio)}>Editar</button>
                      <button className="action-button cancel" onClick={() => handleDeleteSocio(socio.id)}>Eliminar</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SociosManager;