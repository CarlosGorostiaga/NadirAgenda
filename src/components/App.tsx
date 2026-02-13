import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../lib/apiClient';
import Login from './Login';
import GestorAvisos from './GestorAvisos';

type AccessState =
  | { status: 'loading' }
  | { status: 'logged_out' }
  | { status: 'blocked'; accessUntil: Date | null }
  | { status: 'allowed'; accessUntil: Date | null }
  | { status: 'error'; message: string };

function daysLeft(accessUntil: Date) {
  const ms = accessUntil.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function App() {
  const [state, setState] = useState<AccessState>({ status: 'loading' });

  const load = async () => {
    setState({ status: 'loading' });

    try {
      // Verificar si está autenticado
      if (!apiClient.isAuthenticated()) {
        setState({ status: 'logged_out' });
        return;
      }

      // Obtener acceso del usuario
      const access = await apiClient.getAccess();

      if (!access) {
        setState({ status: 'blocked', accessUntil: null });
        return;
      }

      const accessUntil = new Date(access.access_until);
      const allowed = access.has_access;

      setState(allowed ? { status: 'allowed', accessUntil } : { status: 'blocked', accessUntil });
    } catch (e: any) {
      const msg = String(e?.message ?? e ?? 'Error desconocido');
      setState({ status: 'error', message: msg });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const banner = useMemo(() => {
    if (state.status !== 'allowed' || !state.accessUntil) return null;
    const d = daysLeft(state.accessUntil);
    return `Te quedan ${d} día${d === 1 ? '' : 's'} de acceso.`;
  }, [state]);

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="rounded-2xl border border-gray-100 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-black/5">
          Cargando…
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm ring-1 ring-black/5">
          <h2 className="text-lg font-semibold">Error al conectar</h2>
          <p className="mt-2 text-sm opacity-90">{state.message}</p>

          <div className="mt-5 flex flex-col gap-2">
            <button
              onClick={load}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Reintentar
            </button>

            <button
              onClick={() => {
                apiClient.logout();
                setState({ status: 'logged_out' });
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === 'logged_out') return <Login />;

  if (state.status === 'blocked') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-lg font-semibold text-gray-900">Acceso caducado</h2>
          <p className="mt-2 text-sm text-gray-600">
            Tu mes gratis ha terminado. Para seguir usando la app tendrás que activar un plan.
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <button
              onClick={() => alert('Aquí irá el pago (Stripe)')}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Ver planes
            </button>

            <button
              onClick={() => {
                apiClient.logout();
                setState({ status: 'logged_out' });
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {banner && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
            {banner}
          </div>
        </div>
      )}
      <GestorAvisos />
    </div>
  );
}
