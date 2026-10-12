import { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { getMisMedidas, getTiposMetricas } from "./actions";
import { MisMedidasClient } from "./MisMedidasClient";

export const metadata: Metadata = {
  title: "Mis Medidas — Gym Meraki",
  description: "Seguimiento y evolución de tus medidas corporales, peso y perímetros musculares en Gym Meraki",
};

export default async function MisMedidasPage() {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm space-y-4">
          <span className="text-3xl">🔒</span>
          <h1 className="text-xl font-bold text-content">Acceso Restringido</h1>
          <p className="text-sm text-content-muted">
            Iniciá sesión en tu cuenta para acceder a tu historial de medidas y evolución física.
          </p>
          <Link href="/login">
            <Button variant="primary">Iniciar Sesión</Button>
          </Link>
        </div>
      </div>
    );
  }

  const [medidas, metricas] = await Promise.all([
    getMisMedidas(),
    getTiposMetricas(),
  ]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:px-6">
      <MisMedidasClient
        initialMedidas={medidas}
        initialMetricas={metricas}
        nombreUsuario={`${sessionUser.nombre} ${sessionUser.apellido}`}
      />
    </div>
  );
}
