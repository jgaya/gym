"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@lib/prisma";
import { getCurrentUser, setSessionCookie } from "@/lib/auth";

export interface PerfilFormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion?: string;
  birthDate?: string; // YYYY-MM-DD
}

export async function actualizarDatosPerfil(data: PerfilFormData) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Debes iniciar sesión para modificar tu perfil" };
    }

    const { nombre, apellido, email, telefono, direccion, birthDate } = data;

    if (!nombre.trim() || !apellido.trim()) {
      return { success: false, error: "El nombre y apellido son obligatorios" };
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "El correo electrónico ingresado no es válido" };
    }

    if (!telefono.trim()) {
      return { success: false, error: "El teléfono / WhatsApp es obligatorio" };
    }

    // Comprobar si el email está en uso por otro miembro
    const emailExistente = await prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (emailExistente && emailExistente.id !== session.id && !emailExistente.deletedAt) {
      return { success: false, error: "El correo electrónico ya está registrado por otro miembro" };
    }

    // Actualizar registro en base de datos
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: session.id },
      data: {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim(),
        direccion: direccion?.trim() || null,
        birthDate: birthDate ? new Date(birthDate) : null,
      },
    });

    // Actualizar cookie de sesión con los datos renovados (nombre, email)
    await setSessionCookie({
      id: usuarioActualizado.id,
      email: usuarioActualizado.email,
      nombre: usuarioActualizado.nombre,
      apellido: usuarioActualizado.apellido,
      role: usuarioActualizado.role,
    });

    revalidatePath("/perfil");
    revalidatePath("/", "layout");

    return {
      success: true,
      usuario: {
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre,
        apellido: usuarioActualizado.apellido,
        email: usuarioActualizado.email,
        telefono: usuarioActualizado.telefono,
        direccion: usuarioActualizado.direccion,
        birthDate: usuarioActualizado.birthDate,
      },
    };
  } catch (error: unknown) {
    console.error("Error al actualizar perfil:", error);
    const message = error instanceof Error ? error.message : "Error al guardar los cambios del perfil";
    return { success: false, error: message };
  }
}

