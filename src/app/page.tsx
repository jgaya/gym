import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  const isAdmin =
    user?.role === "ADMIN" ||
    user?.role === "SUPERADMIN" ||
    user?.role === "ENTRENADOR";
  const isMember = user?.role === "USER";

  const isDemoEnabled =
    process.env.ENABLE_DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true" ||
    process.env.ENABLE_DEMO_MODE === "1";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8">
        {/* Hero Section — SaaS Mobile (High-Tech Boutique) */}
        <div className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary shadow-2xs font-mono">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>TotalGym</span>
            <span className="text-primary/40">•</span>
            <span className="text-content-muted">
              {user ? `Sesión: ${user.nombre} (${user.role})` : "High-Tech Training"}
            </span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-content sm:text-5xl md:text-6xl leading-tight">
            Entrenamiento inteligente para{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-sec">
              tu gimnasio
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-content-muted leading-relaxed">
            Gestioná miembros, creá y asigná rutinas personalizadas, y controlá el progreso diario en tiempo real.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            {isAdmin ? (
              <>
                <Link
                  href="/admin/rutinas"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-primary-sec px-6 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 hover:shadow-md hover:shadow-primary/35 transition-all duration-200 active:scale-[0.97] cursor-pointer"
                >
                  Gestión de Rutinas
                </Link>
                <Link
                  href="/admin/usuarios"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-6 text-sm font-semibold text-content hover:bg-surface-hover hover:border-primary/40 transition-all duration-200 active:scale-[0.97] cursor-pointer shadow-2xs"
                >
                  Panel de Miembros
                </Link>
              </>
            ) : isMember ? (
              <>
                <Link
                  href="/mi-rutina"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-primary-sec px-6 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 hover:shadow-md hover:shadow-primary/35 transition-all duration-200 active:scale-[0.97] cursor-pointer"
                >
                  Ver Mi Rutina de Hoy 🏋️
                </Link>
                <Link
                  href="/perfil"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-6 text-sm font-semibold text-content hover:bg-surface-hover hover:border-primary/40 transition-all duration-200 active:scale-[0.97] cursor-pointer shadow-2xs"
                >
                  Mi Perfil y Membresía
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-primary-sec px-6 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 hover:shadow-md hover:shadow-primary/35 transition-all duration-200 active:scale-[0.97] cursor-pointer"
                >
                  Ingresar a Mi Cuenta
                </Link>
                {isDemoEnabled && (
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-6 text-sm font-semibold text-content hover:bg-surface-hover hover:border-primary/40 transition-all duration-200 active:scale-[0.97] cursor-pointer shadow-2xs"
                  >
                    Acceso Demo / Prueba
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Feature Cards Bento — SaaS Mobile (High-Tech Boutique) */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 pt-6">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-boutique group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold mb-4 group-hover:scale-105 transition-transform">
              🏋️
            </div>
            <h3 className="text-lg font-bold text-content mb-2 tracking-tight">Rutinas Ágiles</h3>
            <p className="text-sm text-content-muted leading-relaxed">
              Templates prediseñados y rutinas por día adaptables para cada perfil de miembro con cronómetro de descanso integrado.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-boutique group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold mb-4 group-hover:scale-105 transition-transform">
              👥
            </div>
            <h3 className="text-lg font-bold text-content mb-2 tracking-tight">ABM de Miembros</h3>
            <p className="text-sm text-content-muted leading-relaxed">
              Control integral de altas, asistencias, historial de peso, medidas corporales y pagos de membresías.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-boutique group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold mb-4 group-hover:scale-105 transition-transform">
              🌓
            </div>
            <h3 className="text-lg font-bold text-content mb-2 tracking-tight">Modo Día & Noche</h3>
            <p className="text-sm text-content-muted leading-relaxed">
              Diseño High-Tech Boutique adaptable a la luz ambiental, con tokens semánticos OLED y rendimiento óptimo en mobile y desktop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
