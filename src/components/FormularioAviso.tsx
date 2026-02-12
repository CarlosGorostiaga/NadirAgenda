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
  if (a.fechaHecho) return 'hecho';
  if (a.fechaPresupuestoAceptado) return 'presupuesto_aceptado';
  if (a.fechaPresupuestoEnviado) return 'presupuesto_enviado';
  if (a.fechaVisto) return 'visto';
  return 'pendiente';
}

export default function FormularioAviso({
  onSuccess,
  onCancel,
  avisoEditar,
}: FormularioAvisoProps) {
  const [formData, setFormData] = useState({
    // IMPORTANTE: “Dirección / Comunidad” es lo principal
    direccion: avisoEditar?.direccion || '',
    nombre: avisoEditar?.nombre || '',
    telefono: avisoEditar?.telefono || '',
    motivo: avisoEditar?.motivo || '',
    administracion: avisoEditar?.administracion || '',
    contactoAdmin: avisoEditar?.contactoAdmin || '',
    detalleTrabajoRealizado: avisoEditar?.detalleTrabajoRealizado || '',

    mantenimiento: avisoEditar?.mantenimiento ?? false,

    // Cita
    citaAt: avisoEditar?.citaAt ?? null,

    // Checklist con fechas
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

  const inputBase =
    'w-full rounded-xl border border-gray-200 bg-white px-10 py-3 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

  const textareaBase =
    'w-full resize-none rounded-xl border border-gray-200 bg-white px-10 py-3 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

  const labelBase = 'mb-2 block text-sm font-medium text-gray-700';

  const setChecklist = (key: ChecklistKey, checked: boolean) => {
    const now = new Date();

    setFormData((prev) => {
      // Cascada para mantener coherencia
      const next = { ...prev };

      const setOrClear = (field: keyof typeof next, on: boolean) => {
        (next as any)[field] = on ? ((prev as any)[field] ?? now) : null;
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
        // si marca enviado, asumimos visto también si no estaba
        if (checked && !prev.fechaVisto) next.fechaVisto = now;
        setOrClear('fechaPresupuestoEnviado', checked);
        if (!checked) {
          next.fechaPresupuestoAceptado = null;
          next.fechaHecho = null;
        }
      }

      if (key === 'presupuesto_aceptado') {
        // si marca aceptado, asumimos visto + enviado si no estaban
        if (checked && !prev.fechaVisto) next.fechaVisto = now;
        if (checked && !prev.fechaPresupuestoEnviado) next.fechaPresupuestoEnviado = now;
        setOrClear('fechaPresupuestoAceptado', checked);
        if (!checked) {
          next.fechaHecho = null;
        }
      }

      if (key === 'hecho') {
        // si marca hecho, asumimos visto + enviado + aceptado
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
      const now = new Date();

      // Si es mantenimiento “modo rápido”:
      // solo nos importa dirección/comunidad y marcar hecho (con fecha) si lo han tocado.
      const payload: Partial<Aviso> = {
        ...formData,
        estado: deriveEstado(formData as any),
      };

      // Si crea y viene “hecho” sin fecha, le ponemos now
      if (!payload.fechaHecho && (formData as any).__hechoMarkedNow) {
        payload.fechaHecho = now;
      }

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
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative mx-auto flex min-h-full max-w-3xl items-center justify-center p-4">
        <div className="w-full overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
          {/* Top bar */}
          <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 px-6 py-4 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-wide text-gray-500">Avisos</p>
                <h2 className="text-xl font-semibold text-gray-900">
                  {avisoEditar ? 'Editar aviso' : 'Nuevo aviso'}
                </h2>
              </div>

              <button
                type="button"
                onClick={onCancel}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="max-h-[78vh] overflow-y-auto">
            <div className="space-y-6 p-6">
              {/* Toggle Mantenimiento */}
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-black/5">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-3 transition hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.mantenimiento}
                    onChange={(e) => setFormData({ ...formData, mantenimiento: e.target.checked })}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Repeat className="h-4 w-4 text-gray-700" />
                      Mantenimiento
                    </div>
                    <div className="text-sm text-gray-600">
                      Si está activado, puedes registrar rápido solo con dirección/comunidad.
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${estadoPillClass}`}
                    title="Estado actual"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {estadoLabel}
                  </span>
                </label>
              </section>

              {/* Dirección / Comunidad (siempre visible y lo primero) */}
              <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </span>
                  Dirección / Comunidad
                </h3>

                <label htmlFor="direccion" className={labelBase}>
                  Dirección (dato principal)
                </label>
                <div className="relative">
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

                {/* Mantenimiento: modo rápido -> check Hecho */}
                {formData.mantenimiento && (
                  <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-black/5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Registro rápido</div>
                        <div className="text-sm text-gray-600">
                          Marca <b>Hecho</b> y se guardará la fecha automáticamente.
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-500">
                        {formData.fechaHecho ? `Hecho: ${fmtDateShort(formData.fechaHecho)}` : '—'}
                      </span>
                    </div>

                    <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 transition hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={!!formData.fechaHecho}
                        onChange={(e) => setChecklist('hecho', e.target.checked)}
                        className="h-4 w-4"
                      />
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <ClipboardCheck className="h-4 w-4 text-gray-700" />
                        Hecho
                      </div>
                    </label>
                  </div>
                )}
              </section>

              {/* Si NO es mantenimiento, se ve el formulario normal */}
              {!formData.mantenimiento && (
                <>
                  {/* Datos “normales” */}
                  <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-black/5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 ring-1 ring-black/5">
                        <FileEdit className="h-5 w-5 text-blue-600" />
                      </span>
                      Datos del aviso
                    </h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor="nombre" className={labelBase}>
                          Nombre
                        </label>
                        <div className="relative">
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

                      <div>
                        <label htmlFor="telefono" className={labelBase}>
                          Teléfono
                        </label>
                        <div className="relative">
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

                      <div className="md:col-span-2">
                        <label htmlFor="motivo" className={labelBase}>
                          Motivo
                        </label>
                        <div className="relative">
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

                  {/* Administración */}
                  <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-black/5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 ring-1 ring-black/5">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </span>
                        Administración
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor="administracion" className={labelBase}>
                          Administración
                        </label>
                        <div className="relative">
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

                      <div>
                        <label htmlFor="contactoAdmin" className={labelBase}>
                          Contacto
                        </label>
                        <div className="relative">
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

              {/* Detalle + Cita + Checklist (SIEMPRE disponible, especialmente cuando “pinchas”) */}
              <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                      <Wrench className="h-5 w-5 text-blue-600" />
                    </span>
                    Seguimiento (cita + checks + detalle)
                  </h3>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${estadoPillClass}`}
                    title="Estado actual"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {estadoLabel}
                  </span>
                </div>

                {/* Cita */}
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-black/5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <CalendarClock className="h-4 w-4 text-gray-700" />
                        Cita
                      </div>
                      <div className="text-sm text-gray-600">
                        Programa la visita para ir a verlo (día y hora manual).
                      </div>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
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
                    <div className="mt-4">
                      <label className={labelBase} htmlFor="citaAt">
                        Día y hora
                      </label>
                      <div className="relative">
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
                <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-black/5">
                  <div className="text-sm font-semibold text-gray-900">
                    Checklist (guarda fecha al marcar)
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 transition hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!formData.fechaVisto}
                          onChange={(e) => setChecklist('visto', e.target.checked)}
                          className="h-4 w-4"
                        />
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <Eye className="h-4 w-4 text-gray-700" />
                          Visto
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-500">
                        {formData.fechaVisto ? fmtDateShort(formData.fechaVisto) : '—'}
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 transition hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!formData.fechaPresupuestoEnviado}
                          onChange={(e) => setChecklist('presupuesto_enviado', e.target.checked)}
                          className="h-4 w-4"
                        />
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <Send className="h-4 w-4 text-gray-700" />
                          Presupuesto enviado
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-500">
                        {formData.fechaPresupuestoEnviado
                          ? fmtDateShort(formData.fechaPresupuestoEnviado)
                          : '—'}
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 transition hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!formData.fechaPresupuestoAceptado}
                          onChange={(e) => setChecklist('presupuesto_aceptado', e.target.checked)}
                          className="h-4 w-4"
                        />
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <CheckCircle2 className="h-4 w-4 text-gray-700" />
                          Presupuesto aceptado
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-500">
                        {formData.fechaPresupuestoAceptado
                          ? fmtDateShort(formData.fechaPresupuestoAceptado)
                          : '—'}
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 transition hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!formData.fechaHecho}
                          onChange={(e) => setChecklist('hecho', e.target.checked)}
                          className="h-4 w-4"
                        />
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <ClipboardCheck className="h-4 w-4 text-gray-700" />
                          Hecho
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-500">
                        {formData.fechaHecho ? fmtDateShort(formData.fechaHecho) : '—'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Detalle trabajo / materiales */}
                <div className="mt-4">
                  <label htmlFor="detalleTrabajoRealizado" className={labelBase}>
                    Medidas / materiales / detalle
                  </label>
                  <div className="relative">
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
            <div className="sticky bottom-0 z-10 border-t border-gray-100 bg-white/80 px-6 py-4 backdrop-blur">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
