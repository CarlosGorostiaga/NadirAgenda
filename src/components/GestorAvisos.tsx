import { useState, useEffect } from 'react';
import { avisosDB, type Aviso } from '../lib/db';
import FormularioAviso from './FormularioAviso';
import {
  FileText,
  PlusCircle,
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

    event.target.value = '';
  };

  const avisosFiltrados =
    filtroEstado === 'todos' ? avisos : avisos.filter((a) => a.estado === filtroEstado);

  const getEstadoBadge = (estado: Aviso['estado']) => {
    const badges = {
      pendiente: {
        icon: <Clock className="w-4 h-4" />,
        text: 'Pendiente',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      },
      visto: {
        icon: <Eye className="w-4 h-4" />,
        text: 'Visto',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
      },
      presupuesto_aceptado: {
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'Presup. Aceptado',
        color: 'bg-green-100 text-green-800 border-green-200',
      },
    };
    return badges[estado];
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestor de Avisos</h1>
              <p className="text-gray-600">Gestiona tus avisos de trabajo fácilmente</p>
            </div>
            <button
              onClick={handleNuevoAviso}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
            >
              <PlusCircle className="w-5 h-5" />
              Añadir Aviso
            </button>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Avisos pendientes</div>
                <div className="text-3xl font-bold text-gray-900">{avisosPendientes}</div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                filtroEstado === 'todos'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
              onClick={() => setFiltroEstado('todos')}
            >
              <FileText className="w-4 h-4" />
              Todos
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                filtroEstado === 'pendiente'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
              onClick={() => setFiltroEstado('pendiente')}
            >
              <Clock className="w-4 h-4" />
              Pendientes
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                filtroEstado === 'visto'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
              onClick={() => setFiltroEstado('visto')}
            >
              <Eye className="w-4 h-4" />
              Vistos
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                filtroEstado === 'presupuesto_aceptado'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
              onClick={() => setFiltroEstado('presupuesto_aceptado')}
            >
              <CheckCircle className="w-4 h-4" />
              Aceptados
            </button>
          </div>

          {/* Backup buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportarDatos}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-200 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Exportar Backup
            </button>
            <label className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-200 shadow-sm cursor-pointer">
              <Upload className="w-4 h-4" />
              Importar Backup
              <input type="file" accept=".json" onChange={handleImportarDatos} className="hidden" />
            </label>
          </div>
        </header>

        {/* Lista de Avisos */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-gray-500">Cargando...</div>
            </div>
          ) : avisosFiltrados.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500">
                No hay avisos {filtroEstado !== 'todos' && `en estado "${filtroEstado}"`}
              </p>
            </div>
          ) : (
            avisosFiltrados.map((aviso) => (
              <div
                key={aviso.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{aviso.nombre}</h3>
                    <span
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getEstadoBadge(aviso.estado).color}`}
                    >
                      {getEstadoBadge(aviso.estado).icon}
                      {getEstadoBadge(aviso.estado).text}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{aviso.direccion}</span>
                    </div>

                    {aviso.telefono && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700">{aviso.telefono}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-2 text-sm">
                      <FileEdit className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{aviso.motivo}</span>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        {aviso.administracion} - {aviso.contactoAdmin}
                      </span>
                    </div>

                    {aviso.detalleTrabajoRealizado && (
                      <div className="flex items-start gap-2 text-sm">
                        <Wrench className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{aviso.detalleTrabajoRealizado}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <Calendar className="w-4 h-4" />
                      {new Date(aviso.fechaCreacion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 p-4 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => handleEditarAviso(aviso)}
                    className="flex items-center justify-center gap-2 flex-1 bg-white hover:bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium transition-colors border border-blue-200"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => aviso.id && handleEliminarAviso(aviso.id)}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium transition-colors border border-red-200"
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
    </div>
  );
}
