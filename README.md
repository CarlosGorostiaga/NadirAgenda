# 🔔 Gestor de Avisos - PWA

Aplicación web progresiva (PWA) para gestionar avisos de trabajos de fontanería y mantenimiento.

## 📋 Características

- ✅ Gestión completa de avisos
- 📱 PWA installable
- 💾 Almacenamiento local con IndexedDB
- 📥 Backup/Restore en JSON
- 🎨 Interfaz moderna
- ⚡ Funciona offline

## 🗃️ Campos del Aviso

**Cliente:** nombre, dirección, teléfono, motivo  
**Administración:** empresa + contacto que derivó  
**Trabajo:** detalle de materiales, estado (Pendiente/Visto/Presupuesto Aceptado)

## 🚀 Uso con VSCode Dev Container

1. Abre el proyecto en VSCode
2. Instala extensión "Dev Containers"
3. `Ctrl+Shift+P` → "Dev Containers: Reopen in Container"
4. Espera a que se construya (solo primera vez)
5. Abre http://localhost:4321

¡Listo! Todo configurado automáticamente.

## 💾 Backup de Datos

**Exportar:** Click en "💾 Exportar Backup" → guarda el JSON  
**Importar:** Click en "📥 Importar Backup" → selecciona el JSON

## 📱 Instalar como App

**Android/Chrome:** Menú → "Agregar a pantalla de inicio"  
**iOS/Safari:** Compartir → "Agregar a pantalla de inicio"  
**Desktop:** Icono de instalación en barra de direcciones

## 🛠️ Stack Técnico

- Astro + React + TypeScript
- IndexedDB (Dexie.js)
- Service Worker + PWA Manifest

## 📦 Deploy

Build de producción:

```bash
npm run build
```

Deploy en Netlify/Vercel/Cloudflare Pages (GRATIS)

---

npm run dev -- --host 0.0.0.0 --port 4321
