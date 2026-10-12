"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@lib/prisma";
import {
  MESES_NOMBRES,
  type UsuarioEconomiaItem,
  type MetricasEconomia,
  type MesEvolucion,
  type MetodoPagoDesglose,
  type EconomiaDataResponse,
} from "./types";

export type {
  UsuarioEconomiaItem,
  MetricasEconomia,
  MesEvolucion,
  MetodoPagoDesglose,
  EconomiaDataResponse,
};

export async function getEconomiaData({
  mes,
  anio,
}: {
  mes?: number;
  anio?: number;
} = {}): Promise<EconomiaDataResponse> {
  const now = new Date();
  const targetMes = mes !== undefined ? Number(mes) : now.getMonth() + 1; // 1-12
  const targetAnio = anio !== undefined ? Number(anio) : now.getFullYear();

  // 1. Obtener todos los usuarios activos (rol USER) con su plan
  const [usuariosRaw, planesRaw, pagosMesActual] = await Promise.all([
    prisma.usuario.findMany({
      where: {
        role: "USER",
        deletedAt: null,
      },
      include: {
        plan: true,
      },
      orderBy: [{ isActive: "desc" }, { apellido: "asc" }, { nombre: "asc" }],
    }),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { precio: "asc" },
    }),
    prisma.pago.findMany({
      where: {
        mes: targetMes,
        anio: targetAnio,
      },
    }),
  ]);

  const mapPagosMesActual = new Map<number, (typeof pagosMesActual)[0]>();
  for (const p of pagosMesActual) {
    mapPagosMesActual.set(p.usuarioId, p);
  }

  // Mapear usuarios con su estado de pago del mes solicitado
  const usuarios: UsuarioEconomiaItem[] = usuariosRaw.map((u) => {
    const pago = mapPagosMesActual.get(u.id) || null;
    const precioPlan = u.plan?.precio ? Number(u.plan.precio) : 0;

    return {
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      dni: u.dni,
      email: u.email,
      telefono: u.telefono,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      plan: u.plan
        ? {
          id: u.plan.id,
          nombre: u.plan.nombre,
          precio: precioPlan,
          diasPorSemana: u.plan.diasPorSemana,
        }
        : null,
      pagoMesActual: pago
        ? {
          id: pago.id,
          monto: Number(pago.monto),
          fechaPago: pago.fechaPago.toISOString(),
          metodoPago: pago.metodoPago,
          comprobante: pago.comprobante,
          notas: pago.notas,
        }
        : null,
      haPagado: Boolean(pago),
    };
  });

  // Métricas del mes actual seleccionado
  let recaudacionHastaAhora = 0;
  let recaudacionTotalPotencial = 0;
  let miembrosPagados = 0;
  let miembrosPendientes = 0;
  let totalMiembrosConPlan = 0;

  for (const u of usuarios) {
    if (u.isActive && u.plan) {
      totalMiembrosConPlan++;
      recaudacionTotalPotencial += u.plan.precio;

      if (u.haPagado && u.pagoMesActual) {
        recaudacionHastaAhora += u.pagoMesActual.monto;
        miembrosPagados++;
      } else {
        miembrosPendientes++;
      }
    } else if (u.haPagado && u.pagoMesActual) {
      // Usuario sin plan que igual registró un pago
      recaudacionHastaAhora += u.pagoMesActual.monto;
      recaudacionTotalPotencial += u.pagoMesActual.monto;
      miembrosPagados++;
    }
  }

  const pendienteCobro = Math.max(0, recaudacionTotalPotencial - recaudacionHastaAhora);
  const porcentajeCobrado =
    recaudacionTotalPotencial > 0
      ? Math.round((recaudacionHastaAhora / recaudacionTotalPotencial) * 1000) / 10
      : 0;

  const metricas: MetricasEconomia = {
    mes: targetMes,
    anio: targetAnio,
    nombreMes: MESES_NOMBRES[targetMes - 1],
    recaudacionHastaAhora,
    recaudacionTotalPotencial,
    pendienteCobro,
    porcentajeCobrado,
    totalMiembrosConPlan,
    miembrosPagados,
    miembrosPendientes,
  };

  // 2. Histórico de evolución mes a mes (últimos 6 meses hasta el targetMes)
  const mesesHistoricos: Array<{ mes: number; anio: number }> = [];
  for (let i = 5; i >= 0; i--) {
    let m = targetMes - i;
    let a = targetAnio;
    while (m <= 0) {
      m += 12;
      a -= 1;
    }
    mesesHistoricos.push({ mes: m, anio: a });
  }

  // Traer todos los pagos de los últimos meses
  const todosLosPagosHistoricos = await prisma.pago.findMany({
    where: {
      OR: mesesHistoricos.map((mh) => ({ mes: mh.mes, anio: mh.anio })),
    },
  });

  const evolucionHistorica: MesEvolucion[] = mesesHistoricos.map((mh) => {
    const pagosDelMes = todosLosPagosHistoricos.filter(
      (p) => p.mes === mh.mes && p.anio === mh.anio
    );
    const recaudacion = pagosDelMes.reduce((acc, p) => acc + Number(p.monto), 0);
    const usuariosUnicos = new Set(pagosDelMes.map((p) => p.usuarioId)).size;
    const shortMes = MESES_NOMBRES[mh.mes - 1].slice(0, 3);

    return {
      mes: mh.mes,
      anio: mh.anio,
      label: `${shortMes} '${String(mh.anio).slice(-2)}`,
      recaudacion,
      cantidadUsuarios: usuariosUnicos,
      esProyeccion: false,
    };
  });

  // 3. Proyección a futuro (próximos 3 meses)
  // Calculamos la tasa de crecimiento promedio mensual sobre los datos históricos disponibles
  let tasaCrecimientoDinero = 0.08; // 8% base por defecto
  const tasaCrecimientoUsuarios = 0.07; // 7% base por defecto

  if (evolucionHistorica.length >= 3) {
    const primerasRecaudaciones = evolucionHistorica
      .map((e) => e.recaudacion)
      .filter((r) => r > 0);
    if (primerasRecaudaciones.length >= 2) {
      const inicial = primerasRecaudaciones[0];
      const final = recaudacionTotalPotencial > 0 ? recaudacionTotalPotencial : primerasRecaudaciones[primerasRecaudaciones.length - 1];
      const pasos = primerasRecaudaciones.length;
      if (inicial > 0 && final > inicial) {
        tasaCrecimientoDinero = Math.min(0.25, Math.max(0.03, (final - inicial) / (inicial * pasos)));
      }
    }
  }

  const baseRecaudacionProyeccion =
    recaudacionTotalPotencial > 0 ? recaudacionTotalPotencial : recaudacionHastaAhora;
  const baseUsuariosProyeccion =
    totalMiembrosConPlan > 0 ? totalMiembrosConPlan : usuarios.length;

  const proyeccionFutura: MesEvolucion[] = [];
  for (let i = 1; i <= 3; i++) {
    let m = targetMes + i;
    let a = targetAnio;
    while (m > 12) {
      m -= 12;
      a += 1;
    }
    const factor = Math.pow(1 + tasaCrecimientoDinero, i);
    const factorUser = Math.pow(1 + tasaCrecimientoUsuarios, i);
    const shortMes = MESES_NOMBRES[m - 1].slice(0, 3);

    proyeccionFutura.push({
      mes: m,
      anio: a,
      label: `${shortMes} '${String(a).slice(-2)}`,
      recaudacion: Math.round((baseRecaudacionProyeccion * factor) / 1000) * 1000,
      cantidadUsuarios: Math.round(baseUsuariosProyeccion * factorUser),
      esProyeccion: true,
    });
  }

  // 4. Desglose por método de pago del mes
  const metodosCount = new Map<string, { total: number; cantidad: number }>();
  let totalMontoMetodos = 0;

  for (const p of pagosMesActual) {
    const metodo = p.metodoPago?.trim() || "Efectivo";
    const monto = Number(p.monto);
    totalMontoMetodos += monto;
    const current = metodosCount.get(metodo) || { total: 0, cantidad: 0 };
    metodosCount.set(metodo, {
      total: current.total + monto,
      cantidad: current.cantidad + 1,
    });
  }

  const metodosPagoDesglose: MetodoPagoDesglose[] = Array.from(
    metodosCount.entries()
  ).map(([metodo, data]) => ({
    metodo,
    total: data.total,
    cantidad: data.cantidad,
    porcentaje:
      totalMontoMetodos > 0
        ? Math.round((data.total / totalMontoMetodos) * 1000) / 10
        : 0,
  }));

  const planesDisponibles = planesRaw.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precio: p.precio ? Number(p.precio) : 0,
  }));

  return {
    metricas,
    usuarios,
    evolucionHistorica,
    proyeccionFutura,
    metodosPagoDesglose,
    planesDisponibles,
  };
}

/**
 * Alterna el estado de pago de un usuario para el mes/año indicado:
 * Si ya pagó, anula el registro de pago.
 * Si estaba pendiente, registra el pago con el valor del plan.
 */
export async function togglePagoMes({
  usuarioId,
  mes,
  anio,
  metodoPago = "Efectivo",
}: {
  usuarioId: number;
  mes: number;
  anio: number;
  metodoPago?: string;
}) {
  try {
    const pagoExistente = await prisma.pago.findUnique({
      where: {
        usuarioId_anio_mes: {
          usuarioId,
          anio,
          mes,
        },
      },
    });

    if (pagoExistente) {
      // Eliminar / desmarcar pago
      await prisma.pago.delete({
        where: { id: pagoExistente.id },
      });

      revalidatePath("/admin/economia");
      return { success: true, pagado: false };
    } else {
      // Obtener el precio del plan del usuario
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        include: { plan: true },
      });

      const monto = usuario?.plan?.precio ? Number(usuario.plan.precio) : 28000;

      await prisma.pago.create({
        data: {
          usuarioId,
          anio,
          mes,
          monto,
          fechaPago: new Date(),
          metodoPago,
          comprobante: "REC-" + Math.floor(100000 + Math.random() * 900000),
        },
      });

      revalidatePath("/admin/economia");
      return { success: true, pagado: true };
    }
  } catch (error: unknown) {
    console.error("Error al alternar pago:", error);
    const message = error instanceof Error ? error.message : "Error al actualizar estado de pago";
    return { success: false, error: message };
  }
}

/**
 * Registra o actualiza un pago con datos detallados (monto, medio de pago, comprobante, notas)
 */
export async function registrarPagoDetallado({
  usuarioId,
  mes,
  anio,
  monto,
  metodoPago = "Efectivo",
  comprobante,
  notas,
}: {
  usuarioId: number;
  mes: number;
  anio: number;
  monto: number;
  metodoPago?: string;
  comprobante?: string;
  notas?: string;
}) {
  try {
    const montoNum = Math.max(0, Number(monto) || 0);

    const pago = await prisma.pago.upsert({
      where: {
        usuarioId_anio_mes: {
          usuarioId,
          anio,
          mes,
        },
      },
      update: {
        monto: montoNum,
        metodoPago: metodoPago.trim(),
        comprobante: comprobante?.trim() || null,
        notas: notas?.trim() || null,
        fechaPago: new Date(),
      },
      create: {
        usuarioId,
        anio,
        mes,
        monto: montoNum,
        metodoPago: metodoPago.trim(),
        comprobante: comprobante?.trim() || "REC-" + Math.floor(100000 + Math.random() * 900000),
        notas: notas?.trim() || null,
        fechaPago: new Date(),
      },
    });

    revalidatePath("/admin/economia");
    return { success: true, pago };
  } catch (error: unknown) {
    console.error("Error al registrar pago detallado:", error);
    const message = error instanceof Error ? error.message : "Error al registrar el cobro";
    return { success: false, error: message };
  }
}

/**
 * Anula un pago registrado
 */
export async function anularPago({
  usuarioId,
  mes,
  anio,
}: {
  usuarioId: number;
  mes: number;
  anio: number;
}) {
  try {
    await prisma.pago.deleteMany({
      where: {
        usuarioId,
        anio,
        mes,
      },
    });

    revalidatePath("/admin/economia");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al anular pago:", error);
    const message = error instanceof Error ? error.message : "Error al anular el pago";
    return { success: false, error: message };
  }
}

/**
 * Genera un link de cobro online con Mercado Pago (Pago Único de Cuota o Suscripción con Débito Mensual)
 */
export async function crearLinkCobroOnline({
  usuarioId,
  mes,
  anio,
  tipoCobro = "cuota_mes",
}: {
  usuarioId: number;
  mes: number;
  anio: number;
  tipoCobro?: "cuota_mes" | "suscripcion_mensual";
}) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: { plan: true },
    });

    if (!usuario) {
      return { success: false, error: "Usuario no encontrado" };
    }

    const monto = usuario.plan?.precio ? Number(usuario.plan.precio) : 28000;
    const planNombre = usuario.plan?.nombre || "Plan Estándar";

    const { generarLinkMercadoPago } = await import("@/lib/mercadopago");

    const linkResultado = await generarLinkMercadoPago({
      usuarioId: usuario.id,
      nombreUsuario: usuario.nombre,
      apellidoUsuario: usuario.apellido,
      emailUsuario: usuario.email,
      planNombre,
      monto,
      mes,
      anio,
      tipoCobro,
    });

    return {
      success: true,
      link: linkResultado,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        telefono: usuario.telefono,
        email: usuario.email,
      },
    };
  } catch (error: unknown) {
    console.error("Error al generar link de Mercado Pago:", error);
    const message = error instanceof Error ? error.message : "Error al generar link de cobro";
    return { success: false, error: message };
  }
}


