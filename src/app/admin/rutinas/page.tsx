import { Metadata } from "next";
import {
  getPlanRutinaTemplates,
  getPlanesSelector,
} from "./actions";
import { RutinasClient } from "./RutinasClient";

export const metadata: Metadata = {
  title: "Gestión de Rutinas — Gym Meraki Admin",
  description: "Catálogo y diseño de rutinas de entrenamiento multi-día para socios",
};

interface AdminRutinasPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function AdminRutinasPage({ searchParams }: AdminRutinasPageProps) {
  const [params, initialTemplates, planes] = await Promise.all([
    searchParams,
    getPlanRutinaTemplates(),
    getPlanesSelector(),
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
            Rutinas de Entrenamiento
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Diseñá y administrá las rutinas completas de entrenamiento para los socios, configurando los ejercicios de cada día en una sola pantalla.
          </p>
        </div>
      </div>

      {/* Listado y ABM interactivo */}
      <RutinasClient
        initialTemplates={initialTemplates}
        planes={planes}
      />
    </div>
  );
}
