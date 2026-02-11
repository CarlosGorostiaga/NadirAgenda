// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado:', registration.scope);
      })
      .catch((error) => {
        console.log('❌ Error al registrar Service Worker:', error);
      });
  });
}

// Prompt para instalar PWA
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Puedes mostrar un botón personalizado aquí
  console.log('💡 App lista para instalarse');
});

window.addEventListener('appinstalled', () => {
  console.log('✅ PWA instalada');
  deferredPrompt = null;
});
