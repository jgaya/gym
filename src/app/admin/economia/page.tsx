import { Metadata } from "next";
import { getEconomiaData } from "./actions";
import { EconomiaClient } from "./EconomiaClient";

export const metadata: Metadata = {
  title: "Economía y Cobranzas — Gym Meraki Admin",
  description:
    "Gestión de pagos de cuotas, recaudación mensual, evolución histórica de ingresos y socios con proyecciones.",
};

export default async function AdminEconomiaPage() {
  // Carga inicial de datos en el servidor
  const initialData = await getEconomiaData();

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Cabecera de la sección */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span>Administración</span>
            <span className="text-content-muted">/</span>
            <span className="text-content-muted">Finanzas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content mt-1">
            Economía del Gimnasio
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Control de cobros mensuales, balance de cuotas de socios, evolución histórica y proyección financiera.
          </p>
        </div>
      </div>

      {/* Componente interactivo con KPIs, gráficos de evolución, proyecciones y tabla de cobros */}
      <EconomiaClient initialData={initialData} />
    </div>
  );
}

