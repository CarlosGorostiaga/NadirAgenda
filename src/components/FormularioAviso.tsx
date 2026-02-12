import { useState, type FormEvent } from 'react';
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
} from 'lucide-react';

interface FormularioAvisoProps {
  onSuccess: () => void;
  onCancel: () => void;
  avisoEditar?: Aviso;
}

export default function FormularioAviso({
  onSuccess,
  onCancel,
  avisoEditar,
}: FormularioAvisoProps) {
  const [formData, setFormData] = useState({
    nombre: avisoEditar?.nombre || '',
    direccion: avisoEditar?.direccion || '',
    telefono: avisoEditar?.telefono || '',
    motivo: avisoEditar?.motivo || '',
    administracion: avisoEditar?.administracion || '',
    contactoAdmin: avisoEditar?.contactoAdmin || '',
    detalleTrabajoRealizado: avisoEditar?.detalleTrabajoRealizado || '',
    estado: avisoEditar?.estado || ('pendiente' as const),
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

  const estadoLabel =
    formData.estado === 'pendiente'
      ? 'Pendiente'
      : formData.estado === 'visto'
        ? 'Visto'
        : 'Presupuesto aceptado';

  const estadoPillClass =
    formData.estado === 'pendiente'
      ? 'bg-amber-50 text-amber-700 ring-amber-200'
      : formData.estado === 'visto'
        ? 'bg-sky-50 text-sky-700 ring-sky-200'
        : 'bg-emerald-50 text-emerald-700 ring-emerald-200';

  const inputBase =
    'w-full rounded-xl border border-gray-200 bg-white px-10 py-3 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

  const textareaBase =
    'w-full resize-none rounded-xl border border-gray-200 bg-white px-10 py-3 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

  const labelBase = 'mb-2 block text-sm font-medium text-gray-700';

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop (click to close) */}
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
              {/* Section: Cliente */}
              <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                      <FileEdit className="h-5 w-5 text-blue-600" />
                    </span>
                    Datos del cliente
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Nombre */}
                  <div className="md:col-span-2">
                    <label htmlFor="nombre" className={labelBase}>
                      Nombre del cliente <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        id="nombre"
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Nombre completo"
                        required
                        className={inputBase}
                      />
                    </div>
                  </div>

                  {/* Dirección */}
                  <div className="md:col-span-2">
                    <label htmlFor="direccion" className={labelBase}>
                      Dirección <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        id="direccion"
                        type="text"
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        placeholder="Calle, número, piso..."
                        required
                        className={inputBase}
                      />
                    </div>
                  </div>

                  {/* Teléfono */}
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

                  {/* Motivo */}
                  <div className="md:col-span-1">
                    <label htmlFor="motivo" className={labelBase}>
                      Motivo del aviso <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FileEdit className="pointer-events-none absolute left-3 top-4 h-4 w-4 text-gray-400" />
                      <textarea
                        id="motivo"
                        value={formData.motivo}
                        onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                        placeholder="Gotera, atasco, avería..."
                        rows={4}
                        required
                        className={textareaBase}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Administración */}
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
                      Administración <span className="text-red-500">*</span>
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
                        required
                        className={inputBase}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contactoAdmin" className={labelBase}>
                      Contacto <span className="text-red-500">*</span>
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
                        required
                        className={inputBase}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Trabajo */}
              <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                      <Wrench className="h-5 w-5 text-blue-600" />
                    </span>
                    Trabajo y seguimiento
                  </h3>

                  {/* Estado pill */}
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${estadoPillClass}`}
                    title="Estado actual"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {estadoLabel}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label htmlFor="detalleTrabajoRealizado" className={labelBase}>
                      Materiales y trabajo
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
                        placeholder="3 metros de canalón, poliuretano, caucho..."
                        rows={4}
                        className={textareaBase}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="estado" className={labelBase}>
                      Estado
                    </label>
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <select
                        id="estado"
                        value={formData.estado}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            estado: e.target.value as Aviso['estado'],
                          })
                        }
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-10 py-3 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="visto">Visto</option>
                        <option value="presupuesto_aceptado">Presupuesto Aceptado</option>
                      </select>

                      {/* Chevron */}
                      <svg
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
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
