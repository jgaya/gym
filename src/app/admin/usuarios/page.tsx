import { Metadata } from "next";
import { getUsuarios, getPlanesDisponibles } from "./actions";
import { UsuariosClient } from "./UsuariosClient";

export const metadata: Metadata = {
  title: "Gestión de Usuarios — Gym Meraki Admin",
  description: "Listado, búsqueda, alta y modificación de miembros del gimnasio",
};

export default async function AdminUsuariosPage() {
  // Carga inicial en el servidor para velocidad y SEO
  const [initialData, planes] = await Promise.all([
    getUsuarios({ page: 1, pageSize: 10 }),
    getPlanesDisponibles(),
  ]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Cabecera de la sección */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span>Administración</span>
            <span className="text-content-muted">/</span>
            <span className="text-content-muted">Panel General</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content mt-1">
            Miembros del Gimnasio
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Administrá altas, modificaciones, asignación de planes y estado de membresía de los usuarios.
          </p>
        </div>
      </div>

      {/* Componente interactivo de listado, filtros, paginación y ABM */}
      <UsuariosClient initialData={initialData} planes={planes} />
    </div>
  );
}
