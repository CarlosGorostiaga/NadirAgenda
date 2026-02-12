import Dexie, { type EntityTable } from 'dexie';

export interface Aviso {
  id?: number;

  // El cliente quiere que esto sea lo más importante
  direccion: string;

  // Secundarios
  nombre: string;
  telefono: string;
  motivo: string;
  administracion: string;
  contactoAdmin: string;
  detalleTrabajoRealizado: string;

  mantenimiento: boolean;

  // Estado actual (lo mantenemos para compatibilidad + filtros)
  estado: 'pendiente' | 'visto' | 'presupuesto_enviado' | 'presupuesto_aceptado' | 'hecho';

  // Checklist con fecha automática
  fechaVisto?: Date | null;
  fechaPresupuestoEnviado?: Date | null;
  fechaPresupuestoAceptado?: Date | null;
  fechaHecho?: Date | null;

  // Cita (día + hora manual)
  citaAt?: Date | null;

  fechaCreacion: Date;
  fechaActualizacion: Date;
}

const db = new Dexie('GestorAvisosDB') as Dexie & {
  avisos: EntityTable<Aviso, 'id'>;
};

// v1 (tu antiguo)
db.version(1).stores({
  avisos: '++id, nombre, estado, fechaCreacion, administracion',
});

// v2 (tu anterior con mantenimiento + fechas visto/aceptado)
db.version(2).stores({
  avisos:
    '++id, nombre, estado, fechaCreacion, administracion, mantenimiento, fechaVisto, fechaPresupuestoAceptado',
});

// v3 (nuevo: direccion prioritaria + presupuesto_enviado + hecho + cita)
db.version(3)
  .stores({
    avisos:
      '++id, direccion, nombre, estado, fechaCreacion, administracion, mantenimiento, fechaVisto, fechaPresupuestoEnviado, fechaPresupuestoAceptado, fechaHecho, citaAt',
  })
  .upgrade(async (tx) => {
    const table = tx.table('avisos');
    await table.toCollection().modify((a: any) => {
      // defaults
      if (typeof a.direccion !== 'string') a.direccion = a.direccion ?? '';
      if (typeof a.nombre !== 'string') a.nombre = a.nombre ?? '';
      if (typeof a.telefono !== 'string') a.telefono = a.telefono ?? '';
      if (typeof a.motivo !== 'string') a.motivo = a.motivo ?? '';
      if (typeof a.administracion !== 'string') a.administracion = a.administracion ?? '';
      if (typeof a.contactoAdmin !== 'string') a.contactoAdmin = a.contactoAdmin ?? '';
      if (typeof a.detalleTrabajoRealizado !== 'string')
        a.detalleTrabajoRealizado = a.detalleTrabajoRealizado ?? '';

      if (typeof a.mantenimiento !== 'boolean') a.mantenimiento = false;

      // fechas parse strings
      const toDate = (v: any) => {
        if (!v) return null;
        if (v instanceof Date) return v;
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? null : d;
      };

      a.fechaVisto = toDate(a.fechaVisto);
      a.fechaPresupuestoEnviado = toDate(a.fechaPresupuestoEnviado);
      a.fechaPresupuestoAceptado = toDate(a.fechaPresupuestoAceptado);
      a.fechaHecho = toDate(a.fechaHecho);
      a.citaAt = toDate(a.citaAt);

      a.fechaCreacion = toDate(a.fechaCreacion) ?? new Date();
      a.fechaActualizacion = toDate(a.fechaActualizacion) ?? new Date();

      // Si venías de v2 con "presupuesto_aceptado", intenta mapear
      if (!a.fechaPresupuestoAceptado && a.estado === 'presupuesto_aceptado') {
        a.fechaPresupuestoAceptado = a.fechaActualizacion ?? new Date();
      }
      if (!a.fechaVisto && a.estado === 'visto') {
        a.fechaVisto = a.fechaActualizacion ?? new Date();
      }

      // Deriva estado por prioridad
      const estadoDerivado = a.fechaHecho
        ? 'hecho'
        : a.fechaPresupuestoAceptado
          ? 'presupuesto_aceptado'
          : a.fechaPresupuestoEnviado
            ? 'presupuesto_enviado'
            : a.fechaVisto
              ? 'visto'
              : 'pendiente';

      a.estado = estadoDerivado;
    });
  });

export { db };

const toDate = (v: any): Date | null => {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const deriveEstado = (a: any): Aviso['estado'] => {
  if (a.fechaHecho) return 'hecho';
  if (a.fechaPresupuestoAceptado) return 'presupuesto_aceptado';
  if (a.fechaPresupuestoEnviado) return 'presupuesto_enviado';
  if (a.fechaVisto) return 'visto';
  return 'pendiente';
};

const normalizeAviso = (a: any): Aviso => {
  const fechaCreacion = toDate(a.fechaCreacion) ?? new Date();
  const fechaActualizacion = toDate(a.fechaActualizacion) ?? new Date();

  const aviso: Aviso = {
    id: a.id,

    direccion: a.direccion ?? '',

    nombre: a.nombre ?? '',
    telefono: a.telefono ?? '',
    motivo: a.motivo ?? '',
    administracion: a.administracion ?? '',
    contactoAdmin: a.contactoAdmin ?? '',
    detalleTrabajoRealizado: a.detalleTrabajoRealizado ?? '',

    mantenimiento: typeof a.mantenimiento === 'boolean' ? a.mantenimiento : false,

    fechaVisto: toDate(a.fechaVisto),
    fechaPresupuestoEnviado: toDate(a.fechaPresupuestoEnviado),
    fechaPresupuestoAceptado: toDate(a.fechaPresupuestoAceptado),
    fechaHecho: toDate(a.fechaHecho),

    citaAt: toDate(a.citaAt),

    estado: 'pendiente', // se recalcula abajo
    fechaCreacion,
    fechaActualizacion,
  };

  aviso.estado = deriveEstado(aviso);

  return aviso;
};

export const avisosDB = {
  async crear(aviso: Omit<Aviso, 'id' | 'fechaCreacion' | 'fechaActualizacion'>) {
    const now = new Date();
    const nuevoAviso: Omit<Aviso, 'id'> = normalizeAviso({
      ...aviso,
      fechaCreacion: now,
      fechaActualizacion: now,
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

    // Recalcular estado si vienen cambios de checklist
    const current = await db.avisos.get(id);
    const merged = normalizeAviso({
      ...(current ?? {}),
      ...(cambios ?? {}),
      fechaActualizacion: now,
    });

    return await db.avisos.update(id, {
      ...cambios,
      estado: merged.estado,
      fechaActualizacion: now,
    });
  },

  async eliminar(id: number) {
    return await db.avisos.delete(id);
  },

  async filtrarPorEstado(estado: Aviso['estado']) {
    // Nota: estado está guardado, así que podemos filtrar directo
    return await db.avisos.where('estado').equals(estado).toArray();
  },

  async contarPendientes() {
    // Pendiente = sin checks (estado pendiente)
    return await db.avisos.where('estado').equals('pendiente').count();
  },

  async exportarDatos() {
    const avisos = await db.avisos.toArray();
    return {
      version: 3,
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
