import { Metadata } from "next";
import {
  getRutinas,
  getEjerciciosParaSelector,
  getPlanRutinaTemplates,
  getPlanesSelector,
  getRutinasSelector,
} from "./actions";
import { RutinasClient } from "./RutinasClient";

export const metadata: Metadata = {
  title: "Gestión de Rutinas y Plantillas — Gym Meraki Admin",
  description: "ABM de rutinas de entrenamiento, plantillas base y asignación de ejercicios",
};

export default async function AdminRutinasPage() {
  const [initialData, ejerciciosDisponibles, initialTemplates, planes, rutinasSelector] =
    await Promise.all([
      getRutinas({ page: 1, pageSize: 10 }),
      getEjerciciosParaSelector(),
      getPlanRutinaTemplates(),
      getPlanesSelector(),
      getRutinasSelector(),
    ]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Cabecera de la sección */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span>Administración</span>
            <span className="text-content-muted">/</span>
            <span className="text-content-muted">Entrenamiento</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content mt-1">
            Rutinas y Plantillas
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Diseñá rutinas diarias para el catálogo o creá plantillas completas multi-día asociadas a los planes de membresía.
          </p>
        </div>
      </div>

      {/* Listado y ABM interactivo */}
      <RutinasClient
        initialData={initialData}
        ejerciciosDisponibles={ejerciciosDisponibles}
        initialTemplates={initialTemplates}
        planes={planes}
        rutinasSelector={rutinasSelector}
      />
    </div>
  );
}

