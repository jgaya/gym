import { Metadata } from "next";
import { iniciarSesionComo } from "./actions";
import { LoginForm } from "./LoginForm";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Iniciar Sesión — Gym Meraki",
  description: "Acceso seguro a la plataforma de entrenamiento de Gym Meraki",
};

interface LoginPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "";
  const errorParam = params.error;

  const isDemoEnabled =
    process.env.ENABLE_DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true" ||
    process.env.ENABLE_DEMO_MODE === "1";

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-surface p-8 shadow-xl">
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl mb-2">
            <img
              src="/logoGym.jpg"
              alt="Meraki Centro de Entrenamiento"
              style={{ boxShadow: "var(--logo-shadow)" }}
              className="h-12 w-12 rounded-lg object-cover logo-img-shadow border border-border"
            />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-content">
            Meraki Centro de Entrenamiento
          </h1>
          <p className="text-xs text-content-muted">
            Ingresá tu DNI para acceder a tu panel de entrenamiento.
          </p>
        </div>

        {/* Alerta si venía de una ruta protegida */}
        {callbackUrl && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-semibold text-amber-600 dark:text-amber-400">
            🔒 Esta sección requiere iniciar sesión con permisos administrativos.
          </div>
        )}

        {errorParam === "acceso_denegado" && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
            ⛔ No tienes permisos para acceder a las rutas de administración. Tu rol actual es de Miembro.
          </div>
        )}

        {errorParam && errorParam !== "acceso_denegado" && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
            ⚠️ {errorParam}
          </div>
        )}

        {/* Formulario de Login por DNI */}
        <LoginForm callbackUrl={callbackUrl} />

        {/* Selector Rápido de Roles para Pruebas y Desarrollo (Feature Flag) */}
        {isDemoEnabled && (
          <div className="border-t border-border pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
                Acceso Rápido de Prueba
              </span>
              <span className="text-[10px] text-content-muted bg-surface-hover px-2 py-0.5 rounded">
                Demo
              </span>
            </div>
            <p className="text-[11px] text-content-muted">
              Accedé en 1 clic para probar los permisos de cada tipo de cuenta:
            </p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 pt-1">
              <form action={iniciarSesionComo.bind(null, "USER", callbackUrl)}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-medium"
                  title="DNI: 30000003 — Acceso directo sin clave"
                >
                  👤 Miembro
                </Button>
              </form>

              <form action={iniciarSesionComo.bind(null, "ADMIN", callbackUrl)}>
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs font-medium border-primary/30 text-primary"
                  title="DNI: 20000002 — Requiere clave"
                >
                  🛡️ Admin
                </Button>
              </form>

              <form action={iniciarSesionComo.bind(null, "SUPERADMIN", callbackUrl)}>
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs font-medium border-amber-500/30 text-amber-600 dark:text-amber-400"
                  title="DNI: 10000001 — Requiere clave"
                >
                  ⚡ SuperAdmin
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
