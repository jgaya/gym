"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export interface SucursalKioscoOption {
  id: number;
  barrio: string;
  direccion: string;
  telefono: string;
  tieneKiosco: boolean;
}

export interface ProductoKioscoItem {
  id: number;
  sucursalId: number;
  sucursalBarrio: string;
  nombre: string;
  categoria: string;
  precioCompra: number;
  precioVenta: number;
  margenUnitario: number;
  porcentajeMargen: number;
  stock: number;
  stockMinimo: number;
  isActive: boolean;
}

export interface VentaKioscoItem {
  id: number;
  sucursalId: number;
  sucursalBarrio: string;
  productoId: number;
  productoNombre: string;
  productoCategoria: string;
  usuarioId: number | null;
  usuarioNombre: string | null;
  cantidad: number;
  precioCompraUnitario: number;
  precioVentaUnitario: number;
  totalCosto: number;
  totalVenta: number;
  gananciaNeta: number;
  metodoPago: string;
  notas: string | null;
  fechaVenta: string;
  mes: number;
  anio: number;
}

export interface ResumenKiosco {
  mes: number;
  anio: number;
  totalIngresos: number;
  totalCosto: number;
  gananciaNeta: number;
  cantidadOperaciones: number;
  unidadesVendidas: number;
  valorInventarioCosto: number;
  valorInventarioVenta: number;
  productosStockBajo: number;
}

export interface KioscoDataResponse {
  sucursales: SucursalKioscoOption[];
  sucursalSeleccionadaId: number | null;
  productos: ProductoKioscoItem[];
  ventas: VentaKioscoItem[];
  resumen: ResumenKiosco;
  sociosDisponibles: { id: number; nombre: string; apellido: string; dni: string }[];
}

export async function getKioscoData({
  sucursalId,
  mes,
  anio,
}: {
  sucursalId?: number | null;
  mes?: number;
  anio?: number;
} = {}): Promise<KioscoDataResponse> {
  const now = new Date();
  const targetMes = mes !== undefined ? Number(mes) : now.getMonth() + 1;
  const targetAnio = anio !== undefined ? Number(anio) : now.getFullYear();

  const sucursalesRaw = await prisma.sucursal.findMany({
    where: { isActive: true },
    orderBy: { id: "asc" },
  });

  const sucursales: SucursalKioscoOption[] = sucursalesRaw.map((s) => ({
    id: s.id,
    barrio: s.barrio,
    direccion: s.direccion,
    telefono: s.telefono,
    tieneKiosco: s.tieneKiosco,
  }));

  // Si sucursalId es undefined, seleccionamos por defecto la primera con kiosco activo (o la primera disponible)
  let targetSucursalId: number | null = null;
  if (sucursalId === undefined) {
    const primeraConKiosco = sucursales.find((s) => s.tieneKiosco);
    targetSucursalId = primeraConKiosco
      ? primeraConKiosco.id
      : sucursales[0]?.id ?? null;
  } else {
    targetSucursalId = sucursalId;
  }

  const whereSucursal =
    targetSucursalId !== null ? { sucursalId: targetSucursalId } : {};

  const [productosRaw, ventasRaw, sociosRaw] = await Promise.all([
    prisma.productoKiosco.findMany({
      where: {
        ...whereSucursal,
        isActive: true,
      },
      include: {
        sucursal: { select: { barrio: true } },
      },
      orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    }),
    prisma.ventaKiosco.findMany({
      where: {
        ...whereSucursal,
        mes: targetMes,
        anio: targetAnio,
      },
      include: {
        sucursal: { select: { barrio: true } },
        producto: { select: { nombre: true, categoria: true } },
        usuario: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fechaVenta: "desc" },
    }),
    prisma.usuario.findMany({
      where: {
        role: "USER",
        deletedAt: null,
        isActive: true,
        ...(targetSucursalId !== null ? { sucursalId: targetSucursalId } : {}),
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        dni: true,
      },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    }),
  ]);

  const productos: ProductoKioscoItem[] = productosRaw.map((p) => {
    const pCompra = Number(p.precioCompra);
    const pVenta = Number(p.precioVenta);
    const margen = pVenta - pCompra;
    const porc = pCompra > 0 ? Math.round((margen / pCompra) * 1000) / 10 : 100;

    return {
      id: p.id,
      sucursalId: p.sucursalId,
      sucursalBarrio: p.sucursal.barrio,
      nombre: p.nombre,
      categoria: p.categoria,
      precioCompra: pCompra,
      precioVenta: pVenta,
      margenUnitario: margen,
      porcentajeMargen: porc,
      stock: p.stock,
      stockMinimo: p.stockMinimo,
      isActive: p.isActive,
    };
  });

  const ventas: VentaKioscoItem[] = ventasRaw.map((v) => ({
    id: v.id,
    sucursalId: v.sucursalId,
    sucursalBarrio: v.sucursal.barrio,
    productoId: v.productoId,
    productoNombre: v.producto.nombre,
    productoCategoria: v.producto.categoria,
    usuarioId: v.usuarioId,
    usuarioNombre: v.usuario ? `${v.usuario.nombre} ${v.usuario.apellido}` : null,
    cantidad: v.cantidad,
    precioCompraUnitario: Number(v.precioCompraUnitario),
    precioVentaUnitario: Number(v.precioVentaUnitario),
    totalCosto: Number(v.totalCosto),
    totalVenta: Number(v.totalVenta),
    gananciaNeta: Number(v.gananciaNeta),
    metodoPago: v.metodoPago,
    notas: v.notas,
    fechaVenta: v.fechaVenta.toISOString(),
    mes: v.mes,
    anio: v.anio,
  }));

  let totalIngresos = 0;
  let totalCosto = 0;
  let gananciaNeta = 0;
  let unidadesVendidas = 0;

  for (const v of ventas) {
    totalIngresos += v.totalVenta;
    totalCosto += v.totalCosto;
    gananciaNeta += v.gananciaNeta;
    unidadesVendidas += v.cantidad;
  }

  let valorInventarioCosto = 0;
  let valorInventarioVenta = 0;
  let productosStockBajo = 0;

  for (const p of productos) {
    valorInventarioCosto += p.stock * p.precioCompra;
    valorInventarioVenta += p.stock * p.precioVenta;
    if (p.stock <= p.stockMinimo) {
      productosStockBajo++;
    }
  }

  return {
    sucursales,
    sucursalSeleccionadaId: targetSucursalId,
    productos,
    ventas,
    resumen: {
      mes: targetMes,
      anio: targetAnio,
      totalIngresos,
      totalCosto,
      gananciaNeta,
      cantidadOperaciones: ventas.length,
      unidadesVendidas,
      valorInventarioCosto,
      valorInventarioVenta,
      productosStockBajo,
    },
    sociosDisponibles: sociosRaw,
  };
}

export async function crearProductoKiosco(data: {
  sucursalId: number;
  nombre: string;
  categoria: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo?: number;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return { success: false, error: "No autorizado" };
    }

    const {
      sucursalId,
      nombre,
      categoria,
      precioCompra,
      precioVenta,
      stock,
      stockMinimo = 5,
    } = data;

    if (!sucursalId || !nombre?.trim()) {
      return { success: false, error: "Sucursal y nombre del producto son obligatorios" };
    }

    const prod = await prisma.productoKiosco.create({
      data: {
        sucursalId: Number(sucursalId),
        nombre: nombre.trim(),
        categoria: categoria?.trim() || "Bebidas",
        precioCompra: Math.max(0, Number(precioCompra) || 0),
        precioVenta: Math.max(0, Number(precioVenta) || 0),
        stock: Math.max(0, Math.floor(Number(stock) || 0)),
        stockMinimo: Math.max(0, Math.floor(Number(stockMinimo) || 0)),
        isActive: true,
      },
    });

    revalidatePath("/admin/kiosco");
    revalidatePath("/admin/economia");
    return { success: true, productoId: prod.id };
  } catch (error: unknown) {
    console.error("Error al crear producto de kiosco:", error);
    const message = error instanceof Error ? error.message : "Error al crear producto";
    return { success: false, error: message };
  }
}

export async function actualizarProductoKiosco(
  id: number,
  data: {
    nombre: string;
    categoria: string;
    precioCompra: number;
    precioVenta: number;
    stock: number;
    stockMinimo?: number;
  }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return { success: false, error: "No autorizado" };
    }

    const { nombre, categoria, precioCompra, precioVenta, stock, stockMinimo = 5 } = data;
    if (!nombre?.trim()) {
      return { success: false, error: "El nombre del producto es obligatorio" };
    }

    await prisma.productoKiosco.update({
      where: { id },
      data: {
        nombre: nombre.trim(),
        categoria: categoria?.trim() || "Bebidas",
        precioCompra: Math.max(0, Number(precioCompra) || 0),
        precioVenta: Math.max(0, Number(precioVenta) || 0),
        stock: Math.max(0, Math.floor(Number(stock) || 0)),
        stockMinimo: Math.max(0, Math.floor(Number(stockMinimo) || 0)),
      },
    });

    revalidatePath("/admin/kiosco");
    revalidatePath("/admin/economia");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al actualizar producto:", error);
    const message = error instanceof Error ? error.message : "Error al actualizar producto";
    return { success: false, error: message };
  }
}

export async function ajustarStockProducto({
  productoId,
  delta,
}: {
  productoId: number;
  delta: number;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return { success: false, error: "No autorizado" };
    }

    const prod = await prisma.productoKiosco.findUnique({
      where: { id: productoId },
    });
    if (!prod) {
      return { success: false, error: "Producto no encontrado" };
    }

    const nuevoStock = Math.max(0, prod.stock + Number(delta));
    await prisma.productoKiosco.update({
      where: { id: productoId },
      data: { stock: nuevoStock },
    });

    revalidatePath("/admin/kiosco");
    return { success: true, stock: nuevoStock };
  } catch (error: unknown) {
    console.error("Error al ajustar stock:", error);
    const message = error instanceof Error ? error.message : "Error al ajustar stock";
    return { success: false, error: message };
  }
}

export async function eliminarProductoKiosco(id: number) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return { success: false, error: "No autorizado" };
    }

    await prisma.productoKiosco.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/admin/kiosco");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al eliminar producto:", error);
    const message = error instanceof Error ? error.message : "Error al eliminar producto";
    return { success: false, error: message };
  }
}

export async function registrarVentaRapida({
  productoId,
  cantidad = 1,
  metodoPago = "Efectivo",
  usuarioId = null,
  notas = "",
}: {
  productoId: number;
  cantidad: number;
  metodoPago?: string;
  usuarioId?: number | null;
  notas?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return { success: false, error: "No autorizado" };
    }

    const cant = Math.max(1, Math.floor(Number(cantidad) || 1));

    const producto = await prisma.productoKiosco.findUnique({
      where: { id: productoId },
      include: { sucursal: true },
    });

    if (!producto || !producto.isActive) {
      return { success: false, error: "Producto no disponible" };
    }

    if (!producto.sucursal.tieneKiosco) {
      return {
        success: false,
        error: `La sucursal ${producto.sucursal.barrio} no tiene habilitado el Kiosco.`,
      };
    }

    if (producto.stock < cant) {
      return {
        success: false,
        error: `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock} u.`,
      };
    }

    const pCompra = Number(producto.precioCompra);
    const pVenta = Number(producto.precioVenta);
    const totalCosto = pCompra * cant;
    const totalVenta = pVenta * cant;
    const gananciaNeta = totalVenta - totalCosto;

    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    await prisma.$transaction([
      prisma.productoKiosco.update({
        where: { id: producto.id },
        data: { stock: { decrement: cant } },
      }),
      prisma.ventaKiosco.create({
        data: {
          sucursalId: producto.sucursalId,
          productoId: producto.id,
          usuarioId: usuarioId ? Number(usuarioId) : null,
          cantidad: cant,
          precioCompraUnitario: pCompra,
          precioVentaUnitario: pVenta,
          totalCosto,
          totalVenta,
          gananciaNeta,
          metodoPago: metodoPago?.trim() || "Efectivo",
          notas: notas?.trim() || null,
          fechaVenta: now,
          mes,
          anio,
        },
      }),
    ]);

    revalidatePath("/admin/kiosco");
    revalidatePath("/admin/economia");
    return {
      success: true,
      mensaje: `Venta registrada: ${cant}x ${producto.nombre} ($${totalVenta.toLocaleString("es-AR")})`,
    };
  } catch (error: unknown) {
    console.error("Error al registrar venta rápida:", error);
    const message = error instanceof Error ? error.message : "Error al registrar la venta";
    return { success: false, error: message };
  }
}

export async function anularVentaKiosco(ventaId: number) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return { success: false, error: "No autorizado" };
    }

    const venta = await prisma.ventaKiosco.findUnique({
      where: { id: ventaId },
    });

    if (!venta) {
      return { success: false, error: "Venta no encontrada" };
    }

    await prisma.$transaction([
      prisma.productoKiosco.update({
        where: { id: venta.productoId },
        data: { stock: { increment: venta.cantidad } },
      }),
      prisma.ventaKiosco.delete({
        where: { id: venta.id },
      }),
    ]);

    revalidatePath("/admin/kiosco");
    revalidatePath("/admin/economia");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al anular venta:", error);
    const message = error instanceof Error ? error.message : "Error al anular la venta";
    return { success: false, error: message };
  }
}
