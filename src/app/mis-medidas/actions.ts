"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  METRICAS_PREDEFINIDAS,
  type MedidaItem,
  type MetricaDef,
  type RegistrarMedidaIndividualInput,
  type ActualizarMedidaInput,
  type CrearTipoMedidaInput,
} from "./types";

/**
 * Obtener todos los tipos de métricas disponibles para el usuario:
 * las preestablecidas del sistema + las creadas personalizadamente por él.
 */
export async function getTiposMetricas(): Promise<MetricaDef[]> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return METRICAS_PREDEFINIDAS;

  try {
    const personalizadas = await prisma.tipoMedidaPersonalizada.findMany({
      where: { usuarioId: sessionUser.id },
      orderBy: { createdAt: "asc" },
    });

    const personalizadasDefs: MetricaDef[] = personalizadas.map((p) => ({
      key: p.clave,
      label: p.nombre,
      unidad: p.unidad,
      icono: p.icono,
      descripcion: `Medida personalizada: ${p.nombre}`,
      color: p.color,
      esPersonalizada: true,
    }));

    return [...METRICAS_PREDEFINIDAS, ...personalizadasDefs];
  } catch (error: unknown) {
    console.error("Error al obtener tipos de métricas:", error);
    return METRICAS_PREDEFINIDAS;
  }
}

/**
 * Obtener todos los registros de medidas del usuario actual ordenados por fecha ascendente
 */
export async function getMisMedidas(): Promise<MedidaItem[]> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return [];

  try {
    const registros = await prisma.medidaCorporal.findMany({
      where: { usuarioId: sessionUser.id },
      orderBy: { fecha: "asc" },
    });

    return registros.map((r) => ({
      id: r.id,
      usuarioId: r.usuarioId,
      tipo: r.tipo,
      nombre: r.nombre,
      unidad: r.unidad,
      valor: r.valor,
      fecha: r.fecha.toISOString(),
      notas: r.notas,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (error: unknown) {
    console.error("Error al obtener medidas corporales:", error);
    return [];
  }
}

/**
 * Registrar una medición individual (ej: solo peso, solo cintura, o una medida nueva)
 */
export async function registrarMedidaIndividual(data: RegistrarMedidaIndividualInput) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return { success: false, error: "Debes iniciar sesión para registrar una medida" };
  }

  try {
    const valorNum = Number(data.valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      return { success: false, error: "Debes ingresar un valor numérico válido mayor a 0" };
    }

    if (!data.tipo || !data.tipo.trim()) {
      return { success: false, error: "Debes seleccionar la medida que querés registrar" };
    }

    const tipoKey = data.tipo.trim();
    const metricas = await getTiposMetricas();
    const metricaEncontrada = metricas.find((m) => m.key === tipoKey);

    const nombre = data.nombre?.trim() || metricaEncontrada?.label || tipoKey;
    const unidad = data.unidad?.trim() || metricaEncontrada?.unidad || "cm";
    const fechaObj = data.fecha ? new Date(data.fecha) : new Date();

    const nuevaMedida = await prisma.medidaCorporal.create({
      data: {
        usuarioId: sessionUser.id,
        tipo: tipoKey,
        nombre,
        unidad,
        valor: valorNum,
        fecha: fechaObj,
        notas: data.notas?.trim() || null,
      },
    });

    revalidatePath("/mis-medidas");
    revalidatePath("/perfil");

    return {
      success: true,
      medida: {
        id: nuevaMedida.id,
        tipo: nuevaMedida.tipo,
        nombre: nuevaMedida.nombre,
        valor: nuevaMedida.valor,
        unidad: nuevaMedida.unidad,
        fecha: nuevaMedida.fecha.toISOString(),
      },
    };
  } catch (error: unknown) {
    console.error("Error al registrar medida individual:", error);
    const message =
      error instanceof Error ? error.message : "Error al registrar la medida";
    return { success: false, error: message };
  }
}

/**
 * Modificar un registro de medida existente
 */
export async function actualizarMedidaIndividual(id: number, data: ActualizarMedidaInput) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return { success: false, error: "No autenticado" };
  }

  try {
    const existente = await prisma.medidaCorporal.findUnique({
      where: { id },
    });

    if (!existente || existente.usuarioId !== sessionUser.id) {
      return { success: false, error: "Registro no encontrado o sin permisos" };
    }

    const valorNum = Number(data.valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      return { success: false, error: "El valor debe ser un número mayor a 0" };
    }

    const fechaObj = data.fecha ? new Date(data.fecha) : existente.fecha;

    await prisma.medidaCorporal.update({
      where: { id },
      data: {
        tipo: data.tipo ? data.tipo.trim() : existente.tipo,
        nombre: data.nombre ? data.nombre.trim() : existente.nombre,
        unidad: data.unidad ? data.unidad.trim() : existente.unidad,
        valor: valorNum,
        fecha: fechaObj,
        notas: data.notas !== undefined ? (data.notas?.trim() || null) : existente.notas,
      },
    });

    revalidatePath("/mis-medidas");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al actualizar medida individual:", error);
    const message =
      error instanceof Error ? error.message : "Error al actualizar la medida";
    return { success: false, error: message };
  }
}

/**
 * Eliminar un registro de medida
 */
export async function eliminarMedida(id: number) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return { success: false, error: "No autenticado" };
  }

  try {
    const existente = await prisma.medidaCorporal.findUnique({
      where: { id },
    });

    if (!existente || existente.usuarioId !== sessionUser.id) {
      return { success: false, error: "Registro no encontrado o sin permisos" };
    }

    await prisma.medidaCorporal.delete({
      where: { id },
    });

    revalidatePath("/mis-medidas");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al eliminar medida corporal:", error);
    const message =
      error instanceof Error ? error.message : "Error al eliminar la medida";
    return { success: false, error: message };
  }
}

/**
 * Crear un nuevo tipo de medida personalizado para el usuario
 * (ej: "Cuádriceps Superior", "Glúteos", "Pliegue Tríceps", etc.)
 */
export async function crearTipoMedidaPersonalizada(data: CrearTipoMedidaInput) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return { success: false, error: "No autenticado" };
  }

  try {
    const nombreLimpio = data.nombre.trim();
    if (!nombreLimpio) {
      return { success: false, error: "El nombre de la nueva medida es obligatorio" };
    }

    // Generar un slug único para la clave
    const slugBase = nombreLimpio
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    const clave = `custom_${slugBase || "medida"}`;

    // Verificar si ya existe esa clave en las predeterminadas o en las personalizadas del usuario
    const yaExistePredeterminada = METRICAS_PREDEFINIDAS.some((m) => m.key === clave);
    const yaExisteUsuario = await prisma.tipoMedidaPersonalizada.findUnique({
      where: {
        usuarioId_clave: {
          usuarioId: sessionUser.id,
          clave,
        },
      },
    });

    if (yaExistePredeterminada || yaExisteUsuario) {
      return { success: false, error: `Ya existe una medida con el nombre "${nombreLimpio}"` };
    }

    const nuevoTipo = await prisma.tipoMedidaPersonalizada.create({
      data: {
        usuarioId: sessionUser.id,
        clave,
        nombre: nombreLimpio,
        unidad: data.unidad?.trim() || "cm",
        icono: data.icono?.trim() || "📐",
        color: data.color?.trim() || "#8b5cf6",
      },
    });

    revalidatePath("/mis-medidas");

    return {
      success: true,
      tipoMedida: {
        key: nuevoTipo.clave,
        label: nuevoTipo.nombre,
        unidad: nuevoTipo.unidad,
        icono: nuevoTipo.icono,
        descripcion: `Medida personalizada: ${nuevoTipo.nombre}`,
        color: nuevoTipo.color,
        esPersonalizada: true,
      },
    };
  } catch (error: unknown) {
    console.error("Error al crear tipo de medida personalizada:", error);
    const message =
      error instanceof Error ? error.message : "Error al crear la nueva medida";
    return { success: false, error: message };
  }
}
