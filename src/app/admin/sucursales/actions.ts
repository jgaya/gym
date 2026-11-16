"use server";

import { revalidatePath } from "next/cache";
import { prisma, type Prisma } from "@lib/prisma";

export interface GetSucursalesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export interface SucursalItem {
  id: number;
  telefono: string;
  direccion: string;
  barrio: string;
  imagen: string | null;
  urlInstagram: string | null;
  urlTiktok: string | null;
  horarios: string;
  tieneKiosco: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalUsuarios: number;
}

export interface GetSucursalesResult {
  sucursales: SucursalItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export async function getSucursales({
  page = 1,
  pageSize = 10,
  search = "",
  status = "ALL",
}: GetSucursalesParams = {}): Promise<GetSucursalesResult> {
  try {
    const currentPage = Math.max(1, page);
    const take = Math.max(1, Math.min(100, pageSize));
    const skip = (currentPage - 1) * take;

    const trimmedSearch = search.trim();

    const where: Prisma.SucursalWhereInput = {};

    if (trimmedSearch) {
      where.OR = [
        { barrio: { contains: trimmedSearch } },
        { direccion: { contains: trimmedSearch } },
        { telefono: { contains: trimmedSearch } },
        { horarios: { contains: trimmedSearch } },
      ];
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const [totalItems, sucursalesRaw] = await Promise.all([
      prisma.sucursal.count({ where }),
      prisma.sucursal.findMany({
        where,
        take,
        skip,
        orderBy: [{ id: "asc" }],
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

    const sucursales: SucursalItem[] = sucursalesRaw.map((s) => ({
      id: s.id,
      telefono: s.telefono,
      direccion: s.direccion,
      barrio: s.barrio,
      imagen: s.imagen,
      urlInstagram: s.urlInstagram,
      urlTiktok: s.urlTiktok,
      horarios: s.horarios,
      tieneKiosco: s.tieneKiosco,
      isActive: s.isActive,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      totalUsuarios: s._count.usuarios,
    }));

    return {
      sucursales,
      totalItems,
      totalPages,
      currentPage,
      pageSize: take,
    };
  } catch (error) {
    console.error("Error al obtener sucursales:", error);
    return {
      sucursales: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize,
    };
  }
}

export interface SucursalFormData {
  telefono: string;
  direccion: string;
  barrio: string;
  imagen?: string;
  urlInstagram?: string;
  urlTiktok?: string;
  horarios: string;
  tieneKiosco?: boolean;
  isActive?: boolean;
}

export async function crearSucursal(data: SucursalFormData) {
  try {
    const {
      telefono,
      direccion,
      barrio,
      imagen,
      urlInstagram,
      urlTiktok,
      horarios,
      tieneKiosco,
      isActive,
    } = data;

    if (!barrio?.trim() || !direccion?.trim() || !telefono?.trim() || !horarios?.trim()) {
      return {
        success: false,
        error: "Barrio, dirección, teléfono y horarios son obligatorios",
      };
    }

    const nuevaSucursal = await prisma.sucursal.create({
      data: {
        barrio: barrio.trim(),
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        horarios: horarios.trim(),
        imagen: imagen?.trim() || null,
        urlInstagram: urlInstagram?.trim() || null,
        urlTiktok: urlTiktok?.trim() || null,
        tieneKiosco: tieneKiosco !== undefined ? tieneKiosco : true,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/sucursales");
    revalidatePath("/admin/kiosco");
    revalidatePath("/admin/usuarios");
    revalidatePath("/admin/economia");
    return { success: true, sucursal: nuevaSucursal };
  } catch (error: unknown) {
    console.error("Error al crear sucursal:", error);
    const message = error instanceof Error ? error.message : "Error al crear la sucursal";
    return { success: false, error: message };
  }
}

export async function actualizarSucursal(id: number, data: SucursalFormData) {
  try {
    const {
      telefono,
      direccion,
      barrio,
      imagen,
      urlInstagram,
      urlTiktok,
      horarios,
      tieneKiosco,
      isActive,
    } = data;

    const sucursalExistente = await prisma.sucursal.findUnique({ where: { id } });
    if (!sucursalExistente) {
      return { success: false, error: "Sucursal no encontrada" };
    }

    if (!barrio?.trim() || !direccion?.trim() || !telefono?.trim() || !horarios?.trim()) {
      return {
        success: false,
        error: "Barrio, dirección, teléfono y horarios son obligatorios",
      };
    }

    const sucursalActualizada = await prisma.sucursal.update({
      where: { id },
      data: {
        barrio: barrio.trim(),
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        horarios: horarios.trim(),
        imagen: imagen?.trim() || null,
        urlInstagram: urlInstagram?.trim() || null,
        urlTiktok: urlTiktok?.trim() || null,
        tieneKiosco:
          tieneKiosco !== undefined ? tieneKiosco : sucursalExistente.tieneKiosco,
        isActive: isActive !== undefined ? isActive : sucursalExistente.isActive,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/sucursales");
    revalidatePath("/admin/kiosco");
    revalidatePath("/admin/usuarios");
    revalidatePath("/admin/economia");
    return { success: true, sucursal: sucursalActualizada };
  } catch (error: unknown) {
    console.error("Error al actualizar sucursal:", error);
    const message = error instanceof Error ? error.message : "Error al actualizar la sucursal";
    return { success: false, error: message };
  }
}

export async function toggleKioscoSucursal(id: number) {
  try {
    const sucursal = await prisma.sucursal.findUnique({ where: { id } });
    if (!sucursal) {
      return { success: false, error: "Sucursal no encontrada" };
    }

    const sucursalActualizada = await prisma.sucursal.update({
      where: { id },
      data: { tieneKiosco: !sucursal.tieneKiosco },
    });

    revalidatePath("/admin/sucursales");
    revalidatePath("/admin/kiosco");
    revalidatePath("/admin/economia");
    return { success: true, tieneKiosco: sucursalActualizada.tieneKiosco };
  } catch (error: unknown) {
    console.error("Error al cambiar estado de kiosco:", error);
    const message = error instanceof Error ? error.message : "Error al modificar estado de kiosco";
    return { success: false, error: message };
  }
}

export async function toggleEstadoSucursal(id: number) {
  try {
    const sucursal = await prisma.sucursal.findUnique({ where: { id } });
    if (!sucursal) {
      return { success: false, error: "Sucursal no encontrada" };
    }

    const sucursalActualizada = await prisma.sucursal.update({
      where: { id },
      data: { isActive: !sucursal.isActive },
    });

    revalidatePath("/");
    revalidatePath("/admin/sucursales");
    revalidatePath("/admin/usuarios");
    revalidatePath("/admin/economia");
    return { success: true, isActive: sucursalActualizada.isActive };
  } catch (error: unknown) {
    console.error("Error al cambiar estado de la sucursal:", error);
    const message = error instanceof Error ? error.message : "Error al modificar estado";
    return { success: false, error: message };
  }
}

export async function eliminarSucursal(id: number) {
  try {
    const usuariosAsociados = await prisma.usuario.count({
      where: { sucursalId: id, deletedAt: null },
    });

    if (usuariosAsociados > 0) {
      await prisma.sucursal.update({
        where: { id },
        data: { isActive: false },
      });
      revalidatePath("/");
      revalidatePath("/admin/sucursales");
      revalidatePath("/admin/usuarios");
      revalidatePath("/admin/economia");
      return {
        success: true,
        warning: `La sucursal tenía ${usuariosAsociados} usuario(s) asociados, por lo que fue desactivada en lugar de borrada para conservar el historial de los socios.`,
      };
    }

    await prisma.sucursal.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/admin/sucursales");
    revalidatePath("/admin/usuarios");
    revalidatePath("/admin/economia");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al eliminar sucursal:", error);
    const message = error instanceof Error ? error.message : "Error al eliminar la sucursal";
    return { success: false, error: message };
  }
}
