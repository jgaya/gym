"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@lib/prisma";
import { Role } from "@lib/generated/prisma/enums";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

export interface AutenticarResultado {
  success: boolean;
  requiresPassword?: boolean;
  nombre?: string;
  role?: Role;
  error?: string;
  redirectUrl?: string;
}

/**
 * Autentica al usuario por DNI.
 * - Si es usuario común (USER), ingresa directamente con su DNI sin pedir contraseña.
 * - Si es ADMIN o SUPERADMIN y no se envió contraseña, responde requiresPassword: true.
 * - Si es ADMIN o SUPERADMIN y se envió contraseña, valida el hash.
 */
export async function autenticarPorDni({
  dni,
  password,
  callbackUrl = "",
}: {
  dni: string;
  password?: string;
  callbackUrl?: string;
}): Promise<AutenticarResultado> {
  const rawDni = dni ? dni.trim() : "";
  const cleanDni = rawDni.replace(/[\.\s-]/g, "");

  if (!rawDni) {
    return { success: false, error: "Debes ingresar tu número de DNI" };
  }

  try {
    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { dni: rawDni },
          { dni: cleanDni },
        ],
        deletedAt: null,
      },
    });

    if (!usuario) {
      return {
        success: false,
        error: "No se encontró ningún usuario registrado con el DNI ingresado. Por favor verificá el número o consultá en recepción.",
      };
    }

    if (!usuario.isActive) {
      return {
        success: false,
        error: "Tu cuenta de miembro se encuentra inactiva o suspendida. Por favor consultá en la administración.",
      };
    }

    // Si es ADMIN o SUPERADMIN, requiere contraseña obligatoria
    if (usuario.role === Role.ADMIN || usuario.role === Role.SUPERADMIN) {
      if (!password || !password.trim()) {
        return {
          success: false,
          requiresPassword: true,
          nombre: usuario.nombre,
          role: usuario.role,
        };
      }

      // Validar contraseña
      let contrasenaValida = false;
      if (usuario.passwordHash) {
        contrasenaValida = verifyPassword(password, usuario.passwordHash);
      } else {
        // Fallback defensivo para cuentas administradoras creadas antes o sin contraseña
        contrasenaValida = password === "admin123" || password === cleanDni || password === rawDni;
      }

      if (!contrasenaValida) {
        return {
          success: false,
          requiresPassword: true,
          nombre: usuario.nombre,
          role: usuario.role,
          error: "Contraseña incorrecta. Verificá tus credenciales de acceso.",
        };
      }
    }

    // Crear sesión autenticada
    await setSessionCookie({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      role: usuario.role,
    });

    revalidatePath("/", "layout");

    const destinoDefault = usuario.role === Role.USER ? "/mi-rutina" : "/admin/usuarios";
    const redirectUrl = callbackUrl || destinoDefault;

    return {
      success: true,
      redirectUrl,
    };
  } catch (error: unknown) {
    console.error("Error en autenticación por DNI:", error);
    const message = error instanceof Error ? error.message : "Ocurrió un error al procesar el ingreso al sistema";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Atajo para pruebas y desarrollo: Inicia sesión directamente como un rol dado
 */
export async function iniciarSesionComo(
  rol: "USER" | "ADMIN" | "SUPERADMIN",
  callbackUrl?: string
): Promise<void> {
  let destino = callbackUrl || (rol === "USER" ? "/mi-rutina" : "/admin/usuarios");

  try {
    let usuario = await prisma.usuario.findFirst({
      where: {
        role: rol,
        deletedAt: null,
        isActive: true,
      },
    });

    if (!usuario) {
      const sufijo = rol.toLowerCase();
      const defaultDni = rol === "SUPERADMIN" ? "10000001" : rol === "ADMIN" ? "20000002" : "30000003";
      usuario = await prisma.usuario.create({
        data: {
          email: `${sufijo}@gymmeraki.com`,
          nombre: rol === "USER" ? "Lucas" : rol === "ADMIN" ? "Martín" : "Gonzalo",
          apellido: rol === "USER" ? "Gómez" : rol === "ADMIN" ? "Admin" : "SuperAdmin",
          telefono: "+54 9 11 5555-0000",
          dni: defaultDni,
          role: rol,
          passwordHash: rol !== "USER" ? hashPassword("admin123") : null,
          isActive: true,
        },
      });
    }

    await setSessionCookie({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      role: usuario.role,
    });

    revalidatePath("/", "layout");
  } catch (error: unknown) {
    console.error("Error al iniciar sesión rápida:", error);
    const message = error instanceof Error ? error.message : "Error al iniciar sesión";
    destino = `/login?error=${encodeURIComponent(message)}`;
  }

  redirect(destino);
}

export async function cerrarSesion(): Promise<void> {
  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect("/login");
}
