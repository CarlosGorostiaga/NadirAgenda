import { useMemo, useState, type FormEvent } from 'react';
import { avisosDB, type Aviso } from '../lib/db';
import {
  X,
  User,
  MapPin,
  Phone,
  FileEdit,
  Building2,
  UserCircle,
  Package,
  Wrench,
  Clock,
  Save,
  Repeat,
  CalendarClock,
  CheckCircle2,
  Eye,
  Send,
  ClipboardCheck,
} from 'lucide-react';

interface FormularioAvisoProps {
  onSuccess: () => void;
  onCancel: () => void;
  avisoEditar?: Aviso;
}

type ChecklistKey = 'visto' | 'presupuesto_enviado' | 'presupuesto_aceptado' | 'hecho';

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function parseDatetimeLocalValue(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDateShort(d: Date | null | undefined) {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function deriveEstado(a: Partial<Aviso>): Aviso['estado'] {
  if ((a as any).fechaHecho) return 'hecho';
  if ((a as any).fechaPresupuestoAceptado) return 'presupuesto_aceptado';
  if ((a as any).fechaPresupuestoEnviado) return 'presupuesto_enviado';
  if ((a as any).fechaVisto) return 'visto';
  return 'pendiente';
}

export default function FormularioAviso({
  onSuccess,
  onCancel,
  avisoEditar,
}: FormularioAvisoProps) {
  const [formData, setFormData] = useState({
    direccion: avisoEditar?.direccion || '',
    nombre: avisoEditar?.nombre || '',
    telefono: avisoEditar?.telefono || '',
    motivo: avisoEditar?.motivo || '',
    administracion: avisoEditar?.administracion || '',
    contactoAdmin: avisoEditar?.contactoAdmin || '',
    detalleTrabajoRealizado: avisoEditar?.detalleTrabajoRealizado || '',

    mantenimiento: avisoEditar?.mantenimiento ?? false,

    citaAt: avisoEditar?.citaAt ?? null,

    fechaVisto: avisoEditar?.fechaVisto ?? null,
    fechaPresupuestoEnviado: avisoEditar?.fechaPresupuestoEnviado ?? null,
    fechaPresupuestoAceptado: avisoEditar?.fechaPresupuestoAceptado ?? null,
    fechaHecho: avisoEditar?.fechaHecho ?? null,
  });

  const [loading, setLoading] = useState(false);
  const estadoActual = useMemo(() => deriveEstado(formData as any), [formData]);

  const estadoLabel =
    estadoActual === 'pendiente'
      ? 'Pendiente'
      : estadoActual === 'visto'
        ? 'Visto'
        : estadoActual === 'presupuesto_enviado'
          ? 'Presupuesto enviado'
          : estadoActual === 'presupuesto_aceptado'
            ? 'Presupuesto aceptado'
            : 'Hecho';

  const estadoPillClass =
    estadoActual === 'pendiente'
      ? 'bg-amber-50 text-amber-700 ring-amber-200'
      : estadoActual === 'visto'
        ? 'bg-sky-50 text-sky-700 ring-sky-200'
        : estadoActual === 'presupuesto_enviado'
          ? 'bg-indigo-50 text-indigo-700 ring-indigo-200'
          : estadoActual === 'presupuesto_aceptado'
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
            : 'bg-slate-100 text-slate-800 ring-slate-200';

  // ✅ FIX responsive: max-w-full + min-w-0 en inputs (evita overflow)
  const inputBase =
    'w-full max-w-full min-w-0 rounded-xl border border-gray-200 bg-white px-10 py-3 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

  const textareaBase =
    'w-full max-w-full min-w-0 resize-none rounded-xl border border-gray-200 bg-white px-10 py-3 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

  const labelBase = 'mb-2 block text-sm font-medium text-gray-700';

  const setChecklist = (key: ChecklistKey, checked: boolean) => {
    const now = new Date();

    setFormData((prev) => {
      const next = { ...prev } as any;

      const setOrClear = (field: string, on: boolean) => {
        next[field] = on ? (next[field] ?? now) : null;
      };

      if (key === 'visto') {
        setOrClear('fechaVisto', checked);
        if (!checked) {
          next.fechaPresupuestoEnviado = null;
          next.fechaPresupuestoAceptado = null;
          next.fechaHecho = null;
        }
      }

      if (key === 'presupuesto_enviado') {
        if (checked && !prev.fechaVisto) next.fechaVisto = now;
        setOrClear('fechaPresupuestoEnviado', checked);
        if (!checked) {
          next.fechaPresupuestoAceptado = null;
          next.fechaHecho = null;
        }
      }

      if (key === 'presupuesto_aceptado') {
        if (checked && !prev.fechaVisto) next.fechaVisto = now;
        if (checked && !prev.fechaPresupuestoEnviado) next.fechaPresupuestoEnviado = now;
        setOrClear('fechaPresupuestoAceptado', checked);
        if (!checked) next.fechaHecho = null;
      }

      if (key === 'hecho') {
        if (checked && !prev.fechaVisto) next.fechaVisto = now;
        if (checked && !prev.fechaPresupuestoEnviado) next.fechaPresupuestoEnviado = now;
        if (checked && !prev.fechaPresupuestoAceptado) next.fechaPresupuestoAceptado = now;
        setOrClear('fechaHecho', checked);
      }

      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: Partial<Aviso> = {
        ...formData,
        estado: deriveEstado(formData as any),
      };

      if (avisoEditar?.id) {
        await avisosDB.actualizar(avisoEditar.id, payload);
      } else {
        await avisosDB.crear(payload as any);
      }

      onSuccess();
    } catch (error) {
      console.error('Error al guardar aviso:', error);
      alert('Error al guardar el aviso');
    } finally {
      setLoading(false);
    }
  };

  const isCitaOn = !!formData.citaAt;

  return (
    <div className="fixed inset-0 z-50 overflow-x-hidden">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative mx-auto flex min-h-full max-w-3xl items-center justify-center p-4 min-w-0 overflow-x-hidden">
        <div className="w-full min-w-0 overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
          {/* Top bar */}
          <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 px-6 py-4 backdrop-blur">
            <div className="flex items-start justify-between gap-4 min-w-0">
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-semibold tracking-wide text-gray-500">Avisos</p>
                <h2 className="text-xl font-semibold text-gray-900 truncate">
                  {avisoEditar ? 'Editar aviso' : 'Nuevo aviso'}
                </h2>
              </div>

              <button
                type="button"
                onClick={onCancel}
                className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="max-h-[78vh] overflow-y-auto overflow-x-hidden min-w-0"
          >
            <div className="space-y-6 p-6 min-w-0">
              {/* Toggle Mantenimiento (columna en móvil / fila en desktop) */}
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 transition hover:bg-gray-100">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">
                    {/* Bloque texto */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Repeat className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-900">Mantenimiento</span>

                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${estadoPillClass}`}
                          title="Estado actual"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {estadoLabel}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-relaxed text-gray-600">
                        Registro rápido para revisiones periódicas. Solo dirección/comunidad y
                        marcar “Hecho”.
                      </p>
                    </div>

                    {/* Bloque switch (en móvil ocupa una fila propia) */}
                    <div className="flex items-center justify-between gap-3 md:w-[160px] md:flex-col md:items-end md:justify-start">
                      <span className="text-xs font-semibold text-gray-600 md:hidden">
                        {formData.mantenimiento ? 'Activado' : 'Desactivado'}
                      </span>

                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={formData.mantenimiento}
                          onChange={(e) =>
                            setFormData({ ...formData, mantenimiento: e.target.checked })
                          }
                          className="peer sr-only"
                          aria-label="Activar mantenimiento"
                        />

                        {/* pista */}
                        <span className="h-7 w-12 rounded-full bg-gray-300 shadow-inner transition peer-checked:bg-blue-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20" />

                        {/* bolita */}
                        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                      </label>

                      <span className="hidden text-[10px] font-semibold text-gray-500 md:block">
                        {formData.mantenimiento ? 'Activado' : 'Desactivado'}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Dirección */}
              <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 min-w-0">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 min-w-0">
                  <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </span>
                  <span className="truncate">Dirección / Comunidad</span>
                </h3>

                <label htmlFor="direccion" className={labelBase}>
                  Dirección (dato principal)
                </label>
                <div className="relative min-w-0">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="direccion"
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Ej: Comunidad Calle Mayor 12 / Portal 2 / 3ºB"
                    className={inputBase}
                  />
                </div>

                {formData.mantenimiento && (
                  <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-black/5 min-w-0">
                    <div className="flex items-start justify-between gap-4 min-w-0">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900">Registro rápido</div>
                        <div className="text-sm text-gray-600">
                          Marca <b>Hecho</b> y se guardará la fecha automáticamente.
                        </div>
                      </div>
                      <span className="flex-shrink-0 text-xs font-semibold text-gray-500">
                        {formData.fechaHecho ? `Hecho: ${fmtDateShort(formData.fechaHecho)}` : '—'}
                      </span>
                    </div>

                    <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 transition hover:bg-gray-50 min-w-0">
                      <input
                        type="checkbox"
                        checked={!!formData.fechaHecho}
                        onChange={(e) => setChecklist('hecho', e.target.checked)}
                        className="h-4 w-4 flex-shrink-0"
                      />
                      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-900">
                        <ClipboardCheck className="h-4 w-4 text-gray-700 flex-shrink-0" />
                        <span className="truncate">Hecho</span>
                      </div>
                    </label>
                  </div>
                )}
              </section>

              {!formData.mantenimiento && (
                <>
                  <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-black/5 min-w-0">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 ring-1 ring-black/5 flex-shrink-0">
                        <FileEdit className="h-5 w-5 text-blue-600" />
                      </span>
                      Datos del aviso
                    </h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 min-w-0">
                      <div className="min-w-0">
                        <label htmlFor="nombre" className={labelBase}>
                          Nombre
                        </label>
                        <div className="relative min-w-0">
                          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            id="nombre"
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            placeholder="Nombre del cliente"
                            className={inputBase}
                          />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <label htmlFor="telefono" className={labelBase}>
                          Teléfono
                        </label>
                        <div className="relative min-w-0">
                          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            id="telefono"
                            type="tel"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            placeholder="600 000 000"
                            className={inputBase}
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 min-w-0">
                        <label htmlFor="motivo" className={labelBase}>
                          Motivo
                        </label>
                        <div className="relative min-w-0">
                          <FileEdit className="pointer-events-none absolute left-3 top-4 h-4 w-4 text-gray-400" />
                          <textarea
                            id="motivo"
                            value={formData.motivo}
                            onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                            placeholder="Gotera, atasco, avería..."
                            rows={4}
                            className={textareaBase}
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-black/5 min-w-0">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 ring-1 ring-black/5 flex-shrink-0">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </span>
                        Administración
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 min-w-0">
                      <div className="min-w-0">
                        <label htmlFor="administracion" className={labelBase}>
                          Administración
                        </label>
                        <div className="relative min-w-0">
                          <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            id="administracion"
                            type="text"
                            value={formData.administracion}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                administracion: e.target.value,
                              })
                            }
                            placeholder="Nombre de la administración"
                            className={inputBase}
                          />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <label htmlFor="contactoAdmin" className={labelBase}>
                          Contacto
                        </label>
                        <div className="relative min-w-0">
                          <UserCircle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            id="contactoAdmin"
                            type="text"
                            value={formData.contactoAdmin}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                contactoAdmin: e.target.value,
                              })
                            }
                            placeholder="Persona que te pasó el aviso"
                            className={inputBase}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {/* Seguimiento */}
              <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 min-w-0">
                <div className="mb-4 flex items-center justify-between gap-3 min-w-0">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 min-w-0">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 flex-shrink-0">
                      <Wrench className="h-5 w-5 text-blue-600" />
                    </span>
                    <span className="truncate">Seguimiento (cita + checks + detalle)</span>
                  </h3>

                  <span
                    className={`inline-flex flex-shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${estadoPillClass}`}
                    title="Estado actual"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {estadoLabel}
                  </span>
                </div>

                {/* Cita */}
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-black/5 min-w-0">
                  <div className="flex items-start justify-between gap-4 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <CalendarClock className="h-4 w-4 text-gray-700 flex-shrink-0" />
                        <span className="truncate">Cita</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Programa la visita para ir a verlo (día y hora manual).
                      </div>
                    </div>
                    <label className="inline-flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={isCitaOn}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            citaAt: e.target.checked ? new Date() : null,
                          }))
                        }
                        className="h-4 w-4"
                      />
                      Activar
                    </label>
                  </div>

                  {isCitaOn && (
                    <div className="mt-4 min-w-0">
                      <label className={labelBase} htmlFor="citaAt">
                        Día y hora
                      </label>
                      <div className="relative min-w-0">
                        <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          id="citaAt"
                          type="datetime-local"
                          value={formData.citaAt ? toDatetimeLocalValue(formData.citaAt) : ''}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              citaAt: parseDatetimeLocalValue(e.target.value),
                            }))
                          }
                          className={inputBase}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Checklist */}
                <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-black/5 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">
                    Checklist (guarda fecha al marcar)
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 min-w-0">
                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 transition hover:bg-gray-50 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={!!formData.fechaVisto}
                          onChange={(e) => setChecklist('visto', e.target.checked)}
                          className="h-4 w-4 flex-shrink-0"
                        />
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 min-w-0">
                          <Eye className="h-4 w-4 text-gray-700 flex-shrink-0" />
                          <span className="truncate">Visto</span>
                        </div>
                      </div>
                      <span className="flex-shrink-0 text-xs font-semibold text-gray-500">
                        {formData.fechaVisto ? fmtDateShort(formData.fechaVisto) : '—'}
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 transition hover:bg-gray-50 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={!!formData.fechaPresupuestoEnviado}
                          onChange={(e) => setChecklist('presupuesto_enviado', e.target.checked)}
                          className="h-4 w-4 flex-shrink-0"
                        />
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 min-w-0">
                          <Send className="h-4 w-4 text-gray-700 flex-shrink-0" />
                          <span className="truncate">Presupuesto enviado</span>
                        </div>
                      </div>
                      <span className="flex-shrink-0 text-xs font-semibold text-gray-500">
                        {formData.fechaPresupuestoEnviado
                          ? fmtDateShort(formData.fechaPresupuestoEnviado)
                          : '—'}
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 transition hover:bg-gray-50 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={!!formData.fechaPresupuestoAceptado}
                          onChange={(e) => setChecklist('presupuesto_aceptado', e.target.checked)}
                          className="h-4 w-4 flex-shrink-0"
                        />
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 min-w-0">
                          <CheckCircle2 className="h-4 w-4 text-gray-700 flex-shrink-0" />
                          <span className="truncate">Presupuesto aceptado</span>
                        </div>
                      </div>
                      <span className="flex-shrink-0 text-xs font-semibold text-gray-500">
                        {formData.fechaPresupuestoAceptado
                          ? fmtDateShort(formData.fechaPresupuestoAceptado)
                          : '—'}
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 transition hover:bg-gray-50 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={!!formData.fechaHecho}
                          onChange={(e) => setChecklist('hecho', e.target.checked)}
                          className="h-4 w-4 flex-shrink-0"
                        />
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 min-w-0">
                          <ClipboardCheck className="h-4 w-4 text-gray-700 flex-shrink-0" />
                          <span className="truncate">Hecho</span>
                        </div>
                      </div>
                      <span className="flex-shrink-0 text-xs font-semibold text-gray-500">
                        {formData.fechaHecho ? fmtDateShort(formData.fechaHecho) : '—'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Detalle */}
                <div className="mt-4 min-w-0">
                  <label htmlFor="detalleTrabajoRealizado" className={labelBase}>
                    Medidas / materiales / detalle
                  </label>
                  <div className="relative min-w-0">
                    <Package className="pointer-events-none absolute left-3 top-4 h-4 w-4 text-gray-400" />
                    <textarea
                      id="detalleTrabajoRealizado"
                      value={formData.detalleTrabajoRealizado}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          detalleTrabajoRealizado: e.target.value,
                        })
                      }
                      placeholder="Medidas, materiales, notas…"
                      rows={4}
                      className={textareaBase}
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Footer actions */}
            <div className="sticky bottom-0 z-10 border-t border-gray-100 bg-white/80 px-6 py-4 backdrop-blur overflow-x-hidden">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end min-w-0">
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Guardando…' : avisoEditar ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
