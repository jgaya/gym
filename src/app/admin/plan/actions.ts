"use server";

import { revalidatePath } from "next/cache";
import { prisma, type Prisma } from "@lib/prisma";

export interface GetPlanesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export interface PlanItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  diasPorSemana: number;
  precio: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalUsuarios: number;
}

export interface GetPlanesResult {
  planes: PlanItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export async function getPlanes({
  page = 1,
  pageSize = 10,
  search = "",
  status = "ALL",
}: GetPlanesParams = {}): Promise<GetPlanesResult> {
  try {
    const currentPage = Math.max(1, page);
    const take = Math.max(1, Math.min(100, pageSize));
    const skip = (currentPage - 1) * take;

    const trimmedSearch = search.trim();

    const where: Prisma.PlanWhereInput = {};

    if (trimmedSearch) {
      where.OR = [
        { nombre: { contains: trimmedSearch } },
        { descripcion: { contains: trimmedSearch } },
      ];
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const [totalItems, planesRaw] = await Promise.all([
      prisma.plan.count({ where }),
      prisma.plan.findMany({
        where,
        take,
        skip,
        orderBy: [{ diasPorSemana: "asc" }, { nombre: "asc" }],
        include: {
          _count: {
            select: {
              usuarios: {
                where: { deletedAt: null },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / take);

    const planes: PlanItem[] = planesRaw.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      diasPorSemana: p.diasPorSemana,
      precio: p.precio !== null ? Number(p.precio) : null,
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      totalUsuarios: p._count.usuarios,
    }));

    return {
      planes,
      totalItems,
      totalPages,
      currentPage,
      pageSize: take,
    };
  } catch (error) {
    console.error("Error al obtener planes:", error);
    return {
      planes: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize,
    };
  }
}

export interface PlanFormData {
  nombre: string;
  descripcion?: string;
  diasPorSemana: number;
  precio?: number | null;
  isActive?: boolean;
}

export async function crearPlan(data: PlanFormData) {
  try {
    const { nombre, descripcion, diasPorSemana, precio, isActive } = data;

    if (!nombre || !nombre.trim()) {
      return { success: false, error: "El nombre del plan es obligatorio" };
    }

    const dias = Number(diasPorSemana);
    if (isNaN(dias) || dias < 1 || dias > 7) {
      return { success: false, error: "Los días por semana deben ser un número entre 1 y 7" };
    }

    const nuevoPlan = await prisma.plan.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        diasPorSemana: dias,
        precio: precio !== undefined && precio !== null ? Number(precio) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    revalidatePath("/admin/plan");
    revalidatePath("/admin/usuarios");
    return {
      success: true,
      plan: {
        ...nuevoPlan,
        precio: nuevoPlan.precio !== null ? Number(nuevoPlan.precio) : null,
      },
    };
  } catch (error: unknown) {
    console.error("Error al crear plan:", error);
    const message = error instanceof Error ? error.message : "Error al crear el plan";
    return { success: false, error: message };
  }
}

export async function actualizarPlan(id: number, data: PlanFormData) {
  try {
    const { nombre, descripcion, diasPorSemana, precio, isActive } = data;

    const planExistente = await prisma.plan.findUnique({ where: { id } });
    if (!planExistente) {
      return { success: false, error: "Plan no encontrado" };
    }

    if (!nombre || !nombre.trim()) {
      return { success: false, error: "El nombre del plan es obligatorio" };
    }

    const dias = Number(diasPorSemana);
    if (isNaN(dias) || dias < 1 || dias > 7) {
      return { success: false, error: "Los días por semana deben ser un número entre 1 y 7" };
    }

    const planActualizado = await prisma.plan.update({
      where: { id },
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        diasPorSemana: dias,
        precio: precio !== undefined && precio !== null ? Number(precio) : null,
        isActive: isActive !== undefined ? isActive : planExistente.isActive,
      },
    });

    revalidatePath("/admin/plan");
    revalidatePath("/admin/usuarios");
    return {
      success: true,
      plan: {
        ...planActualizado,
        precio: planActualizado.precio !== null ? Number(planActualizado.precio) : null,
      },
    };
  } catch (error: unknown) {
    console.error("Error al actualizar plan:", error);
    const message = error instanceof Error ? error.message : "Error al actualizar el plan";
    return { success: false, error: message };
  }
}

export async function toggleEstadoPlan(id: number) {
  try {
    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      return { success: false, error: "Plan no encontrado" };
    }

    const planActualizado = await prisma.plan.update({
      where: { id },
      data: { isActive: !plan.isActive },
    });

    revalidatePath("/admin/plan");
    revalidatePath("/admin/usuarios");
    return { success: true, isActive: planActualizado.isActive };
  } catch (error: unknown) {
    console.error("Error al cambiar estado del plan:", error);
    const message = error instanceof Error ? error.message : "Error al modificar estado";
    return { success: false, error: message };
  }
}

export async function eliminarPlan(id: number) {
  try {
    // Verificar si hay usuarios asociados a este plan
    const usuariosAsociados = await prisma.usuario.count({
      where: { planId: id, deletedAt: null },
    });

    if (usuariosAsociados > 0) {
      // Si tiene usuarios, no se puede borrar físicamente; se desactiva para no romper la membresía
      await prisma.plan.update({
        where: { id },
        data: { isActive: false },
      });
      revalidatePath("/admin/plan");
      revalidatePath("/admin/usuarios");
      return {
        success: true,
        warning: `El plan tenía ${usuariosAsociados} usuario(s) asociados, por lo que fue desactivado en lugar de borrado para proteger los datos.`,
      };
    }

    // Si no tiene usuarios, se puede eliminar directamente
    await prisma.plan.delete({
      where: { id },
    });

    revalidatePath("/admin/plan");
    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al eliminar plan:", error);
    const message = error instanceof Error ? error.message : "Error al eliminar el plan";
    return { success: false, error: message };
  }
}
