import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { getCalendarioData } from "./actions";
import { CalendarioClient } from "./CalendarioClient";

export const metadata: Metadata = {
  title: "Mi Calendario de Asistencias — Gym Meraki",
  description: "Seguimiento de días entrenados y constancia en el gimnasio",
};

export default async function CalendarioPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?callbackUrl=/calendario");
  }

  const calendarioData = await getCalendarioData();

  if (!calendarioData) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center space-y-3">
          <h3 className="text-lg font-bold text-content">
            No se pudo cargar la información del calendario
          </h3>
          <p className="text-sm text-content-muted max-w-md mx-auto">
            Por favor intentá recargar la página o comunicate con la administración si el problema persiste.
          </p>
          <div className="pt-2">
            <Link
              href="/mi-rutina"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
            >
              Ir a Mi Rutina
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:px-6 space-y-6">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span>Área de Miembros</span>
            <span className="text-content-muted">•</span>
            <span className="text-content-muted">Calendario & Asistencias</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content mt-1">
            Tu Constancia, {currentUser.nombre} 📅
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Visualizá los días que fuiste al gimnasio y llevá el control de tu disciplina mes a mes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {calendarioData.usuario.nombrePlan && (
            <Badge variant="primary">
              {calendarioData.usuario.nombrePlan} ({calendarioData.usuario.diasPorSemanaPlan} d/sem)
            </Badge>
          )}
          <Link
            href="/mi-rutina"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-content hover:bg-surface-hover hover:border-primary/40 transition-colors shadow-2xs"
          >
            <span>Mi Rutina</span>
            <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Componente Interactivo de Calendario */}
      <CalendarioClient data={calendarioData} />
    </div>
  );
}

