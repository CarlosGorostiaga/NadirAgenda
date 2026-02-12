let deferredPrompt = null;

// Registro SW + update flow
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registrado:', registration.scope);

      // Si hay update, lo aplica
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            // Si ya había uno controlando, refrescamos para coger assets nuevos
            if (navigator.serviceWorker.controller) {
              console.log('🔄 Nuevo SW instalado. Recargando para actualizar…');
              window.location.reload();
            }
          }
        });
      });

      // Check update al arrancar (útil en dev y en producción)
      if (registration.update) registration.update();
    } catch (error) {
      console.log('❌ Error al registrar Service Worker:', error);
    }
  });
}

// Prompt para instalar PWA
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('💡 App lista para instalarse (usa botón propio si quieres)');
});

window.addEventListener('appinstalled', () => {
  console.log('✅ PWA instalada');
  deferredPrompt = null;
});

// Opcional: si luego quieres un botón "Instalar"
// window.installPWA = async () => {
//   if (!deferredPrompt) return;
//   deferredPrompt.prompt();
//   await deferredPrompt.userChoice;
//   deferredPrompt = null;
// };
