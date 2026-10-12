import { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { cerrarSesion } from "@/app/login/actions";
import { prisma } from "@lib/prisma";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PerfilForm } from "./PerfilForm";
import { PreferenciasVisuales } from "./PreferenciasVisuales";

export const metadata: Metadata = {
  title: "Mi Perfil — Gym Meraki",
  description: "Datos personales, preferencias de visualización y estado de la membresía",
};

export default async function PerfilPage() {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm space-y-4">
          <span className="text-3xl">🔒</span>
          <h1 className="text-xl font-bold text-content">Acceso a Mi Perfil</h1>
          <p className="text-sm text-content-muted">
            Debes iniciar sesión con tu cuenta para visualizar y modificar tus datos personales o preferencias.
          </p>
          <Link href="/login">
            <Button variant="primary">Iniciar Sesión</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Cargar registro completo desde la base de datos
  const usuario = await prisma.usuario.findUnique({
    where: { id: sessionUser.id },
    include: {
      plan: {
        select: {
          id: true,
          nombre: true,
          diasPorSemana: true,
        },
      },
    },
  });

  if (!usuario) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-content-muted">Usuario no encontrado en el sistema.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:px-6 space-y-8">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span>Área de Miembros</span>
            <span className="text-content-muted">•</span>
            <span className="text-content-muted">Configuración Personal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content mt-1">
            Mi Perfil y Preferencias
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Actualizá tus datos de contacto y ajustá el tamaño de letra de la aplicación.
          </p>
        </div>

        <form action={cerrarSesion}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="text-red-500 hover:text-red-700"
          >
            Cerrar Sesión
          </Button>
        </form>
      </div>

      {/* Resumen de la Cuenta */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-black shadow-md">
              {usuario.nombre.charAt(0)}
              {usuario.apellido.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-content">
                  {usuario.nombre} {usuario.apellido}
                </h2>
                <Badge variant={usuario.role === "USER" ? "default" : "primary"}>
                  {usuario.role === "USER" ? "Miembro" : usuario.role}
                </Badge>
              </div>
              <p className="text-sm text-content-muted mt-0.5">{usuario.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-content-muted">
                <span>DNI: {usuario.dni}</span>
                <span>•</span>
                <span>Tel: {usuario.telefono}</span>
                {usuario.plan && (
                  <>
                    <span>•</span>
                    <span className="text-primary font-semibold">
                      {usuario.plan.nombre} ({usuario.plan.diasPorSemana} días/sem)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Link
              href="/mis-medidas"
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface-hover px-3.5 py-2 text-xs font-semibold text-content hover:text-primary transition-colors border border-border"
            >
              <span>📏 Mis Medidas</span>
            </Link>
            <Link
              href="/mi-rutina"
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface-hover px-3.5 py-2 text-xs font-semibold text-content hover:text-primary transition-colors border border-border"
            >
              <span>Ir a Mi Rutina</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Sección 1: Modificar Datos Personales */}
      <PerfilForm
        initialData={{
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          telefono: usuario.telefono,
          dni: usuario.dni,
          direccion: usuario.direccion,
          birthDate: usuario.birthDate,
        }}
      />

      {/* Sección 2: Preferencias Visuales (Slider de Tamaño de Fuente) */}
      <PreferenciasVisuales />
    </div>
  );
}
