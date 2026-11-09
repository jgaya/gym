import { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { getMiRutinaData } from "./actions";
import { MiRutinaClient } from "./MiRutinaClient";

export const metadata: Metadata = {
  title: "Mi Rutina de Entrenamiento — Gym Meraki",
  description: "Entrenamiento del día, ejercicios y registro de peso",
};

interface MiRutinaPageProps {
  searchParams: Promise<{
    error?: string;
    pago?: "success" | "pending" | "failure";
    ref?: string;
  }>;
}

export default async function MiRutinaPage({ searchParams }: MiRutinaPageProps) {
  const [currentUser, params, usuarioData] = await Promise.all([
    getCurrentUser(),
    searchParams,
    getMiRutinaData(),
  ]);

  const isUnauthorized = params.error === "acceso_denegado";
  const estadoPago = params.pago;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:px-6 space-y-6">
      {isUnauthorized && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          ⚠️ <strong>Área de administración restringida:</strong> Las rutas que comienzan con
          <code>/admin</code> están reservadas exclusivamente para administradores. Has sido redirigido a tu panel de entrenamiento.
        </div>
      )}

      {estadoPago === "success" && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-400 flex items-center justify-between gap-3">
          <div>
            ✅ <strong>¡Pago acreditado con éxito!</strong> Tu membresía de Mercado Pago fue procesada correctamente{params.ref ? ` (Ref: ${params.ref})` : ""}.
          </div>
          <Link href="/mi-rutina" className="text-xs font-bold underline shrink-0">
            Cerrar
          </Link>
        </div>
      )}

      {estadoPago === "pending" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400 flex items-center justify-between gap-3">
          <div>
            ⏳ <strong>Pago en proceso de acreditación:</strong> Mercado Pago nos notificará automáticamente apenas se confirme la operación.
          </div>
          <Link href="/mi-rutina" className="text-xs font-bold underline shrink-0">
            Cerrar
          </Link>
        </div>
      )}

      {estadoPago === "failure" && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-400 flex items-center justify-between gap-3">
          <div>
            ❌ <strong>El pago no pudo completarse:</strong> Podés volver a intentarlo desde el link enviado por recepción o consultar en el gimnasio.
          </div>
          <Link href="/mi-rutina" className="text-xs font-bold underline shrink-0">
            Cerrar
          </Link>
        </div>
      )}

      {/* Cabecera del Miembro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span>Área de Miembros</span>
            <span className="text-content-muted">•</span>
            <span className="text-content-muted">Entrenamiento</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content mt-1">
            Hola, {currentUser ? currentUser.nombre : "Atleta"} 👋
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Consultá tu rutina asignada para cada día de tu plan y registrá tus cargas de peso actuales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {usuarioData?.plan && (
            <Badge variant="primary">
              {usuarioData.plan.nombre} ({usuarioData.plan.diasPorSemana} días/sem)
            </Badge>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/calendario"
              className="text-xs font-semibold text-content-muted hover:text-content border border-border bg-surface px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span>📅 Calendario</span>
            </Link>
            <Link
              href="/mis-medidas"
              className="text-xs font-semibold text-content-muted hover:text-content border border-border bg-surface px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span>📏 Mis Medidas</span>
            </Link>
            <Link
              href="/perfil"
              className="text-xs font-semibold text-content-muted hover:text-content border border-border bg-surface px-3 py-1.5 rounded-lg transition-colors"
            >
              Ver Mi Perfil →
            </Link>
          </div>
        </div>
      </div>

      {/* Vista interactiva de la rutina */}
      {usuarioData ? (
        <MiRutinaClient usuario={usuarioData} />
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-content-muted">
          Iniciá sesión para ver tu plan y rutina asignada.
        </div>
      )}
    </div>
  );
}
