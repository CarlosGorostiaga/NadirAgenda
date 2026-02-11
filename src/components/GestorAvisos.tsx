import { useState, useEffect } from 'react';
import { avisosDB, type Aviso } from '../lib/db';
import FormularioAviso from './FormularioAviso';

export default function GestorAvisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [avisosPendientes, setAvisosPendientes] = useState(0);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [avisoEditar, setAvisoEditar] = useState<Aviso | undefined>();
  const [filtroEstado, setFiltroEstado] = useState<'todos' | Aviso['estado']>('todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarAvisos();
  }, []);

  const cargarAvisos = async () => {
    setLoading(true);
    try {
      const todosAvisos = await avisosDB.obtenerTodos();
      const pendientes = await avisosDB.contarPendientes();
      setAvisos(todosAvisos);
      setAvisosPendientes(pendientes);
    } catch (error) {
      console.error('Error al cargar avisos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoAviso = () => {
    setAvisoEditar(undefined);
    setMostrarFormulario(true);
  };

  const handleEditarAviso = (aviso: Aviso) => {
    setAvisoEditar(aviso);
    setMostrarFormulario(true);
  };

  const handleEliminarAviso = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este aviso?')) {
      await avisosDB.eliminar(id);
      await cargarAvisos();
    }
  };

  const handleFormularioSuccess = async () => {
    setMostrarFormulario(false);
    setAvisoEditar(undefined);
    await cargarAvisos();
  };

  const handleExportarDatos = async () => {
    try {
      const datos = await avisosDB.exportarDatos();
      const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-avisos-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos');
    }
  };

  const handleImportarDatos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const datos = JSON.parse(text);
      
      if (confirm('⚠️ Esto reemplazará todos los avisos actuales. ¿Continuar?')) {
        await avisosDB.importarDatos(datos);
        await cargarAvisos();
        alert('✅ Datos importados correctamente');
      }
    } catch (error) {
      console.error('Error al importar:', error);
      alert('Error al importar los datos. Verifica que el archivo sea válido.');
    }
    
    // Reset input
    event.target.value = '';
  };

  const avisosFiltrados = filtroEstado === 'todos' 
    ? avisos 
    : avisos.filter(a => a.estado === filtroEstado);

  const getEstadoBadge = (estado: Aviso['estado']) => {
    const badges = {
      pendiente: { emoji: '⏳', text: 'Pendiente', class: 'badge-pendiente' },
      visto: { emoji: '👀', text: 'Visto', class: 'badge-visto' },
      presupuesto_aceptado: { emoji: '✅', text: 'Presup. Aceptado', class: 'badge-aceptado' }
    };
    return badges[estado];
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="header-top">
          <div className="logo-section">
            <h1>Gestor de Avisos</h1>
            <p>Gestiona tus avisos fácilmente</p>
          </div>
          <button onClick={handleNuevoAviso} className="btn btn-add">
            <span className="btn-icon">➕</span>
            Añadir Aviso
          </button>
        </div>

        <div className="stats-card">
          <div className="stat">
            <span className="stat-icon">🔔</span>
            <div>
              <div className="stat-label">Avisos pendientes</div>
              <div className="stat-value">{avisosPendientes}</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="filters">
          <button 
            className={`filter-btn ${filtroEstado === 'todos' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('todos')}
          >
            📋 Todos
          </button>
          <button 
            className={`filter-btn ${filtroEstado === 'pendiente' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('pendiente')}
          >
            ⏳ Pendientes
          </button>
          <button 
            className={`filter-btn ${filtroEstado === 'visto' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('visto')}
          >
            👀 Vistos
          </button>
          <button 
            className={`filter-btn ${filtroEstado === 'presupuesto_aceptado' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('presupuesto_aceptado')}
          >
            ✅ Aceptados
          </button>
        </div>

        {/* Backup buttons */}
        <div className="backup-section">
          <button onClick={handleExportarDatos} className="btn btn-backup">
            💾 Exportar Backup
          </button>
          <label className="btn btn-backup">
            📥 Importar Backup
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportarDatos}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </header>

      {/* Lista de Avisos */}
      <div className="avisos-list">
        {loading ? (
          <div className="empty-state">
            <div className="loader">Cargando...</div>
          </div>
        ) : avisosFiltrados.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No hay avisos {filtroEstado !== 'todos' && `en estado "${filtroEstado}"`}</p>
          </div>
        ) : (
          avisosFiltrados.map((aviso) => (
            <div key={aviso.id} className="aviso-card">
              <div className="aviso-header">
                <h3>{aviso.nombre}</h3>
                <span className={`badge ${getEstadoBadge(aviso.estado).class}`}>
                  {getEstadoBadge(aviso.estado).emoji} {getEstadoBadge(aviso.estado).text}
                </span>
              </div>

              <div className="aviso-body">
                <div className="aviso-field">
                  <span className="field-icon">📍</span>
                  <span className="field-value">{aviso.direccion}</span>
                </div>
                
                {aviso.telefono && (
                  <div className="aviso-field">
                    <span className="field-icon">📞</span>
                    <span className="field-value">{aviso.telefono}</span>
                  </div>
                )}

                <div className="aviso-field">
                  <span className="field-icon">📝</span>
                  <span className="field-value">{aviso.motivo}</span>
                </div>

                <div className="aviso-field">
                  <span className="field-icon">🏛️</span>
                  <span className="field-value">
                    {aviso.administracion} - {aviso.contactoAdmin}
                  </span>
                </div>

                {aviso.detalleTrabajoRealizado && (
                  <div className="aviso-field">
                    <span className="field-icon">🔧</span>
                    <span className="field-value">{aviso.detalleTrabajoRealizado}</span>
                  </div>
                )}

                <div className="aviso-date">
                  📅 {new Date(aviso.fechaCreacion).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </div>
              </div>

              <div className="aviso-actions">
                <button 
                  onClick={() => handleEditarAviso(aviso)}
                  className="btn-icon-action"
                  title="Editar"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => aviso.id && handleEliminarAviso(aviso.id)}
                  className="btn-icon-action btn-danger"
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Formulario */}
      {mostrarFormulario && (
        <FormularioAviso
          onSuccess={handleFormularioSuccess}
          onCancel={() => {
            setMostrarFormulario(false);
            setAvisoEditar(undefined);
          }}
          avisoEditar={avisoEditar}
        />
      )}
    </div>
  );
}
