"use server";

import { revalidatePath } from "next/cache";
import { prisma, type Prisma } from "@lib/prisma";

export interface GetEjerciciosParams {
  page?: number;
  pageSize?: number;
  search?: string;
  grupoMuscular?: string;
  status?: string;
}

export interface EjercicioItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  grupoMuscular: string | null;
  imagenUrl: string | null;
  videoUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalRutinas: number;
}

export interface GetEjerciciosResult {
  ejercicios: EjercicioItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export async function getEjercicios({
  page = 1,
  pageSize = 10,
  search = "",
  grupoMuscular = "ALL",
  status = "ALL",
}: GetEjerciciosParams = {}): Promise<GetEjerciciosResult> {
  try {
    const currentPage = Math.max(1, page);
    const take = Math.max(1, Math.min(100, pageSize));
    const skip = (currentPage - 1) * take;

    const trimmedSearch = search.trim();

    const where: Prisma.EjercicioWhereInput = {
      deletedAt: null, // Excluir eliminados
    };

    if (trimmedSearch) {
      where.OR = [
        { nombre: { contains: trimmedSearch } },
        { descripcion: { contains: trimmedSearch } },
        { grupoMuscular: { contains: trimmedSearch } },
      ];
    }

    if (grupoMuscular !== "ALL" && grupoMuscular) {
      where.grupoMuscular = grupoMuscular;
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const [totalItems, ejerciciosRaw] = await Promise.all([
      prisma.ejercicio.count({ where }),
      prisma.ejercicio.findMany({
        where,
        take,
        skip,
        orderBy: [{ grupoMuscular: "asc" }, { nombre: "asc" }],
        include: {
          _count: {
            select: {
              rutinas: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / take);

    const ejercicios: EjercicioItem[] = ejerciciosRaw.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      descripcion: e.descripcion,
      grupoMuscular: e.grupoMuscular,
      imagenUrl: e.imagenUrl,
      videoUrl: e.videoUrl,
      isActive: e.isActive,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      totalRutinas: e._count.rutinas,
    }));

    return {
      ejercicios,
      totalItems,
      totalPages,
      currentPage,
      pageSize: take,
    };
  } catch (error) {
    console.error("Error al obtener ejercicios:", error);
    return {
      ejercicios: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize,
    };
  }
}

export interface EjercicioFormData {
  nombre: string;
  descripcion?: string;
  grupoMuscular?: string;
  imagenUrl?: string;
  videoUrl?: string;
  isActive?: boolean;
}

export async function crearEjercicio(data: EjercicioFormData) {
  try {
    const { nombre, descripcion, grupoMuscular, imagenUrl, videoUrl, isActive } = data;

    if (!nombre || !nombre.trim()) {
      return { success: false, error: "El nombre del ejercicio es obligatorio" };
    }

    const nuevoEjercicio = await prisma.ejercicio.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        grupoMuscular: grupoMuscular?.trim() || null,
        imagenUrl: imagenUrl?.trim() || null,
        videoUrl: videoUrl?.trim() || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    revalidatePath("/admin/ejercicios");
    return { success: true, ejercicio: nuevoEjercicio };
  } catch (error: unknown) {
    console.error("Error al crear ejercicio:", error);
    const message = error instanceof Error ? error.message : "Error al crear el ejercicio";
    return { success: false, error: message };
  }
}

export async function actualizarEjercicio(id: number, data: EjercicioFormData) {
  try {
    const { nombre, descripcion, grupoMuscular, imagenUrl, videoUrl, isActive } = data;

    const ejercicioExistente = await prisma.ejercicio.findUnique({ where: { id } });
    if (!ejercicioExistente) {
      return { success: false, error: "Ejercicio no encontrado" };
    }

    if (!nombre || !nombre.trim()) {
      return { success: false, error: "El nombre del ejercicio es obligatorio" };
    }

    const ejercicioActualizado = await prisma.ejercicio.update({
      where: { id },
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        grupoMuscular: grupoMuscular?.trim() || null,
        imagenUrl: imagenUrl?.trim() || null,
        videoUrl: videoUrl?.trim() || null,
        isActive: isActive !== undefined ? isActive : ejercicioExistente.isActive,
      },
    });

    revalidatePath("/admin/ejercicios");
    return { success: true, ejercicio: ejercicioActualizado };
  } catch (error: unknown) {
    console.error("Error al actualizar ejercicio:", error);
    const message = error instanceof Error ? error.message : "Error al actualizar el ejercicio";
    return { success: false, error: message };
  }
}

export async function toggleEstadoEjercicio(id: number) {
  try {
    const ejercicio = await prisma.ejercicio.findUnique({ where: { id } });
    if (!ejercicio) {
      return { success: false, error: "Ejercicio no encontrado" };
    }

    const ejercicioActualizado = await prisma.ejercicio.update({
      where: { id },
      data: { isActive: !ejercicio.isActive },
    });

    revalidatePath("/admin/ejercicios");
    return { success: true, isActive: ejercicioActualizado.isActive };
  } catch (error: unknown) {
    console.error("Error al alternar estado del ejercicio:", error);
    const message = error instanceof Error ? error.message : "Error al modificar estado";
    return { success: false, error: message };
  }
}

export async function eliminarEjercicio(id: number) {
  try {
    // Soft-delete para preservar los registros de rutinas y progreso histórico
    await prisma.ejercicio.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    revalidatePath("/admin/ejercicios");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al eliminar ejercicio:", error);
    const message = error instanceof Error ? error.message : "Error al eliminar el ejercicio";
    return { success: false, error: message };
  }
}
