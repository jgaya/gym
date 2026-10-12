# Guía del Sistema de Temas (Día / Noche) y Guía de Componentes — Gym Meraki

Esta documentación describe la arquitectura de diseño y la metodología de estilos implementada en el proyecto con **Next.js (App Router)** y **Tailwind CSS v4**. Explica cómo funciona el sistema de temas (Día / Noche), cómo está construido el `SiteHeader`, y cómo deben construir y heredar los estilos los futuros componentes.

---

## 1. Arquitectura General del Sistema

El sistema se basa en una combinación de **tokens de diseño semánticos en variables CSS**, **Tailwind CSS v4** y un **Contexto de React (`ThemeContext`)**:

```
┌────────────────────────────────────────────────────────┐
│                   ThemeContext                         │
│  - Controla el estado ('light' | 'dark' | 'system')    │
│  - Persiste la preferencia en localStorage ('gym-theme')│
│  - Alterna la clase `.dark` en <html />               │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                   app/globals.css                      │
│  - :root        => Tokens para Modo Día                │
│  - .dark        => Tokens para Modo Noche              │
│  - @theme inline=> Expone clases de utilidad Tailwind  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                 Componentes de la App                  │
│  - Heredan automáticamente vía clases semánticas:      │
│    bg-background, bg-surface, text-content, border-border│
└────────────────────────────────────────────────────────┘
```

---

## 2. Tokens Semánticos Disponibles

En lugar de usar colores específicos como `bg-white` o `text-black` con docenas de clases `dark:bg-zinc-900`, usamos tokens semánticos. Al cambiar de día a noche, **el token cambia de valor automáticamente** sin necesidad de añadir prefijos `dark:` a cada propiedad:

| Token Semántico | Utilidad Tailwind | Modo Día (Claro) | Modo Noche (Oscuro) | Uso recomendado |
| :--- | :--- | :--- | :--- | :--- |
| `--background` | `bg-background` | `#f8fafc` | `#0b0f19` | Fondo general de la página/pantalla |
| `--foreground` | `text-foreground` | `#0f172a` | `#f8fafc` | Color base del texto del cuerpo |
| `--surface` | `bg-surface` | `#ffffff` | `#131b2e` | Fondo de tarjetas, cabecera, modales, paneles |
| `--surface-hover` | `bg-surface-hover` | `#f1f5f9` | `#1e293b` | Estados `:hover` de filas, tarjetas o botones secundarios |
| `--border` | `border-border` | `#e2e8f0` | `#1e293b` | Bordes y separadores |
| `--content` | `text-content` | `#0f172a` | `#f8fafc` | Texto principal, títulos destacados |
| `--content-muted`| `text-content-muted` | `#64748b` | `#94a3b8` | Subtítulos, textos secundarios, etiquetas |
| `--primary` | `bg-primary`, `text-primary` | `#ea580c` | `#f97316` | Botones de acción principal (CTA), acentos del gimnasio |
| `--primary-hover`| `hover:bg-primary-hover` | `#c2410c` | `#ea580c` | Hover de acciones primarias |
| `--primary-foreground` | `text-primary-foreground` | `#ffffff` | `#ffffff` | Texto dentro de botones primarios |
| `--accent` | `bg-accent` | `#f1f5f9` | `#1e293b` | Fondos de chips, insignias y elementos destacados |

---

## 3. Cómo los Futuros Componentes Heredan el Tema

### Regla Fundamental: "Token-First"
Para que un componente sea automáticamente 100% compatible con ambos modos, **utilizá siempre los tokens semánticos**. No es necesario escribir `dark:` para los colores estándar.

### Ejemplo 1: Crear una Tarjeta (`Card`)
```tsx
export function MetricCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm transition-colors hover:border-primary/50">
      <p className="text-sm font-medium text-content-muted">{title}</p>
      <h3 className="mt-2 text-3xl font-extrabold text-content">{value}</h3>
      <p className="mt-1 text-xs text-content-muted">{subtitle}</p>
    </div>
  );
}
```
> **¿Por qué funciona automáticamente?**  
> Porque cuando el usuario cambia el tema, el navegador actualiza las variables CSS de `:root` a `.dark`. `bg-surface` pasa de blanco a azul noche profundo, `border-border` se adapta y `text-content` cambia de tono oscuro a claro al instante.

### Ejemplo 2: Crear un Botón Primario y Secundario
```tsx
// Botón Primario
<button className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus:ring-2 focus:ring-primary">
  Guardar Rutina
</button>

// Botón Secundario / Cancelar
<button className="rounded-lg border border-border bg-surface px-4 py-2 font-medium text-content transition-colors hover:bg-surface-hover">
  Cancelar
</button>
```

### Ejemplo 3: Formularios e Inputs
```tsx
<div className="space-y-1">
  <label className="text-sm font-medium text-content">Nombre del ejercicio</label>
  <input
    type="text"
    placeholder="Ej: Press de banca"
    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-content placeholder:text-content-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
  />
</div>
```

---

## 4. Uso del Hook `useTheme()` en Componentes de Cliente

Si un componente interactivo necesita saber si está en modo oscuro o necesita ofrecer una acción para alternar el tema, puede consumir el hook `useTheme()` desde `@/context/ThemeContext`:

```tsx
"use client";

import { useTheme } from "@/context/ThemeContext";

export function MiComponente() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  return (
    <div>
      <p>Tema configurado: {theme}</p>
      <p>Tema visual activo: {resolvedTheme}</p>

      {/* Alternar tema directamente */}
      <button onClick={toggleTheme}>Alternar Día / Noche</button>

      {/* O seleccionar un tema puntual */}
      <button onClick={() => setTheme("dark")}>Fijar Noche</button>
      <button onClick={() => setTheme("light")}>Fijar Día</button>
      <button onClick={() => setTheme("system")}>Seguir al Sistema Operativo</button>
    </div>
  );
}
```

---

## 5. Arquitectura del Componente `SiteHeader`

El componente se ubica en `src/components/SiteHeader.tsx` y está configurado en `src/app/layout.tsx`:

- **Modo Desktop (`md:flex`):**
  - Muestra el logotipo de la marca **Gym Meraki**.
  - Muestra la lista de enlaces de navegación principal (`/`, `/rutinas`, `/ejercicios`, `/miembros`).
  - Muestra el botón interactivo `ThemeToggle` a la derecha.
  - El botón hamburguesa está **completamente oculto**.

- **Modo Mobile (`md:hidden`):**
  - Oculta los enlaces centrales para optimizar el espacio en pantallas pequeñas.
  - Muestra el botón hamburguesa con icono animado que se transforma en cruz (`X`) al desplegarse.
  - Despliega un menú lateral/dropdown con los accesos directos y una sección para alternar el tema con etiqueta descriptiva.
  - Cumple normas de accesibilidad:
    - Atributos `aria-expanded` y `aria-controls`.
    - Cierre automático al presionar la tecla `Escape`.
    - Cierre automático al hacer clic en cualquier enlace o fuera del menú.
    - Bloqueo de scroll en el `body` mientras el menú está abierto para evitar navegación accidental.

---

## 6. Prevención de Parpadeo (Anti-FOUC)

Para garantizar que los usuarios que tienen configurado el modo oscuro no vean un destello blanco al recargar la página:
1. En `src/app/layout.tsx`, dentro de `<head>`, se inyecta un script síncrono ultra liviano (`themeInitScript`).
2. Este script lee `localStorage.getItem('gym-theme')` antes de que React se hidrate y añade inmediatamente la clase `.dark` a `document.documentElement` si corresponde.
3. El elemento `<html />` cuenta con el atributo `suppressHydrationWarning` para que Next.js no genere advertencias de discrepancia entre SSR y cliente.

---

## 7. Cómo Extender Nuevos Tokens en el Futuro

Si en el futuro se desea agregar un nuevo color (por ejemplo, un color de advertencia o éxito para asistencias o pagos):

1. Definir la variable en `src/app/globals.css`:
```css
:root {
  --success: #16a34a;
}

.dark {
  --success: #22c55e;
}
```

2. Registrarlo en el bloque `@theme inline`:
```css
@theme inline {
  --color-success: var(--success);
}
```

3. Usarlo en cualquier componente como `text-success`, `bg-success`, `border-success`.
