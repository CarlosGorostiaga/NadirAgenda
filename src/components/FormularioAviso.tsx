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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-900">
            {avisoEditar ? 'Editar Aviso' : 'Añadir Aviso'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Datos del Cliente */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
              <FileEdit className="w-5 h-5 text-blue-600" />
              Datos del Cliente
            </h3>

            <div>
              <label
                htmlFor="nombre"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
              >
                <User className="w-4 h-4 text-gray-400" />
                Nombre del cliente *
              </label>
              <input
                id="nombre"
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre completo"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label
                htmlFor="direccion"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
              >
                <MapPin className="w-4 h-4 text-gray-400" />
                Dirección *
              </label>
              <input
                id="direccion"
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Dirección completa"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label
                htmlFor="telefono"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
              >
                <Phone className="w-4 h-4 text-gray-400" />
                Teléfono
              </label>
              <input
                id="telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="Número de contacto"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label
                htmlFor="motivo"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
              >
                <FileEdit className="w-4 h-4 text-gray-400" />
                Motivo del aviso *
              </label>
              <textarea
                id="motivo"
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                placeholder="Gotera, atasco, avería..."
                rows={3}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
              />
            </div>
          </div>

          {/* Datos de la Administración */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
              <Building2 className="w-5 h-5 text-blue-600" />
              Administración
            </h3>

            <div>
              <label
                htmlFor="administracion"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
              >
                <Building2 className="w-4 h-4 text-gray-400" />
                Administración *
              </label>
              <input
                id="administracion"
                type="text"
                value={formData.administracion}
                onChange={(e) => setFormData({ ...formData, administracion: e.target.value })}
                placeholder="Nombre de la administración"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label
                htmlFor="contactoAdmin"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
              >
                <UserCircle className="w-4 h-4 text-gray-400" />
                Contacto en administración *
              </label>
              <input
                id="contactoAdmin"
                type="text"
                value={formData.contactoAdmin}
                onChange={(e) => setFormData({ ...formData, contactoAdmin: e.target.value })}
                placeholder="Persona que te pasó el aviso"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>

          {/* Detalle del Trabajo */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
              <Wrench className="w-5 h-5 text-blue-600" />
              Trabajo Realizado
            </h3>

            <div>
              <label
                htmlFor="detalleTrabajoRealizado"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
              >
                <Package className="w-4 h-4 text-gray-400" />
                Materiales y trabajo
              </label>
              <textarea
                id="detalleTrabajoRealizado"
                value={formData.detalleTrabajoRealizado}
                onChange={(e) =>
                  setFormData({ ...formData, detalleTrabajoRealizado: e.target.value })
                }
                placeholder="3 metros de canaló, poliuretano, caucho..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="estado"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
              >
                <Clock className="w-4 h-4 text-gray-400" />
                Estado
              </label>
              <select
                id="estado"
                value={formData.estado}
                onChange={(e) =>
                  setFormData({ ...formData, estado: e.target.value as Aviso['estado'] })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-white"
              >
                <option value="pendiente">Pendiente</option>
                <option value="visto">Visto</option>
                <option value="presupuesto_aceptado">Presupuesto Aceptado</option>
              </select>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors border border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg disabled:cursor-not-allowed"
            >
              {loading ? (
                'Guardando...'
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {avisoEditar ? 'Actualizar' : 'Guardar'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
