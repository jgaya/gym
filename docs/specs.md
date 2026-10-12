# Gimnasio Meraki — Especificaciones Técnicas y Funcionales del Sistema

> **Documento de Especificación Oficial**  
> **Versión:** 1.0  
> **Estado:** Primer Draft 


## Índice

1. [Visión General y Propósito del Sistema](#1-visión-general-y-propósito-del-sistema)
2. [Arquitectura Tecnológica y Stack](#2-arquitectura-tecnológica-y-stack)
3. [Modelo de Roles, Permisos y Seguridad](#3-modelo-de-roles-permisos-y-seguridad)

## 1. Visión General y Propósito del Sistema

Gym Meraki  es una plataforma web y PWA (Progressive Web App)  dedicada a la gestión de un gimnasio y de las rutinas de los usuarios del mismo. El sistema está diseñado para facilitar la gestión de los entrenamientos, la gestión de los miembros y la administración del gimnasio.

### Objetivos Clave
- **Facilidad para la subida de nuevos miembros:** El admin tiene un ABM facil para todos los datos de los miembros. Debe incluir whatsup, DNI y otros datos relevantes.
- **Gestión de Rutinas y Ejercicios:** La creacion y modificaciones de rutinas para el usuario debe ser rapida y agil, el usuario puede ir diferentes cantidad de dias y cada dia tiene su rutina y cada rutina cantidad diferentes de ejercicios. Debe haber templates de rutinas para popular rapidamente a un usuario nuevo,un ABM completo para los templates, ademas de un ABM completo para los ejercicios. 
- **Tipos de usuario:** El sistema tiene 3 roles, el admin del gimnasio que es el usuario final del sistema, el principal stakeholder, el usuario del gimnasio que mas alla de llevar el control de que ejercicios hizo y cuales no, no tiene acceso a los datos del sistema, y el superdamin que tiene control absoluto para todas las funciones.
- **Dashboard para el admin:** El admin tiene un dashboard que muestra las asistencias de los miembros, el control de pagos de quienes pagaron el mes y cuales no, con los graficos pertinentes.
- **El usuario del gimnasio:** El dia a dia del usuario cuando se logue ve la rutina del dia, va marcando que ejercicio ya completo ese dia, puede modiificar al peso del mismo, ver un historial del peso de ese ejercicio para ver la mejora en un grafico, puede modificar sus datos personales subir una foto , una seccion de medidas donde si lo desea puede ir controlando la medida que necesite, como la cintura o el biceps en cm o el peso en kg etc. 

---

## 2. Arquitectura Tecnológica y Stack

### 2.1. Núcleo de Aplicación
- **Framework:** Next.js 16.1.6 (App Router con Server Components y Server Actions).
- **Librería de Interfaz:** React 19.2.3.
- **Lenguaje:** TypeScript 5.8.3 en modo estricto.
- **Motor de Estilos:** Tailwind CSS 4.2.1 junto con un sistema de tokens de diseño semánticos (`app/globals.css`).
- **Entorno de Ejecución:** Node.js `>= 20.19.0`.

### 2.2. Persistencia y Base de Datos
- **Motor de Base de Datos:** MySQL / MariaDB.
- **ORM:** Prisma 7.9.1.
  - Driver adapter: `@prisma/adapter-mariadb`.
  - Generador: Nuevo `prisma-client` de Prisma 7 que emite TypeScript compilado en `lib/generated/prisma`.
  - Configuración desacoplada en `prisma.config.ts`.
  - Transacciones auditadas obligatorias mediante `enTransaccion()` (`lib/prisma.ts`).

### 2.3. Autenticación, Sesión y Seguridad
- **Mecanismo de Sesión:** Stateless Session mediante JWT (`jose` 6.0.12) firmado con `HS256`, persistido en cookie HTTP-Only con validez de 7 días y `SameSite: Lax`.
- **Autenticación con Credenciales:** Contraseñas hasheadas mediante `bcryptjs` 3.0.2.


### 2.4. Inteligencia Artificial y Procesamiento de Multimedia
- **Detección Facial en el Navegador:** `@tensorflow/tfjs` 4.22.0 y `face-api.js` 0.22.2 en `AvatarCropper.tsx`. Permite centrar automáticamente el rostro del usuario, aplicar zoom configurable y recortar el avatar en formato circular y la imagen cuadrada en canvas HTML5.
- **Validación Binaria de Imágenes:** En `lib/imagenes-perfil.ts`, se comprueban los "magic numbers" (firmas de bytes) de archivos PNG (`0x89 0x50 0x4E 0x47`) y JPEG (`0xFF 0xD8 0xFF`), limitando el peso a 1 MB para mitigar ataques de spoofing MIME.
- **Almacenamiento Protegido:** Las fotos de perfil se guardan en el sistema de archivos (`var/uploads/users/<id>/`), estrictamente fuera de la carpeta pública `public/`. Son servidas únicamente mediante un Route Handler autenticado (`app/api/imagenes/perfil/[imagenId]/[variante]/route.ts`) que valida el estado de aprobación.

### 2.5. PWA
- **PWA (Progressive Web App):** Service Worker nativo (`lib/service-worker.ts`), manifiesto dinámico (`app/manifest.ts`), banner de instalación `InstallPrompt` y soporte de standalone cover en móviles.

---

## 3. Modelo de Roles, Permisos y Seguridad

- **`USER`:** Todo usuario del gimnasio. No posee facultades administrativas por defecto.
- **`SUPERADMIN`:** Dueño/operador de la plataforma. Posee acceso irrestricto a todos los complejos de la base de datos (se resuelve como `ADMIN` automático en cualquier club), además de las vistas exclusivas de `/superadmin`.
- **`ADMIN`:** Administrador del gimnasio. Gestiona usuario, rutinas, ejercicios y demas funcionalidades del gimnasio.