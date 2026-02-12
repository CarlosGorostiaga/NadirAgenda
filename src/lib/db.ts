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

  mantenimiento: boolean;

  estado: 'pendiente' | 'visto' | 'presupuesto_aceptado';

  // fechas de estado
  fechaVisto?: Date | null;
  fechaPresupuestoAceptado?: Date | null;

  fechaCreacion: Date;
  fechaActualizacion: Date;
}

const db = new Dexie('GestorAvisosDB') as Dexie & {
  avisos: EntityTable<Aviso, 'id'>;
};

// v1
db.version(1).stores({
  avisos: '++id, nombre, estado, fechaCreacion, administracion',
});

// v2: añadimos mantenimiento y fechas de estado (y hacemos upgrade)
db.version(2)
  .stores({
    avisos:
      '++id, nombre, estado, fechaCreacion, administracion, mantenimiento, fechaVisto, fechaPresupuestoAceptado',
  })
  .upgrade(async (tx) => {
    const table = tx.table('avisos');
    await table.toCollection().modify((a: any) => {
      if (typeof a.mantenimiento !== 'boolean') a.mantenimiento = false;

      if (typeof a.fechaVisto === 'string') a.fechaVisto = new Date(a.fechaVisto);
      if (typeof a.fechaPresupuestoAceptado === 'string')
        a.fechaPresupuestoAceptado = new Date(a.fechaPresupuestoAceptado);

      if (a.fechaVisto === undefined) a.fechaVisto = null;
      if (a.fechaPresupuestoAceptado === undefined) a.fechaPresupuestoAceptado = null;

      if (typeof a.fechaCreacion === 'string') a.fechaCreacion = new Date(a.fechaCreacion);
      if (typeof a.fechaActualizacion === 'string')
        a.fechaActualizacion = new Date(a.fechaActualizacion);
    });
  });

export { db };

// Helpers
const toDate = (v: any): Date | null => {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const normalizeAviso = (a: any): Aviso => {
  const fechaCreacion = toDate(a.fechaCreacion) ?? new Date();
  const fechaActualizacion = toDate(a.fechaActualizacion) ?? new Date();

  return {
    id: a.id,

    nombre: a.nombre ?? '',
    direccion: a.direccion ?? '',
    telefono: a.telefono ?? '',
    motivo: a.motivo ?? '',
    administracion: a.administracion ?? '',
    contactoAdmin: a.contactoAdmin ?? '',
    detalleTrabajoRealizado: a.detalleTrabajoRealizado ?? '',

    mantenimiento: typeof a.mantenimiento === 'boolean' ? a.mantenimiento : false,

    estado: a.estado ?? 'pendiente',

    fechaVisto: toDate(a.fechaVisto),
    fechaPresupuestoAceptado: toDate(a.fechaPresupuestoAceptado),

    fechaCreacion,
    fechaActualizacion,
  };
};

export const avisosDB = {
  async crear(aviso: Omit<Aviso, 'id' | 'fechaCreacion' | 'fechaActualizacion'>) {
    const now = new Date();
    const nuevoAviso: Omit<Aviso, 'id'> = normalizeAviso({
      ...aviso,
      fechaCreacion: now,
      fechaActualizacion: now,
      // defaults si vienen undefined
      mantenimiento: (aviso as any).mantenimiento ?? false,
      fechaVisto: (aviso as any).fechaVisto ?? null,
      fechaPresupuestoAceptado: (aviso as any).fechaPresupuestoAceptado ?? null,
    });
    return await db.avisos.add(nuevoAviso);
  },

  async obtenerTodos() {
    return await db.avisos.orderBy('fechaCreacion').reverse().toArray();
  },

  async obtenerPorId(id: number) {
    return await db.avisos.get(id);
  },

  async actualizar(id: number, cambios: Partial<Aviso>) {
    const now = new Date();
    const update: any = {
      ...cambios,
      fechaActualizacion: now,
    };
    return await db.avisos.update(id, update);
  },

  async eliminar(id: number) {
    return await db.avisos.delete(id);
  },

  async filtrarPorEstado(estado: Aviso['estado']) {
    return await db.avisos.where('estado').equals(estado).toArray();
  },

  async contarPendientes() {
    return await db.avisos.where('estado').equals('pendiente').count();
  },

  async exportarDatos() {
    const avisos = await db.avisos.toArray();
    return {
      version: 2,
      fecha: new Date().toISOString(),
      avisos,
    };
  },

  async importarDatos(datos: { avisos: Aviso[] }) {
    const lista = Array.isArray(datos?.avisos) ? datos.avisos : [];
    const normalizados = lista.map((a: any) => normalizeAviso(a));

    await db.avisos.clear();
    return await db.avisos.bulkAdd(normalizados);
  },
};
