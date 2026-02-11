import { useState, type FormEvent } from 'react';
import { avisosDB, type Aviso } from '../lib/db';

interface FormularioAvisoProps {
  onSuccess: () => void;
  onCancel: () => void;
  avisoEditar?: Aviso;
}

export default function FormularioAviso({ onSuccess, onCancel, avisoEditar }: FormularioAvisoProps) {
  const [formData, setFormData] = useState({
    nombre: avisoEditar?.nombre || '',
    direccion: avisoEditar?.direccion || '',
    telefono: avisoEditar?.telefono || '',
    motivo: avisoEditar?.motivo || '',
    administracion: avisoEditar?.administracion || '',
    contactoAdmin: avisoEditar?.contactoAdmin || '',
    detalleTrabajoRealizado: avisoEditar?.detalleTrabajoRealizado || '',
    estado: avisoEditar?.estado || ('pendiente' as const)
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (avisoEditar?.id) {
        await avisosDB.actualizar(avisoEditar.id, formData);
      } else {
        await avisosDB.crear(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error al guardar aviso:', error);
      alert('Error al guardar el aviso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{avisoEditar ? 'Editar Aviso' : 'Añadir Aviso'}</h2>
          <button onClick={onCancel} className="btn-close" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          {/* Datos del Cliente */}
          <div className="form-section">
            <h3>📋 Datos del Cliente</h3>
            
            <div className="form-group">
              <label htmlFor="nombre">
                <span className="icon">👤</span>
                Nombre del cliente *
              </label>
              <input
                id="nombre"
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre completo"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="direccion">
                <span className="icon">📍</span>
                Dirección *
              </label>
              <input
                id="direccion"
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Dirección completa"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">
                <span className="icon">📞</span>
                Teléfono
              </label>
              <input
                id="telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="Número de contacto"
              />
            </div>

            <div className="form-group">
              <label htmlFor="motivo">
                <span className="icon">📝</span>
                Motivo del aviso *
              </label>
              <textarea
                id="motivo"
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                placeholder="Gotera, atasco, avería..."
                rows={3}
                required
              />
            </div>
          </div>

          {/* Datos de la Administración */}
          <div className="form-section">
            <h3>🏢 Administración</h3>
            
            <div className="form-group">
              <label htmlFor="administracion">
                <span className="icon">🏛️</span>
                Administración *
              </label>
              <input
                id="administracion"
                type="text"
                value={formData.administracion}
                onChange={(e) => setFormData({ ...formData, administracion: e.target.value })}
                placeholder="Nombre de la administración"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactoAdmin">
                <span className="icon">👔</span>
                Contacto en administración *
              </label>
              <input
                id="contactoAdmin"
                type="text"
                value={formData.contactoAdmin}
                onChange={(e) => setFormData({ ...formData, contactoAdmin: e.target.value })}
                placeholder="Persona que te pasó el aviso"
                required
              />
            </div>
          </div>

          {/* Detalle del Trabajo */}
          <div className="form-section">
            <h3>🔧 Trabajo Realizado</h3>
            
            <div className="form-group">
              <label htmlFor="detalleTrabajoRealizado">
                <span className="icon">📦</span>
                Materiales y trabajo
              </label>
              <textarea
                id="detalleTrabajoRealizado"
                value={formData.detalleTrabajoRealizado}
                onChange={(e) => setFormData({ ...formData, detalleTrabajoRealizado: e.target.value })}
                placeholder="3 metros de canaló, poliuretano, caucho..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="estado">
                <span className="icon">⚡</span>
                Estado
              </label>
              <select
                id="estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value as Aviso['estado'] })}
              >
                <option value="pendiente">⏳ Pendiente</option>
                <option value="visto">👀 Visto</option>
                <option value="presupuesto_aceptado">✅ Presupuesto Aceptado</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : (avisoEditar ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
