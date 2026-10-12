import { Metadata } from "next";
import { getEjercicios } from "./actions";
import { EjerciciosClient } from "./EjerciciosClient";

export const metadata: Metadata = {
  title: "Catálogo de Ejercicios — Gym Meraki Admin",
  description: "ABM de ejercicios, grupos musculares y recursos multimedia para rutinas",
};

export default async function AdminEjerciciosPage() {
  const initialData = await getEjercicios({ page: 1, pageSize: 10 });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Cabecera de la sección */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span>Administración</span>
            <span className="text-content-muted">/</span>
            <span className="text-content-muted">Catálogos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content mt-1">
            Catálogo de Ejercicios
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Gestioná los ejercicios disponibles en el gimnasio, técnicas de ejecución y videos demostrativos.
          </p>
        </div>
      </div>

      {/* Listado y ABM interactivo */}
      <EjerciciosClient initialData={initialData} />
    </div>
  );
}
