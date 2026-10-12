import { Metadata } from "next";
import { getPlanes } from "./actions";
import { PlanesClient } from "./PlanesClient";

export const metadata: Metadata = {
  title: "Planes de Membresía — Gym Meraki Admin",
  description: "Administración de planes de entrenamiento, frecuencias semanales y aranceles",
};

export default async function AdminPlanPage() {
  const initialData = await getPlanes({ page: 1, pageSize: 10 });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Cabecera de la sección */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span>Administración</span>
            <span className="text-content-muted">/</span>
            <span className="text-content-muted">Configuración</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content mt-1">
            Planes de Entrenamiento
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Configurá las modalidades de membresía (de 1 a 7 días por semana) y aranceles disponibles para los miembros.
          </p>
        </div>
      </div>

      {/* Listado y ABM interactivo */}
      <PlanesClient initialData={initialData} />
    </div>
  );
}
