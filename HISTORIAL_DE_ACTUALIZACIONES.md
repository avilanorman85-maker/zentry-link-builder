# 📜 Historial de Actualizaciones y Mejoras — Zentry Link

Registro cronológico detallado de todas las actualizaciones, correcciones de errores, nuevas funciones y optimizaciones de rendimiento aplicadas en la plataforma **Zentry Link**.

---

## 🚀 Versión 2.3 — Optimización Extrema de Carga y Auto-CDN para HTML (Actual)
*Fecha: 28 de Agosto, 2026*

### ⚡ Rendimiento y Velocidad de Carga (Sub-segundo):
- **Server Loaders SSR en Rutas Públicas (`src/routes/$.tsx` y `src/routes/p.$slug.tsx`):**
  - Se eliminó el retraso de 4 a 6 segundos en la carga de páginas públicas implementando consultas directas en el servidor antes de entregar el HTML al navegador.
  - Tiempo de entrega reducido a **0.6 - 1.1 segundos**.
- **Optimizador Automático de Imágenes Base64 (`src/routes/app.builder.$id.tsx`):**
  - Al importar archivos HTML grandes (como páginas de 5 MB a 10 MB con imágenes incrustadas en Base64), el sistema las extrae automáticamente, las sube al bucket de Supabase Storage (`page-assets`) y las reemplaza por URLs ultralivianas de CDN.
  - El peso de las páginas en la base de datos se redujo en un **99.8%** (de 5,136 KB a solo 12 KB).
- **Políticas RLS en Supabase Storage:**
  - Habilitación de permisos de inserción y lectura pública en `storage.objects` para subidas fluidas de activos.

### 🛠️ Corrección de Errores Críticos:
- **Solución al Parpadeo / Pantalla Vacía al Refrescar (`src/routes/$.tsx`):**
  - Se corrigió el error donde el fallback de navegación redirigía al usuario prematuramente si el cliente rehidrataba antes de confirmar el loader.
- **Soporte Completo para Calculadoras e Interactividad JS (`src/components/HtmlIframe.tsx`):**
  - Se inyectó un polyfill seguro para `localStorage` y `sessionStorage` que previene errores de seguridad (`SecurityError` / `DOMException`) en iframes.
  - Se mantuvieron todos los permisos de sandbox (`allow-scripts`, `allow-same-origin`, `allow-forms`, `allow-modals`, `allow-popups`, etc.) para que sliders, cálculos de fórmulas, pestañas y descarga de CSV funcionen sin trabas.
- **Corrección de Variable `blocks is not defined` en `PublicPageView.tsx`:**
  - Reordenamiento seguro de variables para evitar errores de render SSR.

### 📱 Experiencia de Usuario y Constructor Visual:
- **PhoneFrame Ampliado y Adaptable (`src/components/PhoneFrame.tsx`):**
  - Se aumentó el ancho del marco del iPhone de 340px a **360px** y su altura máxima de 650px a **850px** (`calc(100vh - 110px)`).
  - Se reposicionó la *Dynamic Island* y la barra de estado superior para evitar que tapen encabezados o botones de las páginas.
- **Memoización de `srcDoc`:**
  - El editor visual ahora memoiza el procesamiento de código HTML para evitar congelamientos o lentitud al escribir mientras hay archivos HTML pesados en pantalla.

---

## 🎨 Versión 2.2 — Transformación a Plataforma de Alojamiento Web
*Fecha: 27 de Agosto, 2026*

### 🌐 Transformación de Marca y Copy:
- **Nueva Landing Page Principal (`src/routes/index.tsx`):**
  - Se transformó el enfoque de "Recetario" a **"Plataforma de Alojamiento y Lanzamiento de Páginas de Venta, Calculadoras y Apps Web en HTML"**.
  - Encabezados dinámicos con efecto *Neon Glow*, métricas de rendimiento y rejilla de características renovada.
- **Ajustes en Configuración y Suscripción:**
  - Se actualizaron los textos de perfil a *"Sitio y Marca"* y se integró *"Alojamiento HTML Completo"* en las características del plan VIP.

---

## 🔐 Versión 2.1 — Simplificación de Autenticación y Seguridad
*Fecha: 26 de Agosto, 2026*

### 🔑 Autenticación Directa:
- **Remoción de Google OAuth:**
  - Se simplificó el flujo de autenticación dejando exclusivamente el acceso mediante **Correo Electrónico y Contraseña**.
  - Modal de autenticación renovado con pestañas de *Iniciar Sesión* y *Crear Cuenta*, validación de contraseñas y aceptación de términos.

### 📊 Analíticas de Clics en Bloques HTML:
- **Tracking Bidireccional (`src/components/HtmlIframe.tsx` y `src/components/PublicPageView.tsx`):**
  - Implementación de escucha de eventos vía `window.postMessage` para capturar clics en botones de compra dentro de páginas HTML importadas y registrarlos en la tabla `page_events`.
  - Desglose de clics individuales en el panel de estadísticas (`/app/stats`).

---

## 🏗️ Versión 1.0 — Lanzamiento Inicial
*Fecha: Agosto, 2026*

- Creación de la arquitectura base con TanStack Start, Supabase PostgreSQL, Tailwind CSS y Vercel.
- Constructor visual en 3 paneles con reordenamiento de bloques vía Framer Motion.
- Sistema de canje de códigos de activación para planes Premium y VIP.
- Gráficas de analíticas en tiempo real con Recharts.

---
*Este documento se actualiza automáticamente con cada mejora o cambio estructural en la plataforma.*
