"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ActionsMenu,
  EditIcon,
  TrashIcon,
} from "@/components/ui/ActionsMenu";
import { MESES_NOMBRES } from "@/app/admin/economia/types";
import { toggleKioscoSucursal } from "@/app/admin/sucursales/actions";
import {
  type KioscoDataResponse,
  type ProductoKioscoItem,
  getKioscoData,
  crearProductoKiosco,
  actualizarProductoKiosco,
  ajustarStockProducto,
  eliminarProductoKiosco,
  registrarVentaRapida,
  anularVentaKiosco,
} from "./actions";

const CATEGORIAS_KIOSCO = [
  "Bebidas",
  "Suplementos",
  "Snacks",
  "Indumentaria",
  "Accesorios",
  "Otros",
];

interface KioscoClientProps {
  initialData: KioscoDataResponse;
}

export function KioscoClient({ initialData }: KioscoClientProps) {
  const [data, setData] = useState<KioscoDataResponse>(initialData);
  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(
    initialData.sucursalSeleccionadaId
  );
  const [selectedMes, setSelectedMes] = useState<number>(initialData.resumen.mes);
  const [selectedAnio, setSelectedAnio] = useState<number>(initialData.resumen.anio);
  const [activeTab, setActiveTab] = useState<"mostrador" | "stock" | "historial">(
    "mostrador"
  );

  // Filtros en mostrador y stock
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("TODAS");

  // Configuración rápida de venta en mostrador
  const [metodoPagoMostrador, setMetodoPagoMostrador] = useState<string>("Efectivo");
  const [socioMostradorId, setSocioMostradorId] = useState<string>("");
  const [cantidadesMostrador, setCantidadesMostrador] = useState<Record<number, number>>(
    {}
  );

  // Modal de Crear / Editar Producto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductoKioscoItem | null>(
    null
  );
  const [formProd, setFormProd] = useState({
    sucursalId: initialData.sucursalSeleccionadaId || initialData.sucursales[0]?.id || 1,
    nombre: "",
    categoria: "Bebidas",
    precioCompra: 1000,
    precioVenta: 2000,
    stock: 10,
    stockMinimo: 5,
  });

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const formatMoney = (val: number) =>
    "$" + Number(val || 0).toLocaleString("es-AR");

  const sucursalActual = useMemo(
    () => data.sucursales.find((s) => s.id === selectedSucursalId) || null,
    [data.sucursales, selectedSucursalId]
  );

  const recargarDatos = (
    sucId: number | null = selectedSucursalId,
    mes: number = selectedMes,
    anio: number = selectedAnio
  ) => {
    startTransition(async () => {
      const updated = await getKioscoData({
        sucursalId: sucId,
        mes,
        anio,
      });
      setData(updated);
    });
  };

  const handleSelectSucursal = (sucId: number | null) => {
    setSelectedSucursalId(sucId);
    recargarDatos(sucId, selectedMes, selectedAnio);
  };

  const handleCambiarPeriodo = (nuevoMes: number, nuevoAnio: number) => {
    setSelectedMes(nuevoMes);
    setSelectedAnio(nuevoAnio);
    recargarDatos(selectedSucursalId, nuevoMes, nuevoAnio);
  };

  const handleToggleKioscoSucursal = (sucId: number) => {
    startTransition(async () => {
      const res = await toggleKioscoSucursal(sucId);
      if (res.success) {
        const updated = await getKioscoData({
          sucursalId: selectedSucursalId,
          mes: selectedMes,
          anio: selectedAnio,
        });
        setData(updated);
        showToast(
          "success",
          res.tieneKiosco
            ? "Kiosco habilitado en la sucursal."
            : "Kiosco deshabilitado en la sucursal."
        );
      } else {
        showToast("error", res.error || "No se pudo cambiar el estado del kiosco");
      }
    });
  };

  // Registrar venta rápida en 1 clic
  const handleVentaRapida = (prod: ProductoKioscoItem) => {
    const cantidad = cantidadesMostrador[prod.id] || 1;
    startTransition(async () => {
      const res = await registrarVentaRapida({
        productoId: prod.id,
        cantidad,
        metodoPago: metodoPagoMostrador,
        usuarioId: socioMostradorId ? Number(socioMostradorId) : null,
      });

      if (res.success) {
        setCantidadesMostrador((prev) => ({ ...prev, [prod.id]: 1 }));
        const updated = await getKioscoData({
          sucursalId: selectedSucursalId,
          mes: selectedMes,
          anio: selectedAnio,
        });
        setData(updated);
        showToast("success", res.mensaje || "Venta registrada con éxito");
      } else {
        showToast("error", res.error || "Error al registrar la venta");
      }
    });
  };

  // Ajuste rápido de stock (+1, -1, +6, etc.)
  const handleAjustarStock = (productoId: number, delta: number) => {
    startTransition(async () => {
      const res = await ajustarStockProducto({ productoId, delta });
      if (res.success) {
        const updated = await getKioscoData({
          sucursalId: selectedSucursalId,
          mes: selectedMes,
          anio: selectedAnio,
        });
        setData(updated);
      } else {
        showToast("error", res.error || "Error al ajustar stock");
      }
    });
  };

  // Abrir modal para nuevo producto o editar existente
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setFormProd({
      sucursalId:
        selectedSucursalId ||
        data.sucursales.find((s) => s.tieneKiosco)?.id ||
        data.sucursales[0]?.id ||
        1,
      nombre: "",
      categoria: "Bebidas",
      precioCompra: 1000,
      precioVenta: 2000,
      stock: 12,
      stockMinimo: 5,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: ProductoKioscoItem) => {
    setEditingProduct(prod);
    setFormProd({
      sucursalId: prod.sucursalId,
      nombre: prod.nombre,
      categoria: prod.categoria,
      precioCompra: prod.precioCompra,
      precioVenta: prod.precioVenta,
      stock: prod.stock,
      stockMinimo: prod.stockMinimo,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = editingProduct
        ? await actualizarProductoKiosco(editingProduct.id, {
            nombre: formProd.nombre,
            categoria: formProd.categoria,
            precioCompra: Number(formProd.precioCompra),
            precioVenta: Number(formProd.precioVenta),
            stock: Number(formProd.stock),
            stockMinimo: Number(formProd.stockMinimo),
          })
        : await crearProductoKiosco({
            sucursalId: Number(formProd.sucursalId),
            nombre: formProd.nombre,
            categoria: formProd.categoria,
            precioCompra: Number(formProd.precioCompra),
            precioVenta: Number(formProd.precioVenta),
            stock: Number(formProd.stock),
            stockMinimo: Number(formProd.stockMinimo),
          });

      if (res.success) {
        setIsProductModalOpen(false);
        const updated = await getKioscoData({
          sucursalId: selectedSucursalId,
          mes: selectedMes,
          anio: selectedAnio,
        });
        setData(updated);
        showToast(
          "success",
          editingProduct
            ? "Producto actualizado correctamente."
            : "Producto agregado al inventario."
        );
      } else {
        showToast("error", res.error || "Error al guardar producto");
      }
    });
  };

  const handleEliminarProducto = (prod: ProductoKioscoItem) => {
    if (!confirm(`¿Seguro que deseás quitar "${prod.nombre}" del catálogo?`)) return;
    startTransition(async () => {
      const res = await eliminarProductoKiosco(prod.id);
      if (res.success) {
        const updated = await getKioscoData({
          sucursalId: selectedSucursalId,
          mes: selectedMes,
          anio: selectedAnio,
        });
        setData(updated);
        showToast("success", "Producto eliminado del catálogo.");
      } else {
        showToast("error", res.error || "No se pudo eliminar el producto");
      }
    });
  };

  const handleAnularVenta = (ventaId: number, desc: string) => {
    if (!confirm(`¿Anular venta de "${desc}" y devolver las unidades al stock?`))
      return;
    startTransition(async () => {
      const res = await anularVentaKiosco(ventaId);
      if (res.success) {
        const updated = await getKioscoData({
          sucursalId: selectedSucursalId,
          mes: selectedMes,
          anio: selectedAnio,
        });
        setData(updated);
        showToast("success", "Venta anulada y stock restaurado.");
      } else {
        showToast("error", res.error || "No se pudo anular la venta");
      }
    });
  };

  const filteredProductos = useMemo(() => {
    return data.productos.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchText =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q);
      const matchCat =
        categoriaFilter === "TODAS" || p.categoria === categoriaFilter;
      return matchText && matchCat;
    });
  }, [data.productos, searchQuery, categoriaFilter]);

  const { resumen } = data;
  const margenCalculadoModal =
    Number(formProd.precioVenta || 0) - Number(formProd.precioCompra || 0);
  const porcentajeModal =
    Number(formProd.precioCompra) > 0
      ? Math.round((margenCalculadoModal / Number(formProd.precioCompra)) * 100)
      : 100;

  return (
    <div className="space-y-6">
      {/* Toast de Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border shadow-lg transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2.5 text-sm font-semibold">
            <span>{feedback.type === "success" ? "✓" : "⚠️"}</span>
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-75 hover:opacity-100 px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. SELECTOR DE SUCURSAL Y HABILITACIÓN DE KIOSCO POR SEDE */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Kiosco y Mostrador por Sede
            </span>
            <h2 className="text-base sm:text-lg font-bold text-content">
              {selectedSucursalId === null
                ? "🌐 Vista Global — Todas las Sucursales"
                : sucursalActual
                  ? `📍 Sucursal ${sucursalActual.barrio} (${sucursalActual.direccion})`
                  : "Sucursal"}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {sucursalActual && (
              <button
                type="button"
                onClick={() => handleToggleKioscoSucursal(sucursalActual.id)}
                disabled={isPending}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  sucursalActual.tieneKiosco
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                }`}
                title="Habilitar o deshabilitar el Kiosco para esta sucursal"
              >
                <span>{sucursalActual.tieneKiosco ? "🥤" : "🚫"}</span>
                <span>
                  {sucursalActual.tieneKiosco
                    ? "Kiosco Habilitado en esta Sede (Desactivar)"
                    : "Kiosco Deshabilitado en esta Sede (Habilitar)"}
                </span>
              </button>
            )}

            <Link
              href="/admin/economia"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-surface-hover text-content text-xs font-bold transition-colors"
            >
              <span>💰</span>
              <span>Ver en Economía General →</span>
            </Link>
          </div>
        </div>

        {/* Pestañas de Sucursales */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {data.sucursales.map((suc) => {
            const isSelected = selectedSucursalId === suc.id;
            return (
              <button
                key={suc.id}
                type="button"
                onClick={() => handleSelectSucursal(suc.id)}
                disabled={isPending}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground font-bold shadow-sm"
                    : "border-border bg-background text-content hover:bg-surface-hover"
                }`}
              >
                <span>📍</span>
                <span>{suc.barrio}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    isSelected
                      ? "bg-black/20 text-primary-foreground"
                      : suc.tieneKiosco
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-surface-hover text-content-muted"
                  }`}
                >
                  {suc.tieneKiosco ? "🥤 Kiosco" : "Sin Kiosco"}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => handleSelectSucursal(null)}
            disabled={isPending}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              selectedSucursalId === null
                ? "border-primary bg-primary text-primary-foreground font-bold shadow-sm"
                : "border-border bg-background text-content hover:bg-surface-hover"
            }`}
          >
            <span>🌐</span>
            <span>Consolidado Global (Todas las Sedes)</span>
          </button>
        </div>
      </div>

      {/* Si la sucursal seleccionada NO tiene kiosco habilitado */}
      {sucursalActual && !sucursalActual.tieneKiosco ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-4">
          <div className="text-4xl">🏪</div>
          <h3 className="text-xl font-bold text-content">
            La sucursal {sucursalActual.barrio} no tiene Kiosco habilitado
          </h3>
          <p className="text-sm text-content-muted max-w-lg mx-auto">
            Algunas sedes pueden no contar con venta de productos o bebidas en mostrador. Si deseás activar el Kiosco e inventario para <strong>{sucursalActual.barrio}</strong>, podés habilitarlo con un clic.
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={() => handleToggleKioscoSucursal(sucursalActual.id)}
            isLoading={isPending}
          >
            🥤 Habilitar Kiosco en {sucursalActual.barrio}
          </Button>
        </div>
      ) : (
        <>
          {/* 2. TARJETAS KPI DEL KIOSCO Y STOCK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ingresos por Ventas de Mostrador */}
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Ventas Kiosco ({MESES_NOMBRES[selectedMes - 1]})
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-bold">
                  🥤
                </span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-content">
                {formatMoney(resumen.totalIngresos)}
              </div>
              <div className="mt-1.5 text-xs text-content-muted">
                {resumen.unidadesVendidas} unidades en {resumen.cantidadOperaciones}{" "}
                {resumen.cantidadOperaciones === 1 ? "venta" : "ventas"}
              </div>
            </div>

            {/* Costo de Mercadería Vendida */}
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Costo de Mercadería
                </span>
                <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm font-bold">
                  📦
                </span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-content">
                {formatMoney(resumen.totalCosto)}
              </div>
              <div className="mt-1.5 text-xs text-content-muted">
                Costo de compra de los productos vendidos
              </div>
            </div>

            {/* Ganancia Neta Kiosco */}
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Ganancia Neta Kiosco
                </span>
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                  📈
                </span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-400">
                {formatMoney(resumen.gananciaNeta)}
              </div>
              <div className="mt-1.5 text-xs text-content-muted">
                Margen limpio (Precio Venta − Precio Compra)
              </div>
            </div>

            {/* Valor del Stock Actual */}
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Stock Valorizado (Venta)
                </span>
                <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm font-bold">
                  🏷️
                </span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-content">
                {formatMoney(resumen.valorInventarioVenta)}
              </div>
              <div className="mt-1.5 text-xs text-content-muted flex items-center justify-between">
                <span>Costo stock: {formatMoney(resumen.valorInventarioCosto)}</span>
                {resumen.productosStockBajo > 0 && (
                  <span className="text-amber-400 font-bold">
                    ⚠️ {resumen.productosStockBajo} bajo stock
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. BARRA DE NAVEGACIÓN INTERNA (MOSTRADOR / STOCK / HISTORIAL) + ACCIÓN NUEVO PRODUCTO */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("mostrador")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "mostrador"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-surface border border-border text-content hover:bg-surface-hover"
                }`}
              >
                ⚡ Venta Rápida en Mostrador
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("stock")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "stock"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-surface border border-border text-content hover:bg-surface-hover"
                }`}
              >
                <span>📦 Stock y Precios ({data.productos.length})</span>
                {resumen.productosStockBajo > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300">
                    {resumen.productosStockBajo}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("historial")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "historial"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-surface border border-border text-content hover:bg-surface-hover"
                }`}
              >
                🧾 Historial de Ventas ({data.ventas.length})
              </button>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleOpenCreateProduct}
            >
              + Nuevo Producto
            </Button>
          </div>

          {/* PESTAÑA 1: VENTA RÁPIDA EN MOSTRADOR */}
          {activeTab === "mostrador" && (
            <div className="space-y-5">
              {/* Barra de configuración de cobro en mostrador */}
              <div className="bg-surface border border-border rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-content-muted mb-1">
                    Buscar Producto
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Agua, Gatorade, Proteína, Barra..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-content-muted mb-1">
                    Categoría
                  </label>
                  <select
                    value={categoriaFilter}
                    onChange={(e) => setCategoriaFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="TODAS">Todas las categorías</option>
                    {CATEGORIAS_KIOSCO.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-content-muted mb-1">
                    Método de Pago en Mostrador
                  </label>
                  <select
                    value={metodoPagoMostrador}
                    onChange={(e) => setMetodoPagoMostrador(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Efectivo">💵 Efectivo</option>
                    <option value="Transferencia">🏦 Transferencia</option>
                    <option value="Mercado Pago">💳 Mercado Pago</option>
                    <option value="Tarjeta de Débito">💳 Tarjeta de Débito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-content-muted mb-1">
                    Socio Comprador (Opcional)
                  </label>
                  <select
                    value={socioMostradorId}
                    onChange={(e) => setSocioMostradorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Mostrador General (Sin identificar)</option>
                    {data.sociosDisponibles.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.apellido}, {u.nombre} ({u.dni})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grilla de Productos para Venta en 1 Clic */}
              {filteredProductos.length === 0 ? (
                <div className="rounded-2xl border border-border bg-surface p-10 text-center space-y-3">
                  <div className="text-3xl">🥤</div>
                  <p className="text-sm font-semibold text-content">
                    No hay productos cargados con esos filtros
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenCreateProduct}
                  >
                    + Agregar Primer Producto al Kiosco
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProductos.map((prod) => {
                    const cant = cantidadesMostrador[prod.id] || 1;
                    const sinStock = prod.stock <= 0;
                    const stockBajo = prod.stock > 0 && prod.stock <= prod.stockMinimo;

                    return (
                      <div
                        key={prod.id}
                        className={`rounded-2xl border p-4 bg-surface flex flex-col justify-between gap-4 transition-all ${
                          sinStock
                            ? "border-red-500/30 opacity-65"
                            : "border-border hover:border-primary/50 shadow-xs"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {prod.categoria}
                              </span>
                              {selectedSucursalId === null && (
                                <span className="ml-1.5 text-[10px] font-semibold text-content-muted">
                                  📍 {prod.sucursalBarrio}
                                </span>
                              )}
                              <h4 className="text-sm font-bold text-content mt-1.5">
                                {prod.nombre}
                              </h4>
                            </div>

                            <Badge
                              variant={
                                sinStock
                                  ? "danger"
                                  : stockBajo
                                    ? "warning"
                                    : "success"
                              }
                            >
                              {sinStock
                                ? "Sin Stock"
                                : `Stock: ${prod.stock} u.`}
                            </Badge>
                          </div>

                          <div className="pt-2 border-t border-border/60 flex items-baseline justify-between">
                            <div>
                              <span className="text-[11px] text-content-muted block">
                                Precio de Venta
                              </span>
                              <span className="text-xl font-black text-content">
                                {formatMoney(prod.precioVenta)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] text-content-muted block">
                                Costo: {formatMoney(prod.precioCompra)}
                              </span>
                              <span className="text-xs font-bold text-emerald-400">
                                +{formatMoney(prod.margenUnitario)} ({prod.porcentajeMargen}%)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          {/* Selector de cantidad */}
                          <div className="flex items-center rounded-xl border border-border bg-background">
                            <button
                              type="button"
                              disabled={sinStock || cant <= 1}
                              onClick={() =>
                                setCantidadesMostrador((prev) => ({
                                  ...prev,
                                  [prod.id]: Math.max(1, cant - 1),
                                }))
                              }
                              className="px-2.5 py-1.5 text-xs font-bold text-content hover:bg-surface-hover disabled:opacity-40 cursor-pointer"
                            >
                              −
                            </button>
                            <span className="px-2.5 text-xs font-bold text-content">
                              {cant}
                            </span>
                            <button
                              type="button"
                              disabled={sinStock || cant >= prod.stock}
                              onClick={() =>
                                setCantidadesMostrador((prev) => ({
                                  ...prev,
                                  [prod.id]: Math.min(prod.stock, cant + 1),
                                }))
                              }
                              className="px-2.5 py-1.5 text-xs font-bold text-content hover:bg-surface-hover disabled:opacity-40 cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          {/* Botón Venta Rápida */}
                          <button
                            type="button"
                            disabled={sinStock || isPending}
                            onClick={() => handleVentaRapida(prod)}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-surface-hover disabled:text-content-muted text-black font-extrabold text-xs transition-all cursor-pointer shadow-xs"
                          >
                            {sinStock
                              ? "Agotado"
                              : `Vender ${formatMoney(prod.precioVenta * cant)}`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA 2: CONTROL DE STOCK Y PRECIOS DE COMPRA / VENTA */}
          {activeTab === "stock" && (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-content">
                    Inventario de Productos, Costos de Compra y Precios de Venta
                  </h3>
                  <p className="text-xs text-content-muted mt-0.5">
                    Administrá el stock disponible y el margen de ganancia por producto en cada sucursal.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/50 text-content-muted text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">Producto</th>
                      <th className="py-3 px-4 font-semibold">Sucursal</th>
                      <th className="py-3 px-4 font-semibold">Precio y Margen</th>
                      <th className="py-3 px-4 font-semibold text-center">
                        Stock Actual
                      </th>
                      <th className="py-3 px-4 font-semibold text-right">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProductos.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-10 text-center text-content-muted"
                        >
                          No hay productos registrados en esta vista.
                        </td>
                      </tr>
                    ) : (
                      filteredProductos.map((p) => {
                        const sinStock = p.stock <= 0;
                        const stockBajo =
                          p.stock > 0 && p.stock <= p.stockMinimo;

                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-background/40 transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-content">
                                {p.nombre}
                              </div>
                              <div className="text-xs text-content-muted">
                                {p.categoria} • Mínimo: {p.stockMinimo} u.
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-xs font-semibold text-content whitespace-nowrap">
                              📍 {p.sucursalBarrio}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-mono font-bold text-content text-sm">
                                {formatMoney(p.precioVenta)}
                              </div>
                              <div className="text-[11px] text-content-muted flex items-center gap-1.5 mt-0.5">
                                <span>Costo: {formatMoney(p.precioCompra)}</span>
                                <span className="text-emerald-400 font-semibold">
                                  (+{formatMoney(p.margenUnitario)})
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center gap-2">
                                <Badge
                                  variant={
                                    sinStock
                                      ? "danger"
                                      : stockBajo
                                        ? "warning"
                                        : "success"
                                  }
                                >
                                  {p.stock} u.
                                </Badge>
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={isPending || p.stock <= 0}
                                    onClick={() => handleAjustarStock(p.id, -1)}
                                    className="w-6 h-6 flex items-center justify-center rounded-md border border-border bg-background hover:bg-surface-hover text-xs font-bold text-content disabled:opacity-40 cursor-pointer"
                                    title="Descontar 1 unidad"
                                  >
                                    −
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => handleAjustarStock(p.id, 1)}
                                    className="w-6 h-6 flex items-center justify-center rounded-md border border-border bg-background hover:bg-surface-hover text-xs font-bold text-content cursor-pointer"
                                    title="Sumar 1 unidad"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <ActionsMenu
                                buttonTitle={`Acciones para ${p.nombre}`}
                                items={[
                                  {
                                    label: "Editar Precios / Stock",
                                    icon: <EditIcon />,
                                    onClick: () => handleOpenEditProduct(p),
                                  },
                                  {
                                    label: "Eliminar Producto",
                                    icon: <TrashIcon />,
                                    onClick: () => handleEliminarProducto(p),
                                    variant: "danger",
                                  },
                                ]}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PESTAÑA 3: HISTORIAL DE VENTAS DEL MES */}
          {activeTab === "historial" && (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-content">
                    Registro de Ventas de Kiosco — {MESES_NOMBRES[selectedMes - 1]}{" "}
                    {selectedAnio}
                  </h3>
                  <p className="text-xs text-content-muted mt-0.5">
                    Todas las ventas rápidas registradas en mostrador impactan automáticamente en la Economía de la sucursal y en la Vista Global.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedMes}
                    onChange={(e) =>
                      handleCambiarPeriodo(Number(e.target.value), selectedAnio)
                    }
                    className="px-3 py-1.5 rounded-xl border border-border bg-background text-content text-xs font-semibold"
                  >
                    {MESES_NOMBRES.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedAnio}
                    onChange={(e) =>
                      handleCambiarPeriodo(selectedMes, Number(e.target.value))
                    }
                    className="px-3 py-1.5 rounded-xl border border-border bg-background text-content text-xs font-semibold"
                  >
                    {[2025, 2026, 2027].map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/50 text-content-muted text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">Fecha</th>
                      <th className="py-3 px-4 font-semibold">Sucursal</th>
                      <th className="py-3 px-4 font-semibold">Detalle de Venta</th>
                      <th className="py-3 px-4 font-semibold">Total y Cobro</th>
                      <th className="py-3 px-4 font-semibold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.ventas.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-10 text-center text-content-muted"
                        >
                          No hay ventas de mostrador registradas en este período.
                        </td>
                      </tr>
                    ) : (
                      data.ventas.map((v) => (
                        <tr
                          key={v.id}
                          className="hover:bg-background/40 transition-colors"
                        >
                          <td className="py-3 px-4 text-xs text-content-muted whitespace-nowrap">
                            {new Date(v.fechaVenta).toLocaleString("es-AR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold text-content whitespace-nowrap">
                            📍 {v.sucursalBarrio}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-content text-xs">
                              {v.cantidad}x {v.productoNombre}
                            </div>
                            {v.usuarioNombre && (
                              <div className="text-[11px] text-content-muted">
                                Socio: {v.usuarioNombre}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-content text-sm">
                                {formatMoney(v.totalVenta)}
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-hover border border-border text-content-muted">
                                {v.metodoPago}
                              </span>
                            </div>
                            <div className="text-[11px] font-semibold text-emerald-400 mt-0.5">
                              +{formatMoney(v.gananciaNeta)} ganancia
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <ActionsMenu
                              buttonTitle="Acciones de venta"
                              items={[
                                {
                                  label: "Anular Venta y Restaurar Stock",
                                  icon: <TrashIcon />,
                                  onClick: () =>
                                    handleAnularVenta(
                                      v.id,
                                      `${v.cantidad}x ${v.productoNombre}`
                                    ),
                                  variant: "danger",
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL CREAR / EDITAR PRODUCTO DE KIOSCO */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={
          editingProduct
            ? `Editar Producto: ${editingProduct.nombre}`
            : "Nuevo Producto de Kiosco / Mostrador"
        }
        description="Configurá el precio de compra (costo), precio de venta al público y stock disponible en la sucursal."
        maxWidth="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsProductModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveProduct}
              isLoading={isPending}
            >
              {editingProduct ? "Guardar Cambios" : "Crear Producto"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {!editingProduct && (
            <Select
              label="Sucursal"
              value={formProd.sucursalId}
              onChange={(e) =>
                setFormProd((prev) => ({
                  ...prev,
                  sucursalId: Number(e.target.value),
                }))
              }
            >
              {data.sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  📍 {s.barrio} — {s.direccion}
                </option>
              ))}
            </Select>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre del Producto"
              value={formProd.nombre}
              onChange={(e) =>
                setFormProd((prev) => ({ ...prev, nombre: e.target.value }))
              }
              placeholder="Ej: Gatorade 500ml"
              required
            />

            <Select
              label="Categoría"
              value={formProd.categoria}
              onChange={(e) =>
                setFormProd((prev) => ({ ...prev, categoria: e.target.value }))
              }
            >
              {CATEGORIAS_KIOSCO.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Precio de Compra / Costo ($)"
              type="number"
              min="0"
              step="10"
              value={formProd.precioCompra}
              onChange={(e) =>
                setFormProd((prev) => ({
                  ...prev,
                  precioCompra: Number(e.target.value),
                }))
              }
              required
            />

            <Input
              label="Precio de Venta Mostrador ($)"
              type="number"
              min="0"
              step="10"
              value={formProd.precioVenta}
              onChange={(e) =>
                setFormProd((prev) => ({
                  ...prev,
                  precioVenta: Number(e.target.value),
                }))
              }
              required
            />
          </div>

          {/* Vista previa del margen de ganancia */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-content">
              Margen de Ganancia por Unidad:
            </span>
            <span className="font-black text-emerald-400">
              {formatMoney(margenCalculadoModal)} ({porcentajeModal}%)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Stock Disponible (Unidades)"
              type="number"
              min="0"
              value={formProd.stock}
              onChange={(e) =>
                setFormProd((prev) => ({
                  ...prev,
                  stock: Number(e.target.value),
                }))
              }
              required
            />

            <Input
              label="Alerta de Stock Mínimo"
              type="number"
              min="0"
              value={formProd.stockMinimo}
              onChange={(e) =>
                setFormProd((prev) => ({
                  ...prev,
                  stockMinimo: Number(e.target.value),
                }))
              }
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
