"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  MESES_NOMBRES,
  type UsuarioEconomiaItem,
  type GastoOperativoItem,
  type CategoriaGastoDesglose,
  type MetricasEconomia,
  type SucursalResumenEconomia,
  type MesEvolucion,
  type MetodoPagoDesglose,
  type EconomiaDataResponse,
} from "./types";

export type {
  UsuarioEconomiaItem,
  GastoOperativoItem,
  CategoriaGastoDesglose,
  MetricasEconomia,
  SucursalResumenEconomia,
  MesEvolucion,
  MetodoPagoDesglose,
  EconomiaDataResponse,
};

export async function getEconomiaData({
  mes,
  anio,
  sucursalId = null,
}: {
  mes?: number;
  anio?: number;
  sucursalId?: number | null;
} = {}): Promise<EconomiaDataResponse> {
  const now = new Date();
  const targetMes = mes !== undefined ? Number(mes) : now.getMonth() + 1; // 1-12
  const targetAnio = anio !== undefined ? Number(anio) : now.getFullYear();
  const targetSucursalId =
    sucursalId !== undefined && sucursalId !== null ? Number(sucursalId) : null;

  // 1. Obtener todos los usuarios activos (rol USER) con su plan y sucursal, planes, sucursales, pagos del mes, ventas de kiosco del mes y gastos operativos del mes
  const [
    usuariosRaw,
    planesRaw,
    sucursalesRaw,
    pagosMesActual,
    ventasKioscoMesActual,
    gastosMesActual,
  ] = await Promise.all([
    prisma.usuario.findMany({
      where: {
        role: "USER",
        deletedAt: null,
      },
      include: {
        plan: true,
        sucursal: {
          select: {
            id: true,
            barrio: true,
            direccion: true,
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { apellido: "asc" }, { nombre: "asc" }],
    }),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { precio: "asc" },
    }),
    prisma.sucursal.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
    }),
    prisma.pago.findMany({
      where: {
        mes: targetMes,
        anio: targetAnio,
      },
    }),
    prisma.ventaKiosco.findMany({
      where: {
        mes: targetMes,
        anio: targetAnio,
      },
    }),
    prisma.gastoOperativo.findMany({
      where: {
        mes: targetMes,
        anio: targetAnio,
      },
      include: {
        sucursal: {
          select: {
            id: true,
            barrio: true,
            direccion: true,
          },
        },
      },
      orderBy: [{ fechaGasto: "desc" }, { id: "desc" }],
    }),
  ]);

  const mapPagosMesActual = new Map<number, (typeof pagosMesActual)[0]>();
  for (const p of pagosMesActual) {
    mapPagosMesActual.set(p.usuarioId, p);
  }

  // Mapear todos los usuarios con su estado de pago y sucursal
  const todosLosUsuarios: UsuarioEconomiaItem[] = usuariosRaw.map((u) => {
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
      sucursalId: u.sucursalId,
      sucursal: u.sucursal
        ? {
          id: u.sucursal.id,
          barrio: u.sucursal.barrio,
          direccion: u.sucursal.direccion,
        }
        : null,
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

  // Calcular el resumen económico de cada sucursal
  const calcularMetricasParaUsuarios = (
    listaUsuarios: UsuarioEconomiaItem[],
    listaVentasKiosco: typeof ventasKioscoMesActual,
    listaGastosOperativos: typeof gastosMesActual
  ) => {
    let recHastaAhora = 0;
    let recTotalPotencial = 0;
    let mPagados = 0;
    let mPendientes = 0;
    let totalConPlan = 0;

    for (const u of listaUsuarios) {
      if (u.isActive && u.plan) {
        totalConPlan++;
        recTotalPotencial += u.plan.precio;

        if (u.haPagado && u.pagoMesActual) {
          recHastaAhora += u.pagoMesActual.monto;
          mPagados++;
        } else {
          mPendientes++;
        }
      } else if (u.haPagado && u.pagoMesActual) {
        recHastaAhora += u.pagoMesActual.monto;
        recTotalPotencial += u.pagoMesActual.monto;
        mPagados++;
      }
    }

    const pendCobro = Math.max(0, recTotalPotencial - recHastaAhora);
    const porcCobrado =
      recTotalPotencial > 0
        ? Math.round((recHastaAhora / recTotalPotencial) * 1000) / 10
        : 0;

    let ingKiosco = 0;
    let costKiosco = 0;
    let ganNetaKiosco = 0;
    const cantVentasKiosco = listaVentasKiosco.length;

    for (const v of listaVentasKiosco) {
      ingKiosco += Number(v.totalVenta);
      costKiosco += Number(v.totalCosto);
      ganNetaKiosco += Number(v.gananciaNeta);
    }

    let totalGastosOp = 0;
    const cantGastosOp = listaGastosOperativos.length;
    for (const g of listaGastosOperativos) {
      totalGastosOp += Number(g.monto);
    }

    const recTotalConKiosco = recHastaAhora + ingKiosco;
    const egresosTot = totalGastosOp + costKiosco;
    const beneficioNeto = recTotalConKiosco - egresosTot;
    const margenNetoPorc =
      recTotalConKiosco > 0
        ? Math.round((beneficioNeto / recTotalConKiosco) * 1000) / 10
        : 0;

    return {
      recaudacionHastaAhora: recHastaAhora,
      recaudacionTotalPotencial: recTotalPotencial,
      pendienteCobro: pendCobro,
      porcentajeCobrado: porcCobrado,
      totalMiembrosConPlan: totalConPlan,
      miembrosPagados: mPagados,
      miembrosPendientes: mPendientes,
      ingresosKiosco: ingKiosco,
      costoKiosco: costKiosco,
      gananciaNetaKiosco: ganNetaKiosco,
      cantidadVentasKiosco: cantVentasKiosco,
      recaudacionTotalConKiosco: recTotalConKiosco,
      totalGastosOperativos: totalGastosOp,
      cantidadGastosOperativos: cantGastosOp,
      egresosTotales: egresosTot,
      beneficioNetoReal: beneficioNeto,
      margenNetoPorcentaje: margenNetoPorc,
    };
  };

  const sucursalesResumen: SucursalResumenEconomia[] = sucursalesRaw.map((s) => {
    const usuariosDeSucursal = todosLosUsuarios.filter(
      (u) => u.sucursalId === s.id
    );
    const ventasKioscoDeSucursal = ventasKioscoMesActual.filter(
      (v) => v.sucursalId === s.id
    );
    const gastosDeSucursal = gastosMesActual.filter(
      (g) => g.sucursalId === s.id
    );
    const met = calcularMetricasParaUsuarios(
      usuariosDeSucursal,
      ventasKioscoDeSucursal,
      gastosDeSucursal
    );
    return {
      id: s.id,
      barrio: s.barrio,
      direccion: s.direccion,
      telefono: s.telefono,
      tieneKiosco: s.tieneKiosco,
      ...met,
    };
  });

  // Filtrar usuarios según la vista seleccionada (Vista Global = todos, o Vista por Sucursal)
  const usuarios: UsuarioEconomiaItem[] =
    targetSucursalId !== null
      ? todosLosUsuarios.filter((u) => u.sucursalId === targetSucursalId)
      : todosLosUsuarios;

  const ventasKioscoVista =
    targetSucursalId !== null
      ? ventasKioscoMesActual.filter((v) => v.sucursalId === targetSucursalId)
      : ventasKioscoMesActual;

  const gastosVistaRaw =
    targetSucursalId !== null
      ? gastosMesActual.filter((g) => g.sucursalId === targetSucursalId)
      : gastosMesActual;

  const gastosOperativos: GastoOperativoItem[] = gastosVistaRaw.map((g) => ({
    id: g.id,
    sucursalId: g.sucursalId,
    sucursal: {
      id: g.sucursal.id,
      barrio: g.sucursal.barrio,
      direccion: g.sucursal.direccion,
    },
    concepto: g.concepto,
    categoria: g.categoria,
    monto: Number(g.monto),
    metodoPago: g.metodoPago,
    comprobante: g.comprobante,
    notas: g.notas,
    esRecurrente: g.esRecurrente,
    fechaGasto: g.fechaGasto.toISOString(),
    mes: g.mes,
    anio: g.anio,
  }));

  // Desglose por categoría de gasto para la vista seleccionada
  const categoriasCount = new Map<string, { total: number; cantidad: number }>();
  let totalMontoCategoriasGasto = 0;
  for (const g of gastosOperativos) {
    const cat = g.categoria || "Otros";
    totalMontoCategoriasGasto += g.monto;
    const current = categoriasCount.get(cat) || { total: 0, cantidad: 0 };
    categoriasCount.set(cat, {
      total: current.total + g.monto,
      cantidad: current.cantidad + 1,
    });
  }

  const categoriasGastoDesglose: CategoriaGastoDesglose[] = Array.from(
    categoriasCount.entries()
  )
    .map(([categoria, data]) => ({
      categoria,
      total: data.total,
      cantidad: data.cantidad,
      porcentaje:
        totalMontoCategoriasGasto > 0
          ? Math.round((data.total / totalMontoCategoriasGasto) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const setUsuariosVistaIds = new Set(usuarios.map((u) => u.id));

  // Métricas del mes actual seleccionado (si es Vista Global es la sumatoria de todas las sucursales)
  const metricasCalculadas = calcularMetricasParaUsuarios(
    usuarios,
    ventasKioscoVista,
    gastosVistaRaw
  );

  const metricas: MetricasEconomia = {
    mes: targetMes,
    anio: targetAnio,
    nombreMes: MESES_NOMBRES[targetMes - 1],
    ...metricasCalculadas,
  };

  const {
    recaudacionHastaAhora,
    recaudacionTotalPotencial,
    totalMiembrosConPlan,
  } = metricas;

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

  // Traer todos los pagos, ventas de kiosco y gastos operativos de los últimos meses (filtrados por sucursal si aplica)
  const [
    todosLosPagosHistoricos,
    todasLasVentasKioscoHistoricas,
    todosLosGastosHistoricos,
  ] = await Promise.all([
    prisma.pago.findMany({
      where: {
        OR: mesesHistoricos.map((mh) => ({ mes: mh.mes, anio: mh.anio })),
        ...(targetSucursalId !== null
          ? { usuario: { sucursalId: targetSucursalId } }
          : {}),
      },
    }),
    prisma.ventaKiosco.findMany({
      where: {
        OR: mesesHistoricos.map((mh) => ({ mes: mh.mes, anio: mh.anio })),
        ...(targetSucursalId !== null
          ? { sucursalId: targetSucursalId }
          : {}),
      },
    }),
    prisma.gastoOperativo.findMany({
      where: {
        OR: mesesHistoricos.map((mh) => ({ mes: mh.mes, anio: mh.anio })),
        ...(targetSucursalId !== null
          ? { sucursalId: targetSucursalId }
          : {}),
      },
    }),
  ]);

  const evolucionHistorica: MesEvolucion[] = mesesHistoricos.map((mh) => {
    const pagosDelMes = todosLosPagosHistoricos.filter(
      (p) => p.mes === mh.mes && p.anio === mh.anio
    );
    const ventasKioscoDelMes = todasLasVentasKioscoHistoricas.filter(
      (v) => v.mes === mh.mes && v.anio === mh.anio
    );
    const gastosDelMes = todosLosGastosHistoricos.filter(
      (g) => g.mes === mh.mes && g.anio === mh.anio
    );
    const recaudacionCuotas = pagosDelMes.reduce(
      (acc, p) => acc + Number(p.monto),
      0
    );
    const recaudacionKiosco = ventasKioscoDelMes.reduce(
      (acc, v) => acc + Number(v.totalVenta),
      0
    );
    const costoKioscoMes = ventasKioscoDelMes.reduce(
      (acc, v) => acc + Number(v.totalCosto),
      0
    );
    const gastosOperativosMes = gastosDelMes.reduce(
      (acc, g) => acc + Number(g.monto),
      0
    );
    const recaudacion = recaudacionCuotas + recaudacionKiosco;
    const gastos = gastosOperativosMes + costoKioscoMes;
    const beneficioNeto = recaudacion - gastos;
    const usuariosUnicos = new Set(pagosDelMes.map((p) => p.usuarioId)).size;
    const shortMes = MESES_NOMBRES[mh.mes - 1].slice(0, 3);

    return {
      mes: mh.mes,
      anio: mh.anio,
      label: `${shortMes} '${String(mh.anio).slice(-2)}`,
      recaudacion,
      gastos,
      beneficioNeto,
      cantidadUsuarios: usuariosUnicos,
      esProyeccion: false,
    };
  });

  // 3. Proyección a futuro (próximos 3 meses)
  let tasaCrecimientoDinero = 0.08; // 8% base por defecto
  const tasaCrecimientoUsuarios = 0.07; // 7% base por defecto

  if (evolucionHistorica.length >= 3) {
    const primerasRecaudaciones = evolucionHistorica
      .map((e) => e.recaudacion)
      .filter((r) => r > 0);
    if (primerasRecaudaciones.length >= 2) {
      const inicial = primerasRecaudaciones[0];
      const final =
        recaudacionTotalPotencial > 0
          ? recaudacionTotalPotencial + metricas.ingresosKiosco
          : primerasRecaudaciones[primerasRecaudaciones.length - 1];
      const pasos = primerasRecaudaciones.length;
      if (inicial > 0 && final > inicial) {
        tasaCrecimientoDinero = Math.min(
          0.25,
          Math.max(0.03, (final - inicial) / (inicial * pasos))
        );
      }
    }
  }

  const baseRecaudacionProyeccion =
    recaudacionTotalPotencial > 0
      ? recaudacionTotalPotencial + metricas.ingresosKiosco
      : metricas.recaudacionTotalConKiosco;
  const baseGastosProyeccion = metricas.egresosTotales;
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
    const factorGastos = Math.pow(1.03, i); // 3% ajuste estimado en egresos
    const factorUser = Math.pow(1 + tasaCrecimientoUsuarios, i);
    const shortMes = MESES_NOMBRES[m - 1].slice(0, 3);
    const recProy = Math.round((baseRecaudacionProyeccion * factor) / 1000) * 1000;
    const gasProy = Math.round((baseGastosProyeccion * factorGastos) / 1000) * 1000;

    proyeccionFutura.push({
      mes: m,
      anio: a,
      label: `${shortMes} '${String(a).slice(-2)}`,
      recaudacion: recProy,
      gastos: gasProy,
      beneficioNeto: recProy - gasProy,
      cantidadUsuarios: Math.round(baseUsuariosProyeccion * factorUser),
      esProyeccion: true,
    });
  }

  // 4. Desglose por método de pago del mes (para la vista seleccionada: Cuotas + Kiosco)
  const metodosCount = new Map<string, { total: number; cantidad: number }>();
  let totalMontoMetodos = 0;

  const pagosVistaMesActual =
    targetSucursalId !== null
      ? pagosMesActual.filter((p) => setUsuariosVistaIds.has(p.usuarioId))
      : pagosMesActual;

  for (const p of pagosVistaMesActual) {
    const metodo = p.metodoPago?.trim() || "Efectivo";
    const monto = Number(p.monto);
    totalMontoMetodos += monto;
    const current = metodosCount.get(metodo) || { total: 0, cantidad: 0 };
    metodosCount.set(metodo, {
      total: current.total + monto,
      cantidad: current.cantidad + 1,
    });
  }

  for (const v of ventasKioscoVista) {
    const metodo = v.metodoPago?.trim() || "Efectivo";
    const monto = Number(v.totalVenta);
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
    gastosOperativos,
    categoriasGastoDesglose,
    evolucionHistorica,
    proyeccionFutura,
    metodosPagoDesglose,
    planesDisponibles,
    sucursalesResumen,
    sucursalSeleccionadaId: targetSucursalId,
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
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERADMIN")) {
      return { success: false, error: "No autorizado para gestionar pagos." };
    }

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
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERADMIN")) {
      return { success: false, error: "No autorizado para registrar pagos." };
    }

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
 * Anula un pago registrado (y emite reembolso en Mercado Pago si corresponde)
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
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERADMIN")) {
      return { success: false, error: "No autorizado para anular pagos." };
    }

    const pagoExistente = await prisma.pago.findUnique({
      where: {
        usuarioId_anio_mes: {
          usuarioId,
          anio,
          mes,
        },
      },
    });

    if (
      pagoExistente?.comprobante &&
      pagoExistente.comprobante.startsWith("MP-") &&
      !pagoExistente.comprobante.startsWith("MP-SIM-") &&
      !pagoExistente.comprobante.startsWith("MP-SUB-")
    ) {
      try {
        const { reembolsarPagoMercadoPago } = await import("@/lib/mercadopago");
        await reembolsarPagoMercadoPago(pagoExistente.comprobante);
      } catch (refundErr) {
        console.warn("[Mercado Pago Refund] No se pudo reembolsar en MP:", refundErr);
      }
    }

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
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERADMIN")) {
      return { success: false, error: "No autorizado para generar links de cobro." };
    }

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
      dniUsuario: usuario.dni,
      telefonoUsuario: usuario.telefono,
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

/**
 * Crea un nuevo gasto operativo (alquiler, profesores, luz, reposición de máquinas, etc.) asociado a una sucursal
 */
export async function crearGastoOperativo(input: {
  sucursalId: number;
  concepto: string;
  categoria: string;
  monto: number;
  metodoPago?: string;
  comprobante?: string | null;
  notas?: string | null;
  esRecurrente?: boolean;
  mes: number;
  anio: number;
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERADMIN")) {
      return { success: false, error: "No autorizado para registrar gastos." };
    }

    const sucursalId = Number(input.sucursalId);
    const concepto = input.concepto.trim();
    const categoria = input.categoria.trim() || "Alquiler";
    const monto = Math.max(0, Number(input.monto) || 0);
    const metodoPago = input.metodoPago?.trim() || "Transferencia";
    const mes = Number(input.mes);
    const anio = Number(input.anio);

    if (!sucursalId || !concepto || monto <= 0) {
      return {
        success: false,
        error: "Indicá sucursal, concepto y un monto mayor a $0.",
      };
    }

    await prisma.gastoOperativo.create({
      data: {
        sucursalId,
        concepto,
        categoria,
        monto,
        metodoPago,
        comprobante: input.comprobante?.trim() || null,
        notas: input.notas?.trim() || null,
        esRecurrente: Boolean(input.esRecurrente),
        mes,
        anio,
      },
    });

    revalidatePath("/admin/economia");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al crear gasto operativo:", error);
    const message = error instanceof Error ? error.message : "Error al registrar el gasto";
    return { success: false, error: message };
  }
}

/**
 * Actualiza un gasto operativo existente
 */
export async function actualizarGastoOperativo(input: {
  id: number;
  sucursalId: number;
  concepto: string;
  categoria: string;
  monto: number;
  metodoPago?: string;
  comprobante?: string | null;
  notas?: string | null;
  esRecurrente?: boolean;
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERADMIN")) {
      return { success: false, error: "No autorizado para editar gastos." };
    }

    const id = Number(input.id);
    const sucursalId = Number(input.sucursalId);
    const concepto = input.concepto.trim();
    const categoria = input.categoria.trim() || "Alquiler";
    const monto = Math.max(0, Number(input.monto) || 0);
    const metodoPago = input.metodoPago?.trim() || "Transferencia";

    if (!id || !sucursalId || !concepto || monto <= 0) {
      return {
        success: false,
        error: "Indicá sucursal, concepto y un monto mayor a $0.",
      };
    }

    await prisma.gastoOperativo.update({
      where: { id },
      data: {
        sucursalId,
        concepto,
        categoria,
        monto,
        metodoPago,
        comprobante: input.comprobante?.trim() || null,
        notas: input.notas?.trim() || null,
        esRecurrente: Boolean(input.esRecurrente),
      },
    });

    revalidatePath("/admin/economia");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al actualizar gasto operativo:", error);
    const message = error instanceof Error ? error.message : "Error al actualizar el gasto";
    return { success: false, error: message };
  }
}

/**
 * Elimina un gasto operativo
 */
export async function eliminarGastoOperativo(id: number) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERADMIN")) {
      return { success: false, error: "No autorizado para eliminar gastos." };
    }

    await prisma.gastoOperativo.delete({
      where: { id: Number(id) },
    });

    revalidatePath("/admin/economia");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al eliminar gasto operativo:", error);
    const message = error instanceof Error ? error.message : "Error al eliminar el gasto";
    return { success: false, error: message };
  }
}

/**
 * Copia los gastos marcados como recurrentes (fijos mensuales) del mes anterior al período indicado
 */
export async function clonarGastosRecurrentesMesAnterior({
  mes,
  anio,
  sucursalId = null,
}: {
  mes: number;
  anio: number;
  sucursalId?: number | null;
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERADMIN")) {
      return { success: false, error: "No autorizado." };
    }

    const targetMes = Number(mes);
    const targetAnio = Number(anio);
    const prevMes = targetMes === 1 ? 12 : targetMes - 1;
    const prevAnio = targetMes === 1 ? targetAnio - 1 : targetAnio;

    const gastosPrevios = await prisma.gastoOperativo.findMany({
      where: {
        mes: prevMes,
        anio: prevAnio,
        esRecurrente: true,
        ...(sucursalId !== null ? { sucursalId: Number(sucursalId) } : {}),
      },
    });

    if (gastosPrevios.length === 0) {
      return {
        success: false,
        error: "No se encontraron gastos fijos recurrentes en el mes anterior para copiar.",
      };
    }

    const existentesActuales = await prisma.gastoOperativo.findMany({
      where: {
        mes: targetMes,
        anio: targetAnio,
        ...(sucursalId !== null ? { sucursalId: Number(sucursalId) } : {}),
      },
    });

    const clavesExistentes = new Set(
      existentesActuales.map(
        (g) => `${g.sucursalId}_${g.concepto.toLowerCase().trim()}_${g.categoria}`
      )
    );

    const aCrear = gastosPrevios.filter(
      (g) =>
        !clavesExistentes.has(
          `${g.sucursalId}_${g.concepto.toLowerCase().trim()}_${g.categoria}`
        )
    );

    if (aCrear.length === 0) {
      return {
        success: false,
        error: "Los gastos recurrentes del mes anterior ya están cargados en este período.",
      };
    }

    await prisma.gastoOperativo.createMany({
      data: aCrear.map((g) => ({
        sucursalId: g.sucursalId,
        concepto: g.concepto,
        categoria: g.categoria,
        monto: g.monto,
        metodoPago: g.metodoPago,
        comprobante: null,
        notas: g.notas,
        esRecurrente: true,
        mes: targetMes,
        anio: targetAnio,
      })),
    });

    revalidatePath("/admin/economia");
    return { success: true, cantidadCopiados: aCrear.length };
  } catch (error: unknown) {
    console.error("Error al clonar gastos recurrentes:", error);
    const message = error instanceof Error ? error.message : "Error al copiar gastos fijos";
    return { success: false, error: message };
  }
}



