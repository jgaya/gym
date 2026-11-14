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

interface AdminRutinasPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function AdminRutinasPage({ searchParams }: AdminRutinasPageProps) {
  const [params, initialData, ejerciciosDisponibles, initialTemplates, planes, rutinasSelector] =
    await Promise.all([
      searchParams,
      getRutinas({ page: 1, pageSize: 10 }),
      getEjerciciosParaSelector(),
      getPlanRutinaTemplates(),
      getPlanesSelector(),
      getRutinasSelector(),
    ]);

  const isEconomyDenied = params.error === "acceso_economia_denegado";

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {isEconomyDenied && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          ⚠️ <strong>Sección restringida a Administración:</strong> Tu cuenta de{" "}
          <strong>Entrenador</strong> tiene acceso completo a Rutinas, Ejercicios y Usuarios, pero no a la gestión económica ni planes comerciales.
        </div>
      )}
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

