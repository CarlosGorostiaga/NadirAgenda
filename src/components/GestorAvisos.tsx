import { useState, useEffect } from 'react';
import { avisosDB, type Aviso } from '../lib/db';
import FormularioAviso from './FormularioAviso';
import {
  FileText,
  PlusCircle,
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  CheckCircle,
  Eye,
  Clock,
  Bell,
  MapPin,
  Phone,
  FileEdit,
  Building2,
  Wrench,
  Calendar,
} from 'lucide-react';

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

  const avisosFiltrados =
    filtroEstado === 'todos' ? avisos : avisos.filter((a) => a.estado === filtroEstado);

  const getEstadoBadge = (estado: Aviso['estado']) => {
    const badges = {
      pendiente: {
        icon: <Clock className="w-4 h-4" />,
        text: 'Pendiente',
        class: 'badge-pendiente',
      },
      visto: {
        icon: <Eye className="w-4 h-4" />,
        text: 'Visto',
        class: 'badge-visto',
      },
      presupuesto_aceptado: {
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'Presup. Aceptado',
        class: 'badge-aceptado',
      },
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
            <PlusCircle className="w-5 h-5" />
            Añadir Aviso
          </button>
        </div>

        <div className="stats-card">
          <div className="stat">
            <Bell className="w-6 h-6 stat-icon" />
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
            <FileText className="w-4 h-4" />
            Todos
          </button>
          <button
            className={`filter-btn ${filtroEstado === 'pendiente' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('pendiente')}
          >
            <Clock className="w-4 h-4" />
            Pendientes
          </button>
          <button
            className={`filter-btn ${filtroEstado === 'visto' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('visto')}
          >
            <Eye className="w-4 h-4" />
            Vistos
          </button>
          <button
            className={`filter-btn ${filtroEstado === 'presupuesto_aceptado' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('presupuesto_aceptado')}
          >
            <CheckCircle className="w-4 h-4" />
            Aceptados
          </button>
        </div>

        {/* Backup buttons */}
        <div className="backup-section">
          <button onClick={handleExportarDatos} className="btn btn-backup">
            <Download className="w-4 h-4" />
            Exportar Backup
          </button>
          <label className="btn btn-backup">
            <Upload className="w-4 h-4" />
            Importar Backup
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
            <FileText className="w-16 h-16 empty-icon" />
            <p>No hay avisos {filtroEstado !== 'todos' && `en estado "${filtroEstado}"`}</p>
          </div>
        ) : (
          avisosFiltrados.map((aviso) => (
            <div key={aviso.id} className="aviso-card">
              <div className="aviso-header">
                <h3>{aviso.nombre}</h3>
                <span className={`badge ${getEstadoBadge(aviso.estado).class}`}>
                  {getEstadoBadge(aviso.estado).icon}
                  {getEstadoBadge(aviso.estado).text}
                </span>
              </div>

              <div className="aviso-body">
                <div className="aviso-field">
                  <MapPin className="w-4 h-4 field-icon" />
                  <span className="field-value">{aviso.direccion}</span>
                </div>

                {aviso.telefono && (
                  <div className="aviso-field">
                    <Phone className="w-4 h-4 field-icon" />
                    <span className="field-value">{aviso.telefono}</span>
                  </div>
                )}

                <div className="aviso-field">
                  <FileEdit className="w-4 h-4 field-icon" />
                  <span className="field-value">{aviso.motivo}</span>
                </div>

                <div className="aviso-field">
                  <Building2 className="w-4 h-4 field-icon" />
                  <span className="field-value">
                    {aviso.administracion} - {aviso.contactoAdmin}
                  </span>
                </div>

                {aviso.detalleTrabajoRealizado && (
                  <div className="aviso-field">
                    <Wrench className="w-4 h-4 field-icon" />
                    <span className="field-value">{aviso.detalleTrabajoRealizado}</span>
                  </div>
                )}

                <div className="aviso-date">
                  <Calendar className="w-4 h-4" />
                  {new Date(aviso.fechaCreacion).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </div>
              </div>

              <div className="aviso-actions">
                <button
                  onClick={() => handleEditarAviso(aviso)}
                  className="btn-icon-action"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => aviso.id && handleEliminarAviso(aviso.id)}
                  className="btn-icon-action btn-danger"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
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
