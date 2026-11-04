"use server";

import { prisma } from "@lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export interface CalendarioRegistroItem {
  id: number;
  ejercicioId: number;
  nombre: string;
  grupoMuscular: string | null;
  imagenUrl: string | null;
  peso: number;
  seriesCompletadas: number | null;
  repeticionesLogradas: number | null;
  fechaIso: string;
  fechaDiaKey: string; // "YYYY-MM-DD"
  horaFormateada: string; // "HH:MM"
}

export interface CalendarioData {
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
    diasPorSemanaPlan: number | null;
    nombrePlan: string | null;
  };
  registros: CalendarioRegistroItem[];
  diasAsistidosKeys: string[]; // ["2026-10-15", "2026-10-21", ...]
  totalDiasAsistidos: number;
}

export async function getCalendarioData(): Promise<CalendarioData | null> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return null;

  const [usuario, historial] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        plan: {
          select: {
            nombre: true,
            diasPorSemana: true,
          },
        },
      },
    }),
    prisma.historialEjercicio.findMany({
      where: { usuarioId: sessionUser.id },
      orderBy: { fecha: "desc" },
      include: {
        ejercicio: {
          select: {
            id: true,
            nombre: true,
            grupoMuscular: true,
            imagenUrl: true,
          },
        },
      },
    }),
  ]);

  if (!usuario) return null;

  const diasSet = new Set<string>();

  const registros: CalendarioRegistroItem[] = historial.map((h) => {
    const d = new Date(h.fecha);
    // Extraer YYYY-MM-DD
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const fechaDiaKey = `${y}-${m}-${day}`;

    // Extraer hora HH:MM
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const horaFormateada = `${hh}:${mm}`;

    diasSet.add(fechaDiaKey);

    return {
      id: h.id,
      ejercicioId: h.ejercicioId,
      nombre: h.ejercicio.nombre,
      grupoMuscular: h.ejercicio.grupoMuscular,
      imagenUrl: h.ejercicio.imagenUrl,
      peso: h.peso,
      seriesCompletadas: h.seriesCompletadas,
      repeticionesLogradas: h.repeticionesLogradas,
      fechaIso: h.fecha.toISOString(),
      fechaDiaKey,
      horaFormateada,
    };
  });

  const diasAsistidosKeys = Array.from(diasSet).sort((a, b) => b.localeCompare(a));

  return {
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      diasPorSemanaPlan: usuario.plan?.diasPorSemana ?? null,
      nombrePlan: usuario.plan?.nombre ?? null,
    },
    registros,
    diasAsistidosKeys,
    totalDiasAsistidos: diasAsistidosKeys.length,
  };
}

