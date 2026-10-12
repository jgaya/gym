import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
  const isMember = user?.role === "USER";

  const isDemoEnabled =
    process.env.ENABLE_DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true" ||
    process.env.ENABLE_DEMO_MODE === "1";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-primary">
            <span>✨ Gym Meraki v1.0</span>
            <span className="text-content-muted">•</span>
            <span className="text-content-muted">
              {user ? `Sesión iniciada: ${user.nombre} (${user.role})` : "Plataforma de Gimnasio"}
            </span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-content sm:text-5xl md:text-6xl">
            Entrenamiento inteligente para{" "}
            <span className="text-primary">tu gimnasio</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-content-muted">
            Gestioná miembros, creá y asigná rutinas personalizadas, y controlá el progreso diario en tiempo real.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {isAdmin ? (
              <>
                <Link
                  href="/admin/rutinas"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Gestión de Rutinas
                </Link>
                <Link
                  href="/admin/usuarios"
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-6 text-sm font-semibold text-content transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Panel de Miembros
                </Link>
              </>
            ) : isMember ? (
              <>
                <Link
                  href="/mi-rutina"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Ver Mi Rutina de Hoy 🏋️
                </Link>
                <Link
                  href="/perfil"
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-6 text-sm font-semibold text-content transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Mi Perfil y Membresía
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Ingresar a Mi Cuenta
                </Link>
                {isDemoEnabled && (
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-6 text-sm font-semibold text-content transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Acceso Demo / Prueba
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Feature Cards adaptables al tema */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-6">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm transition-colors hover:border-primary/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold mb-4">
              🏋️
            </div>
            <h3 className="text-lg font-semibold text-content mb-2">Rutinas Ágiles</h3>
            <p className="text-sm text-content-muted">
              Templates prediseñados y rutinas por día adaptables para cada perfil de miembro.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm transition-colors hover:border-primary/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold mb-4">
              👥
            </div>
            <h3 className="text-lg font-semibold text-content mb-2">ABM de Miembros</h3>
            <p className="text-sm text-content-muted">
              Control integral de altas, asistencias, historial de peso, medidas corporales y pagos.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm transition-colors hover:border-primary/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold mb-4">
              🌓
            </div>
            <h3 className="text-lg font-semibold text-content mb-2">Modo Día & Noche</h3>
            <p className="text-sm text-content-muted">
              Diseño adaptable a la luz ambiental, con tokens semánticos y rendimiento óptimo en mobile y desktop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
