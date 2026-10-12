"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export interface HistorialRegistroItem {
  id: number;
  peso: number;
  fecha: string;
  seriesCompletadas: number | null;
  repeticionesLogradas: number | null;
  notas: string | null;
}

export type MiRutinaData = NonNullable<Awaited<ReturnType<typeof getMiRutinaData>>>;

export async function getMiRutinaData() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return null;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [usuario, registrosHoy] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: sessionUser.id },
      include: {
        plan: {
          select: {
            id: true,
            nombre: true,
            diasPorSemana: true,
          },
        },
        rutinasDias: {
          where: { isActive: true },
          orderBy: { diaNumero: "asc" },
          include: {
            rutina: {
              include: {
                ejercicios: {
                  orderBy: { orden: "asc" },
                  include: {
                    ejercicio: true,
                  },
                },
              },
            },
          },
        },
        ejerciciosPersonalizados: {
          include: {
            ejercicio: true,
          },
        },
      },
    }),
    prisma.historialEjercicio.findMany({
      where: {
        usuarioId: sessionUser.id,
        fecha: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        ejercicioId: true,
      },
    }),
  ]);

  if (!usuario) return null;

  const ejerciciosCompletadosHoy = Array.from(
    new Set(registrosHoy.map((r) => r.ejercicioId))
  );

  return {
    ...usuario,
    ejerciciosCompletadosHoy,
  };
}

export async function actualizarPesoEjercicio(ejercicioId: number, peso: number) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return { success: false, error: "No autenticado" };
  }

  try {
    const pesoNum = Math.max(0, Number(peso) || 0);

    await prisma.$transaction([
      prisma.usuarioEjercicio.upsert({
        where: {
          usuarioId_ejercicioId: {
            usuarioId: sessionUser.id,
            ejercicioId,
          },
        },
        create: {
          usuarioId: sessionUser.id,
          ejercicioId,
          pesoActual: pesoNum,
        },
        update: {
          pesoActual: pesoNum,
        },
      }),
      prisma.historialEjercicio.create({
        data: {
          usuarioId: sessionUser.id,
          ejercicioId,
          peso: pesoNum,
          fecha: new Date(),
        },
      }),
    ]);

    revalidatePath("/mi-rutina");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al actualizar peso:", error);
    const message = error instanceof Error ? error.message : "Error al registrar carga";
    return { success: false, error: message };
  }
}

export async function toggleCompletarEjercicioHoy(ejercicioId: number, peso: number) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return { success: false, error: "No autenticado" };
  }

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Comprobar si ya existe un registro de hoy
    const registroExistente = await prisma.historialEjercicio.findFirst({
      where: {
        usuarioId: sessionUser.id,
        ejercicioId,
        fecha: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (registroExistente) {
      // Toggle OFF: desmarcar y eliminar registro de hoy
      await prisma.historialEjercicio.deleteMany({
        where: {
          usuarioId: sessionUser.id,
          ejercicioId,
          fecha: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      revalidatePath("/mi-rutina");
      return { success: true, completado: false };
    } else {
      // Toggle ON: marcar y crear registro en historial
      const pesoNum = Math.max(0, Number(peso) || 0);

      await prisma.$transaction([
        prisma.historialEjercicio.create({
          data: {
            usuarioId: sessionUser.id,
            ejercicioId,
            peso: pesoNum,
            fecha: new Date(),
          },
        }),
        prisma.usuarioEjercicio.upsert({
          where: {
            usuarioId_ejercicioId: {
              usuarioId: sessionUser.id,
              ejercicioId,
            },
          },
          create: {
            usuarioId: sessionUser.id,
            ejercicioId,
            pesoActual: pesoNum,
          },
          update: {
            pesoActual: pesoNum > 0 ? pesoNum : undefined,
          },
        }),
      ]);

      revalidatePath("/mi-rutina");
      return { success: true, completado: true };
    }
  } catch (error: unknown) {
    console.error("Error al alternar estado del ejercicio:", error);
    const message = error instanceof Error ? error.message : "Error al actualizar estado";
    return { success: false, error: message };
  }
}

export async function getHistorialEjercicio(ejercicioId: number): Promise<HistorialRegistroItem[]> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return [];

  try {
    const historial = await prisma.historialEjercicio.findMany({
      where: {
        usuarioId: sessionUser.id,
        ejercicioId,
      },
      orderBy: { fecha: "asc" },
      select: {
        id: true,
        peso: true,
        fecha: true,
        seriesCompletadas: true,
        repeticionesLogradas: true,
        notas: true,
      },
    });

    return historial.map((h) => ({
      id: h.id,
      peso: h.peso,
      fecha: h.fecha.toISOString(),
      seriesCompletadas: h.seriesCompletadas,
      repeticionesLogradas: h.repeticionesLogradas,
      notas: h.notas,
    }));
  } catch (error) {
    console.error("Error al obtener historial del ejercicio:", error);
    return [];
  }
}
