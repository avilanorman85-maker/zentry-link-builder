# Zentry Link

Actúa como un desarrollador Full-Stack Senior experto en React, Tailwind CSS y Supabase. Vas a construir la app "Zentry Link" para "Zentry Company" con un enfoque en Vibe Coding y tiempo real.

### REGLA CRÍTICA DE NAVEGACIÓN (Evitar 404)
Implementa un estado de carga global (loading state) que verifique la sesión de Supabase Auth. Si no hay sesión, redirige SIEMPRE a la raíz `/`. Las rutas internas deben estar protegidas bajo `/app/*`. Si una ruta no existe, redirige a `/app/dashboard` si hay sesión, o a `/` si no la hay.

### 1. BRANDING Y LOGO
- Logo: Una 'Z' cristalina, 3D y multifacética con degradados cian y violeta (Logo de Zentry Company).
- Tema: Dark Mode Premium. Fondo #0B0F19 con efectos Glow Neón.

### 2. CONFIGURACIÓN Y PERFIL (Basado en Captura 5)
En la sección de "Configuración" (`/app/settings`), crea dos formularios claros:
- SECCIÓN PERFIL: Campos para "Nombre", "Email" (solo lectura) y "Bio" (Textarea para biografía).
- SECCIÓN RECETARIO/APP: Campos para "Nombre del recetario" y "URL pública".
- SECCIÓN ENLACE PÚBLICO: El input de URL debe mostrar el prefijo "https://" y el sufijo ".zentry.link". Implementa el candado visual para usuarios Free.

### 3. CONSTRUCTOR VISUAL UNIFICADO (Basado en Capturas 1, 2 y 6)
Crea la página de creación (`/app/builder/new` y `/app/builder/:id`) con un diseño de tres áreas:
- AREA 1: BARRA DE ELEMENTOS (Izquierda): Una columna vertical de iconos/botones para añadir bloques al instante: [Imagen], [Título], [Ingredientes], [Pasos], [Galería], [Video], [Redes Sociales] y [Botón].
- AREA 2: FORMULARIO DE EDICIÓN (Centro): Campos para "Título del producto/receta" y "Descripción corta". Debajo, configuración de "Estilos y Animaciones de Botón" con selector de efectos (Shake, Pulse, Float) y paleta de colores.
- AREA 3: VISTA MÓVIL (Derecha): Un marco de iPhone 15 Pro que previsualiza EN TIEMPO REAL todo lo que se añade o edita. Debe mostrar el carrusel de imágenes, el reproductor de video (YouTube/Vimeo/Drive), y los botones sociales.

### 4. DASHBOARD ANALÍTICO EN CERO (Basado en Captura 2)
En `/app/dashboard`:
- Saludo dinámico: "¡Hola {nombre}!".
- Estadísticas inicializadas en CERO (0): Visitas Totales, Guardados, Clics en Redes.
- Gráfica en tiempo real (Recharts) de "Clics en Botón de Pago" con gradiente neón.
- Listado de "Estado de Páginas" que muestre solo un resumen rápido.

### 5. MIS PÁGINAS Y ELIMINACIÓN (Basado en Captura 3)
En `/app/pages`:
- Lista avanzada con miniatura y enlace copiable.
- Badge "Activa - Saludable" en verde neón.
- Botón de Lápiz (Editar) y Botón 'X' (Eliminar). La eliminación debe ser en tiempo real con confirmación y animación de salida.

### 6. LÓGICA DE PLANES Y RESTRICCIONES
- Plan Gratis: 1 página, 1 imagen (1080x1080 1:1), plantillas básicas, URL bloqueada.
- Plan Premium ($5): 10 páginas, 4 imágenes (HD, formatos libres), colores personalizados, 2 cambios de URL.
- Plan VIP ($10): Todo ilimitado, carga de plantillas externas JSON.
- Paywall: Si un usuario Free intenta usar funciones Pro, muestra el modal "Zentry Link Pro" con gradiente neón.

### 7. PANEL DE ADMIN (Strict)
Ruta `/app/admin` accesible SOLO para `gonzales1999.pan@gmail.com`.
- Tabla de usuarios para cambiar planes manualmente.
- Generador de códigos de activación para planes Premium y VIP.

### 8. AUTENTICACIÓN
- Solo "Iniciar con Google".
- En la Landing Page, añade el modal de "Términos y Condiciones de Zentry Link" que el usuario debe aceptar al iniciar sesión.         vas a tomar de referencias las imágenes lo que esta marcado con x no lo vas a tomar en cuentas el logo es el de la imagen uno.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://zentry-link-builder.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/278f7700-d719-4a50-9c95-35a8c1f22c23).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
