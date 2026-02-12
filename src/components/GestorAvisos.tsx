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
  Search,
  Settings,
  Repeat,
  X,
} from 'lucide-react';

export default function GestorAvisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [avisosPendientes, setAvisosPendientes] = useState(0);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [avisoEditar, setAvisoEditar] = useState<Aviso | undefined>();
  const [filtroEstado, setFiltroEstado] = useState<'todos' | Aviso['estado']>('todos');
  const [soloMantenimientos, setSoloMantenimientos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [openSettings, setOpenSettings] = useState(false);

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

  const getEstadoBadge = (estado: Aviso['estado']) => {
    const badges = {
      pendiente: {
        icon: <Clock className="h-3.5 w-3.5" />,
        text: 'Pendiente',
        pill: 'bg-amber-50 text-amber-700 ring-amber-200',
      },
      visto: {
        icon: <Eye className="h-3.5 w-3.5" />,
        text: 'Visto',
        pill: 'bg-sky-50 text-sky-700 ring-sky-200',
      },
      presupuesto_aceptado: {
        icon: <CheckCircle className="h-3.5 w-3.5" />,
        text: 'Presup. aceptado',
        pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      },
    } as const;
    return badges[estado];
  };

  const filtradosBase =
    filtroEstado === 'todos' ? avisos : avisos.filter((a) => a.estado === filtroEstado);

  const filtradosMantenimiento = soloMantenimientos
    ? filtradosBase.filter((a) => !!a.mantenimiento)
    : filtradosBase;

  const avisosFiltrados = (() => {
    const query = q.trim().toLowerCase();
    if (!query) return filtradosMantenimiento;
    return filtradosMantenimiento.filter((a) => {
      const hay =
        a.nombre?.toLowerCase().includes(query) ||
        a.direccion?.toLowerCase().includes(query) ||
        a.telefono?.toLowerCase().includes(query) ||
        a.motivo?.toLowerCase().includes(query) ||
        a.administracion?.toLowerCase().includes(query) ||
        a.contactoAdmin?.toLowerCase().includes(query) ||
        a.detalleTrabajoRealizado?.toLowerCase().includes(query);
      return Boolean(hay);
    });
  })();

  const pills = [
    { key: 'todos', label: 'Todos', icon: FileText },
    { key: 'pendiente', label: 'Pendientes', icon: Clock },
    { key: 'visto', label: 'Vistos', icon: Eye },
    { key: 'presupuesto_aceptado', label: 'Aceptados', icon: CheckCircle },
  ] as const;

  const fmtDate = (d: any) => {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-gray-500">Panel</p>
              <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">Gestor de avisos</h1>
              <p className="text-gray-600">
                Organiza avisos, presupuesto y pendientes en un solo sitio.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => setOpenSettings(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                title="Ajustes"
                aria-label="Ajustes"
              >
                <Settings className="h-5 w-5" />
                Ajustes
              </button>

              <button
                onClick={handleNuevoAviso}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <PlusCircle className="h-5 w-5" />
                Añadir aviso
              </button>
            </div>
          </div>

          {/* Top row: Stats */}
          <div className="mt-6 grid grid-cols-1 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 ring-1 ring-blue-100">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </span>
                  <div>
                    <div className="text-sm text-gray-600">Avisos pendientes</div>
                    <div className="text-3xl font-semibold text-gray-900">{avisosPendientes}</div>
                  </div>
                </div>

                <div className="hidden text-right sm:block">
                  <div className="text-xs font-medium text-gray-500">Total</div>
                  <div className="text-lg font-semibold text-gray-900">{avisos.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters + Search */}
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-black/5 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {pills.map((p) => {
                const active = filtroEstado === (p.key as any);
                const Icon = p.icon;
                return (
                  <button
                    key={p.key}
                    onClick={() => setFiltroEstado(p.key as any)}
                    className={[
                      'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition',
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" />
                    {p.label}
                  </button>
                );
              })}

              {/* Toggle Mantenimiento */}
              <button
                onClick={() => setSoloMantenimientos((v) => !v)}
                className={[
                  'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition',
                  soloMantenimientos
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                ].join(' ')}
                title="Filtrar solo mantenimientos"
              >
                <Repeat className="h-4 w-4" />
                Mantenimientos
              </button>
            </div>

            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre, dirección, motivo…"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
        </header>

        {/* Lista */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-16">
              <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-black/5">
                <span className="inline-flex h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                Cargando…
              </div>
            </div>
          ) : avisosFiltrados.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm ring-1 ring-black/5">
              <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 ring-1 ring-black/5">
                <FileText className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-900">No hay avisos</p>
              <p className="mt-1 text-sm text-gray-600">
                {q.trim()
                  ? 'Prueba a cambiar la búsqueda.'
                  : filtroEstado !== 'todos'
                    ? `No hay avisos en estado "${filtroEstado}".`
                    : soloMantenimientos
                      ? 'No hay avisos marcados como mantenimiento.'
                      : 'Crea el primer aviso para empezar.'}
              </p>
              <button
                onClick={handleNuevoAviso}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <PlusCircle className="h-5 w-5" />
                Añadir aviso
              </button>
            </div>
          ) : (
            avisosFiltrados.map((aviso) => {
              const badge = getEstadoBadge(aviso.estado);
              return (
                <article
                  key={aviso.id}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-gray-900">
                          {aviso.nombre || '(Sin nombre)'}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={[
                              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1',
                              badge.pill,
                            ].join(' ')}
                          >
                            {badge.icon}
                            {badge.text}
                          </span>

                          {aviso.mantenimiento && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 ring-1 ring-purple-200">
                              <Repeat className="h-3.5 w-3.5" />
                              Mantenimiento
                            </span>
                          )}

                          <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                            <Calendar className="h-3.5 w-3.5" />
                            {fmtDate(aviso.fechaCreacion)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                        <button
                          onClick={() => handleEditarAviso(aviso)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50"
                          title="Editar"
                          aria-label="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => aviso.id && handleEliminarAviso(aviso.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 shadow-sm transition hover:bg-red-50"
                          title="Eliminar"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      {aviso.direccion && (
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                          <span className="text-gray-700">{aviso.direccion}</span>
                        </div>
                      )}

                      {aviso.telefono && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <span className="text-gray-700">{aviso.telefono}</span>
                        </div>
                      )}

                      {aviso.motivo && (
                        <div className="flex items-start gap-2">
                          <FileEdit className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                          <span className="text-gray-700 line-clamp-2">{aviso.motivo}</span>
                        </div>
                      )}

                      {(aviso.administracion || aviso.contactoAdmin) && (
                        <div className="flex items-start gap-2">
                          <Building2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                          <span className="text-gray-700 line-clamp-2">
                            {aviso.administracion}
                            {aviso.administracion && aviso.contactoAdmin ? ' — ' : ''}
                            {aviso.contactoAdmin}
                          </span>
                        </div>
                      )}

                      {aviso.detalleTrabajoRealizado && (
                        <div className="flex items-start gap-2">
                          <Wrench className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                          <span className="text-gray-700 line-clamp-2">
                            {aviso.detalleTrabajoRealizado}
                          </span>
                        </div>
                      )}

                      {/* Fechas de estado */}
                      {(aviso.fechaVisto || aviso.fechaPresupuestoAceptado) && (
                        <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2 text-xs text-gray-600">
                          {aviso.fechaVisto && (
                            <div>
                              👁️ Visto:{' '}
                              <span className="font-semibold">{fmtDate(aviso.fechaVisto)}</span>
                            </div>
                          )}
                          {aviso.fechaPresupuestoAceptado && (
                            <div>
                              ✅ Aceptado:{' '}
                              <span className="font-semibold">
                                {fmtDate(aviso.fechaPresupuestoAceptado)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex gap-2 border-t border-gray-100 bg-gray-50/60 p-4">
                    <button
                      onClick={() => handleEditarAviso(aviso)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </button>

                    <button
                      onClick={() => aviso.id && handleEliminarAviso(aviso.id)}
                      className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                      title="Eliminar"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })
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

        {/* Modal Ajustes (Backup) */}
        {openSettings && (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              onClick={() => setOpenSettings(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              aria-label="Cerrar ajustes"
            />
            <div className="relative mx-auto mt-20 w-full max-w-md p-4">
              <div className="overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
                <div className="flex items-start justify-between border-b border-gray-100 bg-white/80 px-5 py-4 backdrop-blur">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-gray-500">
                      Configuración
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900">Ajustes</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenSettings(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
                    aria-label="Cerrar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4 p-5">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                    <div className="text-sm font-semibold text-gray-900">Backup</div>
                    <div className="mt-1 text-sm text-gray-600">
                      Exporta o importa tus avisos (reemplaza los actuales al importar).
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={handleExportarDatos}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                      >
                        <Download className="h-4 w-4" />
                        Exportar
                      </button>

                      <label className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
                        <Upload className="h-4 w-4" />
                        Importar
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportarDatos}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Tip: guarda el backup en Drive/WhatsApp por si cambias de móvil/PC.
                  </div>
                </div>

                <div className="border-t border-gray-100 bg-white/80 px-5 py-4 backdrop-blur">
                  <button
                    type="button"
                    onClick={() => setOpenSettings(false)}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
