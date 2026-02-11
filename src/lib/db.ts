import Dexie, { type EntityTable } from 'dexie';

export interface Aviso {
  id?: number;
  nombre: string;
  direccion: string;
  telefono: string;
  motivo: string;
  administracion: string;
  contactoAdmin: string;
  detalleTrabajoRealizado: string;
  estado: 'pendiente' | 'visto' | 'presupuesto_aceptado';
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

const db = new Dexie('GestorAvisosDB') as Dexie & {
  avisos: EntityTable<Aviso, 'id'>;
};

// Schema declaration
db.version(1).stores({
  avisos: '++id, nombre, estado, fechaCreacion, administracion'
});

export { db };

// Funciones helper para CRUD
export const avisosDB = {
  // Crear aviso
  async crear(aviso: Omit<Aviso, 'id' | 'fechaCreacion' | 'fechaActualizacion'>) {
    const nuevoAviso: Omit<Aviso, 'id'> = {
      ...aviso,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };
    return await db.avisos.add(nuevoAviso);
  },

  // Obtener todos los avisos
  async obtenerTodos() {
    return await db.avisos.orderBy('fechaCreacion').reverse().toArray();
  },

  // Obtener por ID
  async obtenerPorId(id: number) {
    return await db.avisos.get(id);
  },

  // Actualizar aviso
  async actualizar(id: number, cambios: Partial<Aviso>) {
    return await db.avisos.update(id, {
      ...cambios,
      fechaActualizacion: new Date()
    });
  },

  // Eliminar aviso
  async eliminar(id: number) {
    return await db.avisos.delete(id);
  },

  // Filtrar por estado
  async filtrarPorEstado(estado: Aviso['estado']) {
    return await db.avisos.where('estado').equals(estado).toArray();
  },

  // Contar avisos pendientes
  async contarPendientes() {
    return await db.avisos.where('estado').equals('pendiente').count();
  },

  // Exportar todos los datos
  async exportarDatos() {
    const avisos = await db.avisos.toArray();
    return {
      version: 1,
      fecha: new Date().toISOString(),
      avisos
    };
  },

  // Importar datos
  async importarDatos(datos: { avisos: Aviso[] }) {
    await db.avisos.clear();
    return await db.avisos.bulkAdd(datos.avisos);
  }
};
