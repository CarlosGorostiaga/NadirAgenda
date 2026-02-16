import { useMemo, useState } from 'react';
import { apiClient } from '../lib/apiClient';
import { Eye, EyeOff, Lock, Mail, LogIn, UserPlus } from 'lucide-react';

type Mode = 'login' | 'register';

export default function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'ok' | 'warning'; text: string } | null>(null);
  const [showResendBtn, setShowResendBtn] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  const title = useMemo(() => (mode === 'login' ? 'Accede a tu panel' : 'Crea tu cuenta'), [mode]);
  const subtitle = useMemo(
    () =>
      mode === 'login'
        ? 'Entra con tu email y contraseña.'
        : 'Recibirás un email de verificación al registrarte.',
    [mode]
  );

  const canSubmit = email.trim().length > 3 && password.length >= 6 && !loading;

  const handle = async () => {
    setMsg(null);
    setShowResendBtn(false);
    setLoading(true);

    try {
      if (mode === 'login') {
        await apiClient.login(email.trim(), password);
        setMsg({ type: 'ok', text: '¡Dentro! Cargando…' });

        setTimeout(() => window.location.reload(), 500);
        return;
      }

      // Register
      await apiClient.register(email.trim(), password);
      setMsg({
        type: 'ok',
        text: '✅ Cuenta creada. Revisa tu email para verificar tu cuenta y poder entrar.',
      });

      // Cambiar a modo login después de 3 segundos
      setTimeout(() => {
        setMode('login');
        setMsg(null);
      }, 5000);
    } catch (e: any) {
      const errorMsg = e.message || 'Error desconocido';

      // Si el error es de email no verificado
      if (errorMsg.includes('Email no verificado') || errorMsg.includes('no verificado')) {
        setMsg({
          type: 'warning',
          text: '⚠️ Tu email aún no está verificado. Revisa tu bandeja de entrada.',
        });
        setShowResendBtn(true);
      } else {
        setMsg({ type: 'error', text: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendingEmail(true);
    setMsg(null);

    try {
      await apiClient.resendVerification(email.trim());
      setMsg({
        type: 'ok',
        text: '✅ Email reenviado. Revisa tu bandeja de entrada (y spam).',
      });
      setShowResendBtn(false);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Error al reenviar email' });
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
      <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.18),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.14),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(168,85,247,0.12),transparent_55%)]" />

      <div className="relative w-full max-w-md">
        <div className="overflow-hidden rounded-2xl bg-white/85 backdrop-blur border border-white/60 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
          <div className="p-6 border-b border-gray-100 bg-white/70 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500">Nadir</p>
                <h1 className="mt-1 text-xl font-semibold text-gray-900">{title}</h1>
                <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-gray-50 p-1 ring-1 ring-gray-200">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setMsg(null);
                  setShowResendBtn(false);
                }}
                className={[
                  'rounded-xl px-3 py-2 text-sm font-semibold transition',
                  mode === 'login'
                    ? 'bg-white shadow-sm ring-1 ring-black/5 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900',
                ].join(' ')}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Entrar
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setMsg(null);
                  setShowResendBtn(false);
                }}
                className={[
                  'rounded-xl px-3 py-2 text-sm font-semibold transition',
                  mode === 'register'
                    ? 'bg-white shadow-sm ring-1 ring-black/5 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900',
                ].join(' ')}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Crear cuenta
                </span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {msg && (
              <div
                className={[
                  'rounded-2xl border px-4 py-3 text-sm font-semibold',
                  msg.type === 'ok'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : msg.type === 'warning'
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-rose-200 bg-rose-50 text-rose-800',
                ].join(' ')}
              >
                {msg.text}
              </div>
            )}

            {showResendBtn && (
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resendingEmail}
                className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resendingEmail ? 'Reenviando...' : '📧 Reenviar email de verificación'}
              </button>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="tuemail@correo.com"
                  className="w-full rounded-xl border border-gray-200 bg-white px-10 py-3 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">Contraseña</label>
                {mode === 'login' && (
                  <a
                    href="/forgot-password"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                )}
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPass ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="mín. 6 caracteres"
                  className="w-full rounded-xl border border-gray-200 bg-white px-10 pr-11 py-3 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {mode === 'register' && (
                <p className="mt-2 text-xs text-gray-500">
                  Al registrarte recibirás un email de verificación. Tu trial de <b>30 días</b>{' '}
                  empezará al verificar.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handle}
              disabled={!canSubmit}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {loading ? (
                <>
                  <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  Procesando…
                </>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="h-4 w-4" />
                  Entrar
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Crear cuenta
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-gray-500">
              {mode === 'register'
                ? 'Usa un email real para recibir el enlace de verificación.'
                : 'Asegúrate de haber verificado tu email.'}
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Carlosgorostiaga.dev · Gestor de avisos
        </div>
      </div>
    </div>
  );
}
