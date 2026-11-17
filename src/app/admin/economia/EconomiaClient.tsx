"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  ActionsMenu,
  EditIcon,
  WhatsAppIcon,
} from "@/components/ui/ActionsMenu";
import {
  togglePagoMes,
  registrarPagoDetallado,
  getEconomiaData,
  crearLinkCobroOnline,
  crearGastoOperativo,
  actualizarGastoOperativo,
  eliminarGastoOperativo,
  clonarGastosRecurrentesMesAnterior,
} from "./actions";
import {
  MESES_NOMBRES,
  CATEGORIAS_GASTO,
  type EconomiaDataResponse,
  type UsuarioEconomiaItem,
  type GastoOperativoItem,
} from "./types";
import { exportarBalanceExcel, exportarBalancePDF } from "./exportUtils";

interface EconomiaClientProps {
  initialData: EconomiaDataResponse;
}

export function EconomiaClient({ initialData }: EconomiaClientProps) {
  const [data, setData] = useState<EconomiaDataResponse>(initialData);
  const [selectedMes, setSelectedMes] = useState<number>(initialData.metricas.mes);
  const [selectedAnio, setSelectedAnio] = useState<number>(initialData.metricas.anio);
  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(
    initialData.sucursalSeleccionadaId ?? null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "todos" | "pagados" | "pendientes" | "vencidos_10" | "vencidos_15"
  >("todos");
  const [planFilter, setPlanFilter] = useState<string>("todos");
  const [isPending, startTransition] = useTransition();

  // Modal para registro detallado de pago
  const [modalPagoUsuario, setModalPagoUsuario] = useState<UsuarioEconomiaItem | null>(null);
  const [formMonto, setFormMonto] = useState<number>(0);
  const [formMetodo, setFormMetodo] = useState<string>("Efectivo");
  const [formComprobante, setFormComprobante] = useState<string>("");
  const [formNotas, setFormNotas] = useState<string>("");
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal para Mercado Pago / Cobro Online
  const [modalMpUsuario, setModalMpUsuario] = useState<UsuarioEconomiaItem | null>(null);
  const [tipoCobroOnline, setTipoCobroOnline] = useState<"cuota_mes" | "suscripcion_mensual">("cuota_mes");
  const [linkGenerado, setLinkGenerado] = useState<{
    initPoint: string;
    tipo: "cuota_mes" | "suscripcion_mensual";
    externalReference: string;
    isSimulated: boolean;
  } | null>(null);
  const [isGenerandoLink, setIsGenerandoLink] = useState(false);
  const [copiadoLink, setCopiadoLink] = useState(false);

  // Modal y Configuración para Recordatorios de WhatsApp (Sugerencia 1)
  const [modalWaUsuario, setModalWaUsuario] = useState<UsuarioEconomiaItem | null>(null);
  const [datosBancarios, setDatosBancarios] = useState({
    alias: "MERAKI.GYM",
    cbu: "0000003100012345678901",
    titular: "Gym Meraki S.R.L.",
    banco: "Mercado Pago / Banco Galicia",
    diaVencimiento: "10",
  });
  const [mostrarConfigBanco, setMostrarConfigBanco] = useState(false);
  const [copiadoWaText, setCopiadoWaText] = useState(false);

  // Estados para Gestión de Gastos Operativos y Margen Neto (Sugerencia 2)
  const [modalGastoOpen, setModalGastoOpen] = useState(false);
  const [editandoGasto, setEditandoGasto] = useState<GastoOperativoItem | null>(null);
  const [gastoSucursalId, setGastoSucursalId] = useState<number>(
    initialData.sucursalSeleccionadaId ?? initialData.sucursalesResumen[0]?.id ?? 1
  );
  const [gastoConcepto, setGastoConcepto] = useState("");
  const [gastoCategoria, setGastoCategoria] = useState<string>("Alquiler");
  const [gastoMonto, setGastoMonto] = useState<string>("");
  const [gastoMetodoPago, setGastoMetodoPago] = useState<string>("Transferencia");
  const [gastoComprobante, setGastoComprobante] = useState<string>("");
  const [gastoNotas, setGastoNotas] = useState<string>("");
  const [gastoRecurrente, setGastoRecurrente] = useState<boolean>(true);
  const [isSubmittingGasto, setIsSubmittingGasto] = useState(false);
  const [filtroCategoriaGasto, setFiltroCategoriaGasto] = useState<string>("todas");
  const [searchGastoQuery, setSearchGastoQuery] = useState<string>("");

  const handleOpenModalNuevoGasto = (categoriaInicial = "Alquiler") => {
    setEditandoGasto(null);
    setGastoSucursalId(
      selectedSucursalId ?? data.sucursalesResumen[0]?.id ?? 1
    );
    setGastoConcepto("");
    setGastoCategoria(categoriaInicial);
    setGastoMonto("");
    setGastoMetodoPago("Transferencia");
    setGastoComprobante("");
    setGastoNotas("");
    setGastoRecurrente(
      categoriaInicial === "Alquiler" ||
      categoriaInicial === "Profesores" ||
      categoriaInicial === "Luz y Servicios"
    );
    setModalGastoOpen(true);
  };

  const handleOpenModalEditarGasto = (gasto: GastoOperativoItem) => {
    setEditandoGasto(gasto);
    setGastoSucursalId(gasto.sucursalId);
    setGastoConcepto(gasto.concepto);
    setGastoCategoria(gasto.categoria);
    setGastoMonto(String(gasto.monto));
    setGastoMetodoPago(gasto.metodoPago);
    setGastoComprobante(gasto.comprobante || "");
    setGastoNotas(gasto.notas || "");
    setGastoRecurrente(gasto.esRecurrente);
    setModalGastoOpen(true);
  };

  const handleGuardarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingGasto(true);
    try {
      const res = editandoGasto
        ? await actualizarGastoOperativo({
          id: editandoGasto.id,
          sucursalId: Number(gastoSucursalId),
          concepto: gastoConcepto,
          categoria: gastoCategoria,
          monto: Number(gastoMonto),
          metodoPago: gastoMetodoPago,
          comprobante: gastoComprobante,
          notas: gastoNotas,
          esRecurrente: gastoRecurrente,
        })
        : await crearGastoOperativo({
          sucursalId: Number(gastoSucursalId),
          concepto: gastoConcepto,
          categoria: gastoCategoria,
          monto: Number(gastoMonto),
          metodoPago: gastoMetodoPago,
          comprobante: gastoComprobante,
          notas: gastoNotas,
          esRecurrente: gastoRecurrente,
          mes: selectedMes,
          anio: selectedAnio,
        });

      if (res.success) {
        const updated = await getEconomiaData({
          mes: selectedMes,
          anio: selectedAnio,
          sucursalId: selectedSucursalId,
        });
        setData(updated);
        setModalGastoOpen(false);
        setFeedbackMsg({
          type: "success",
          text: editandoGasto
            ? "Gasto operativo actualizado correctamente."
            : "Gasto operativo registrado y descontado del margen neto.",
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
      } else {
        setFeedbackMsg({
          type: "error",
          text: res.error || "Error al guardar el gasto operativo.",
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } finally {
      setIsSubmittingGasto(false);
    }
  };

  const handleEliminarGasto = (gasto: GastoOperativoItem) => {
    startTransition(async () => {
      const res = await eliminarGastoOperativo(gasto.id);
      if (res.success) {
        const updated = await getEconomiaData({
          mes: selectedMes,
          anio: selectedAnio,
          sucursalId: selectedSucursalId,
        });
        setData(updated);
        setFeedbackMsg({
          type: "success",
          text: `Gasto "${gasto.concepto}" eliminado.`,
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
      } else {
        setFeedbackMsg({
          type: "error",
          text: res.error || "No se pudo eliminar el gasto.",
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    });
  };

  const handleClonarGastosMesAnterior = () => {
    startTransition(async () => {
      const res = await clonarGastosRecurrentesMesAnterior({
        mes: selectedMes,
        anio: selectedAnio,
        sucursalId: selectedSucursalId,
      });
      if (res.success) {
        const updated = await getEconomiaData({
          mes: selectedMes,
          anio: selectedAnio,
          sucursalId: selectedSucursalId,
        });
        setData(updated);
        setFeedbackMsg({
          type: "success",
          text: `Se copiaron ${res.cantidadCopiados} gastos fijos del mes anterior.`,
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
      } else {
        setFeedbackMsg({
          type: "error",
          text: res.error || "No se pudieron copiar los gastos fijos.",
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    });
  };

  const gastosFiltrados = useMemo(() => {
    const lista = data.gastosOperativos || [];
    return lista.filter((g) => {
      const matchCat =
        filtroCategoriaGasto === "todas" || g.categoria === filtroCategoriaGasto;
      const q = searchGastoQuery.toLowerCase().trim();
      const matchText =
        !q ||
        g.concepto.toLowerCase().includes(q) ||
        g.categoria.toLowerCase().includes(q) ||
        g.sucursal.barrio.toLowerCase().includes(q) ||
        (g.notas && g.notas.toLowerCase().includes(q));
      return matchCat && matchText;
    });
  }, [data.gastosOperativos, filtroCategoriaGasto, searchGastoQuery]);

  // Cambio de Mes / Año
  const handleCambiarPeriodo = (nuevoMes: number, nuevoAnio: number) => {
    setSelectedMes(nuevoMes);
    setSelectedAnio(nuevoAnio);
    startTransition(async () => {
      try {
        const newData = await getEconomiaData({
          mes: nuevoMes,
          anio: nuevoAnio,
          sucursalId: selectedSucursalId,
        });
        setData(newData);
      } catch (err) {
        console.error("Error al cargar período:", err);
      }
    });
  };

  // Cambio de Vista: Global (null) o por Sucursal (id)
  const handleCambiarSucursal = (nuevaSucursalId: number | null) => {
    setSelectedSucursalId(nuevaSucursalId);
    startTransition(async () => {
      try {
        const newData = await getEconomiaData({
          mes: selectedMes,
          anio: selectedAnio,
          sucursalId: nuevaSucursalId,
        });
        setData(newData);
      } catch (err) {
        console.error("Error al cambiar vista de sucursal:", err);
      }
    });
  };

  // Toggle rápido de pago (1 click)
  const handleTogglePago = (usuario: UsuarioEconomiaItem) => {
    startTransition(async () => {
      const res = await togglePagoMes({
        usuarioId: usuario.id,
        mes: selectedMes,
        anio: selectedAnio,
      });

      if (res.success) {
        // Refrescar datos
        const updated = await getEconomiaData({
          mes: selectedMes,
          anio: selectedAnio,
          sucursalId: selectedSucursalId,
        });
        setData(updated);
        setFeedbackMsg({
          type: "success",
          text: res.pagado
            ? `Cobro de ${usuario.nombre} ${usuario.apellido} registrado correctamente.`
            : `Cobro de ${usuario.nombre} ${usuario.apellido} anulado.`,
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
      } else {
        setFeedbackMsg({
          type: "error",
          text: res.error || "Ocurrió un error al actualizar el cobro",
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    });
  };

  // Abrir modal de cobro personalizado
  const handleOpenModal = (usuario: UsuarioEconomiaItem) => {
    setModalPagoUsuario(usuario);
    const montoInicial = usuario.pagoMesActual
      ? usuario.pagoMesActual.monto
      : usuario.plan?.precio || 28000;
    setFormMonto(montoInicial);
    setFormMetodo(usuario.pagoMesActual?.metodoPago || "Efectivo");
    setFormComprobante(usuario.pagoMesActual?.comprobante || "");
    setFormNotas(usuario.pagoMesActual?.notas || "");
  };

  // Guardar cobro detallado
  const handleGuardarPagoModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPagoUsuario) return;

    setIsSubmittingModal(true);
    try {
      const res = await registrarPagoDetallado({
        usuarioId: modalPagoUsuario.id,
        mes: selectedMes,
        anio: selectedAnio,
        monto: Number(formMonto),
        metodoPago: formMetodo,
        comprobante: formComprobante,
        notas: formNotas,
      });

      if (res.success) {
        const updated = await getEconomiaData({
          mes: selectedMes,
          anio: selectedAnio,
          sucursalId: selectedSucursalId,
        });
        setData(updated);
        setModalPagoUsuario(null);
        setFeedbackMsg({
          type: "success",
          text: `Pago registrado con éxito para ${modalPagoUsuario.nombre} ${modalPagoUsuario.apellido}.`,
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
      } else {
        alert(res.error || "Error al registrar pago");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      alert("Error: " + message);
    } finally {
      setIsSubmittingModal(false);
    }
  };

  // Abrir modal de Mercado Pago para un socio
  const handleOpenMpModal = async (usuario: UsuarioEconomiaItem, tipo: "cuota_mes" | "suscripcion_mensual" = "cuota_mes") => {
    setModalMpUsuario(usuario);
    setTipoCobroOnline(tipo);
    setLinkGenerado(null);
    setCopiadoLink(false);
    setIsGenerandoLink(true);

    try {
      const res = await crearLinkCobroOnline({
        usuarioId: usuario.id,
        mes: selectedMes,
        anio: selectedAnio,
        tipoCobro: tipo,
      });

      if (res.success && res.link) {
        setLinkGenerado(res.link);
      } else {
        alert(res.error || "No se pudo generar el link de pago");
        setModalMpUsuario(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      alert("Error: " + message);
      setModalMpUsuario(null);
    } finally {
      setIsGenerandoLink(false);
    }
  };

  // Cambiar tipo de cobro online dentro del modal (Cuota única vs Débito recurrente)
  const handleChangeTipoCobroOnline = async (tipo: "cuota_mes" | "suscripcion_mensual") => {
    if (!modalMpUsuario) return;
    setTipoCobroOnline(tipo);
    setIsGenerandoLink(true);
    setCopiadoLink(false);

    try {
      const res = await crearLinkCobroOnline({
        usuarioId: modalMpUsuario.id,
        mes: selectedMes,
        anio: selectedAnio,
        tipoCobro: tipo,
      });

      if (res.success && res.link) {
        setLinkGenerado(res.link);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      alert("Error: " + message);
    } finally {
      setIsGenerandoLink(false);
    }
  };

  // Copiar link al portapapeles
  const handleCopiarLink = () => {
    if (!linkGenerado) return;
    navigator.clipboard.writeText(linkGenerado.initPoint);
    setCopiadoLink(true);
    setTimeout(() => setCopiadoLink(false), 3000);
  };

  // Generador de Mensaje Pre-redactado de Recordatorio de Cuota para WhatsApp
  const generarMensajeWhatsAppRecordatorio = (usuario: UsuarioEconomiaItem) => {
    const saldoPendiente = usuario.plan ? usuario.plan.precio : 28000;
    const planNombre = usuario.plan ? usuario.plan.nombre : "Plan General";
    const nombreSocio = usuario.nombre?.trim() || "socio/a";
    const mesNombre = metricas.nombreMes;
    const anioActual = metricas.anio;

    return (
      `Hola *${nombreSocio}*! Te escribimos desde *Gym Meraki* 🏋️‍♂️\n\n` +
      `Te dejamos el recordatorio de la cuota mensual correspondiente a *${mesNombre} ${anioActual}*:\n\n` +
      `📋 *Plan:* ${planNombre}\n` +
      `💰 *Monto a abonar:* ${formatMoney(saldoPendiente)}\n` +
      `🗓️ *Vencimiento habitual:* día ${datosBancarios.diaVencimiento} de cada mes\n\n` +
      `Podés abonar por transferencia a nuestra cuenta bancaria:\n` +
      `🏦 *Banco/Billetera:* ${datosBancarios.banco}\n` +
      `📌 *Alias:* ${datosBancarios.alias}\n` +
      `🔢 *CBU:* ${datosBancarios.cbu}\n` +
      `👤 *Titular:* ${datosBancarios.titular}\n\n` +
      `Una vez realizada la transferencia, por favor envianos el comprobante por este medio para registrar tu pago en el sistema.\n\n` +
      `¡Muchas gracias y buen entrenamiento! 💪`
    );
  };

  // Abrir WhatsApp Web / App en 1 clic
  const handleEnviarWhatsAppDirecto = (usuario: UsuarioEconomiaItem) => {
    const mensaje = generarMensajeWhatsAppRecordatorio(usuario);
    const telLimpio = (usuario.telefono || "").replace(/\D/g, "");
    const encoded = encodeURIComponent(mensaje);
    const waUrl = telLimpio
      ? `https://wa.me/${telLimpio}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  // Copiar texto del mensaje pre-redactado
  const handleCopiarMensajeWa = (usuario: UsuarioEconomiaItem) => {
    const mensaje = generarMensajeWhatsAppRecordatorio(usuario);
    navigator.clipboard.writeText(mensaje);
    setCopiadoWaText(true);
    setTimeout(() => setCopiadoWaText(false), 3000);
  };

  // Semáforo de Vencimiento para cada socio
  // Calcula si la cuota está vencida hace >10 o >15 días respecto a la fecha actual
  const calcularSemaforoVencimiento = (usuario: UsuarioEconomiaItem) => {
    if (usuario.haPagado) {
      return { nivel: "al_dia" as const, diasVencido: 0, label: "Al día", badgeClase: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
    }

    const diaVenc = Math.min(31, Math.max(1, parseInt(datosBancarios.diaVencimiento) || 10));
    // Fecha de corte de vencimiento en el mes seleccionado
    const fechaVencimientoMes = new Date(selectedAnio, selectedMes - 1, diaVenc, 23, 59, 59);
    const ahora = new Date();

    const diffTiempo = ahora.getTime() - fechaVencimientoMes.getTime();
    const diffDias = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));

    if (diffDias > 15) {
      return {
        nivel: "critico" as const,
        diasVencido: diffDias,
        label: `Vencido (+${diffDias}d)`,
        badgeClase: "bg-red-500/15 text-red-400 border-red-500/40 ring-1 ring-red-500/30",
        icono: "🔴",
      };
    } else if (diffDias > 10) {
      return {
        nivel: "alerta" as const,
        diasVencido: diffDias,
        label: `Vencido (+${diffDias}d)`,
        badgeClase: "bg-orange-500/15 text-orange-400 border-orange-500/40 ring-1 ring-orange-500/30",
        icono: "🟠",
      };
    } else if (diffDias > 0) {
      return {
        nivel: "vencido_reciente" as const,
        diasVencido: diffDias,
        label: `Vence hoy/hace ${diffDias}d`,
        badgeClase: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        icono: "🟡",
      };
    } else {
      return {
        nivel: "a_vencer" as const,
        diasVencido: 0,
        label: `Vence el ${diaVenc}/${selectedMes}`,
        badgeClase: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        icono: "⏳",
      };
    }
  };

  // Contadores del semáforo para badges y métricas
  const conteoSemaforo = useMemo(() => {
    let criticos15 = 0;
    let alertas10 = 0;
    let recientes = 0;

    data.usuarios.forEach((u) => {
      if (!u.haPagado) {
        const sem = calcularSemaforoVencimiento(u);
        if (sem.diasVencido > 15) criticos15++;
        else if (sem.diasVencido > 10) alertas10++;
        else if (sem.diasVencido > 0) recientes++;
      }
    });

    return { criticos15, alertas10, recientes, totalVencidos: criticos15 + alertas10 + recientes };
  }, [data.usuarios, selectedMes, selectedAnio, datosBancarios.diaVencimiento]);

  // Filtro de usuarios
  const filteredUsuarios = useMemo(() => {
    return data.usuarios.filter((u) => {
      // Filtro texto
      const q = searchQuery.toLowerCase().trim();
      const matchText =
        !q ||
        u.nombre.toLowerCase().includes(q) ||
        u.apellido.toLowerCase().includes(q) ||
        (u.dni && u.dni.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q));

      // Filtro estado & semáforo
      let matchStatus = true;
      if (statusFilter === "pagados") matchStatus = u.haPagado;
      if (statusFilter === "pendientes") matchStatus = !u.haPagado;
      if (statusFilter === "vencidos_10") {
        if (u.haPagado) matchStatus = false;
        else {
          const sem = calcularSemaforoVencimiento(u);
          matchStatus = sem.diasVencido > 10 && sem.diasVencido <= 15;
        }
      }
      if (statusFilter === "vencidos_15") {
        if (u.haPagado) matchStatus = false;
        else {
          const sem = calcularSemaforoVencimiento(u);
          matchStatus = sem.diasVencido > 15;
        }
      }

      // Filtro plan
      let matchPlan = true;
      if (planFilter !== "todos") {
        if (planFilter === "sin_plan") {
          matchPlan = !u.plan;
        } else {
          matchPlan = u.plan?.id === Number(planFilter);
        }
      }

      return matchText && matchStatus && matchPlan;
    });
  }, [data.usuarios, searchQuery, statusFilter, planFilter, selectedMes, selectedAnio, datosBancarios.diaVencimiento]);

  // Formato de moneda
  const formatMoney = (val: number) => {
    return "$" + Number(val || 0).toLocaleString("es-AR");
  };

  // Métricas y evolución
  const { metricas, evolucionHistorica, proyeccionFutura } = data;

  // Combinación para gráfico de evolución (histórico + proyección)
  const evolucionCombinada = useMemo(() => {
    return [...evolucionHistorica, ...proyeccionFutura];
  }, [evolucionHistorica, proyeccionFutura]);

  const maxRecaudacion = useMemo(() => {
    const max = Math.max(...evolucionCombinada.map((item) => item.recaudacion), 1);
    return Math.ceil(max / 50000) * 50000;
  }, [evolucionCombinada]);

  const maxUsuarios = useMemo(() => {
    const max = Math.max(...evolucionCombinada.map((item) => item.cantidadUsuarios), 1);
    return Math.max(15, Math.ceil(max * 1.25));
  }, [evolucionCombinada]);

  return (
    <div className="space-y-8">
      {/* Toast de Feedback */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${feedbackMsg.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {feedbackMsg.type === "success" ? "✓" : "⚠️"}
            </span>
            <span className="text-sm font-medium">{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs opacity-70 hover:opacity-100 px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* SELECTOR DE VISTA ECONÓMICA: GLOBAL (SUMATORIA DE TODAS LAS SUCURSALES) vs. POR SUCURSAL */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Alcance Financiero
            </span>
            <h2 className="text-base sm:text-lg font-bold text-content">
              {selectedSucursalId === null
                ? "🌐 Vista Global — Sumatoria de todas las sucursales"
                : (() => {
                  const suc = data.sucursalesResumen.find(
                    (s) => s.id === selectedSucursalId
                  );
                  return suc
                    ? `📍 Vista por Sucursal: ${suc.barrio} (${suc.direccion})`
                    : "📍 Vista por Sucursal";
                })()}
            </h2>
          </div>

          {selectedSucursalId !== null && (
            <button
              type="button"
              onClick={() => handleCambiarSucursal(null)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>🌐</span>
              <span>Volver a Vista Global (Sumatoria Total)</span>
            </button>
          )}
        </div>

        {/* Pestañas de selección de vista */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleCambiarSucursal(null)}
            disabled={isPending}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${selectedSucursalId === null
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-border bg-background text-content hover:bg-surface-hover"
              }`}
          >
            <span>🌐</span>
            <span>Vista Global (Todas las Sucursales)</span>
          </button>

          {data.sucursalesResumen.map((suc) => {
            const isSelected = selectedSucursalId === suc.id;
            return (
              <button
                key={suc.id}
                type="button"
                onClick={() => handleCambiarSucursal(suc.id)}
                disabled={isPending}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${isSelected
                  ? "border-primary bg-primary text-primary-foreground font-bold shadow-sm"
                  : "border-border bg-background text-content hover:bg-surface-hover"
                  }`}
              >
                <span>📍</span>
                <span>{suc.barrio}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-md font-bold ${isSelected
                    ? "bg-black/20 text-primary-foreground"
                    : "bg-emerald-500/10 text-emerald-400"
                    }`}
                >
                  {formatMoney(suc.recaudacionTotalConKiosco)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de Período (Mes y Año) */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
            🗓️
          </div>
          <div>
            <span className="text-xs font-semibold text-content-muted uppercase tracking-wider">
              Período de Facturación
            </span>
            <h2 className="text-lg font-bold text-content">
              {metricas.nombreMes} {metricas.anio}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Navegación rápida mes anterior / siguiente */}
          <button
            onClick={() => {
              const nuevoMes = selectedMes === 1 ? 12 : selectedMes - 1;
              const nuevoAnio = selectedMes === 1 ? selectedAnio - 1 : selectedAnio;
              handleCambiarPeriodo(nuevoMes, nuevoAnio);
            }}
            disabled={isPending}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-border bg-background hover:bg-surface text-content text-sm transition-colors disabled:opacity-50"
            title="Mes anterior"
          >
            ← Ant
          </button>

          <select
            value={selectedMes}
            onChange={(e) => handleCambiarPeriodo(Number(e.target.value), selectedAnio)}
            disabled={isPending}
            className="px-3 py-2 rounded-xl border border-border bg-background text-content text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {MESES_NOMBRES.map((nombre, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {nombre}
              </option>
            ))}
          </select>

          <select
            value={selectedAnio}
            onChange={(e) => handleCambiarPeriodo(selectedMes, Number(e.target.value))}
            disabled={isPending}
            className="px-3 py-2 rounded-xl border border-border bg-background text-content text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {[2025, 2026, 2027].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              const nuevoMes = selectedMes === 12 ? 1 : selectedMes + 1;
              const nuevoAnio = selectedMes === 12 ? selectedAnio + 1 : selectedAnio;
              handleCambiarPeriodo(nuevoMes, nuevoAnio);
            }}
            disabled={isPending}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-border bg-background hover:bg-surface text-content text-sm transition-colors disabled:opacity-50"
            title="Mes siguiente"
          >
            Sig →
          </button>

          {/* Botones de Exportación Contable */}
          <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

          <button
            onClick={() => exportarBalanceExcel(data)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs transition-colors shadow-sm"
            title="Descargar reporte en formato Excel / CSV compatible con Excel y Google Sheets"
          >
            <span className="text-sm">📊</span>
            <span>Excel</span>
          </button>

          <button
            onClick={() => exportarBalancePDF(data)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs transition-colors shadow-sm"
            title="Generar e imprimir balance contable en PDF"
          >
            <span className="text-sm">📑</span>
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* DESGLOSE POR SUCURSAL Y SUMATORIA GLOBAL (Visible en Vista Global) */}
      {selectedSucursalId === null && data.sucursalesResumen.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Comparativa de Sedes ({metricas.nombreMes} {metricas.anio})
              </span>
              <h3 className="text-base sm:text-lg font-bold text-content">
                Balance por Sucursal y Sumatoria Global
              </h3>
            </div>
            <span className="text-xs text-content-muted">
              Hacé clic en cualquier sucursal para filtrar todo el tablero por esa sede
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.sucursalesResumen.map((suc) => (
              <div
                key={suc.id}
                onClick={() => handleCambiarSucursal(suc.id)}
                className="group rounded-xl border border-border bg-background p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-primary">
                        <span>📍</span>
                        <span>{suc.barrio}</span>
                      </span>
                      <p className="text-xs text-content-muted mt-0.5">
                        {suc.direccion}
                      </p>
                    </div>
                    <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
                      {suc.porcentajeCobrado}% cobrado
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-content-muted block text-[11px]">
                        Cuotas Cobradas
                      </span>
                      <span className="text-base font-black text-emerald-400">
                        {formatMoney(suc.recaudacionHastaAhora)}
                      </span>
                    </div>
                    <div>
                      <span className="text-content-muted block text-[11px]">
                        Potencial Cuotas
                      </span>
                      <span className="text-base font-bold text-content">
                        {formatMoney(suc.recaudacionTotalPotencial)}
                      </span>
                    </div>
                    <div>
                      <span className="text-content-muted block text-[11px]">
                        Pendiente
                      </span>
                      <span className="font-bold text-amber-400">
                        {formatMoney(suc.pendienteCobro)}
                      </span>
                    </div>
                    <div>
                      <span className="text-content-muted block text-[11px]">
                        Socios al Día
                      </span>
                      <span className="font-bold text-content">
                        {suc.miembrosPagados} / {suc.totalMiembrosConPlan}
                      </span>
                    </div>
                  </div>

                  {/* Resumen de Kiosco de la sucursal */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                    {suc.tieneKiosco ? (
                      <>
                        <div>
                          <span className="text-content-muted block text-[11px]">
                            🥤 Ventas Kiosco ({suc.cantidadVentasKiosco})
                          </span>
                          <span className="font-bold text-cyan-400">
                            {formatMoney(suc.ingresosKiosco)}{" "}
                            <span className="text-[11px] font-semibold text-emerald-400">
                              (Ganancia: {formatMoney(suc.gananciaNetaKiosco)})
                            </span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-content-muted block text-[10px]">
                            Total Caja
                          </span>
                          <span className="font-black text-content">
                            {formatMoney(suc.recaudacionTotalConKiosco)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="text-[11px] text-content-muted italic">
                        🚫 Sucursal sin Kiosco habilitado
                      </span>
                    )}
                  </div>

                  {/* Resumen de Gastos Operativos y Beneficio Neto Real de la sucursal */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-content-muted block text-[11px]">
                        📉 Gastos Operativos ({suc.cantidadGastosOperativos})
                      </span>
                      <span className="font-bold text-rose-400">
                        -{formatMoney(suc.totalGastosOperativos)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-content-muted block text-[10px]">
                        Beneficio Neto Real ({suc.margenNetoPorcentaje}%)
                      </span>
                      <span
                        className={`font-black ${suc.beneficioNetoReal >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                          }`}
                      >
                        {suc.beneficioNetoReal >= 0 ? "+" : ""}
                        {formatMoney(suc.beneficioNetoReal)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, suc.porcentajeCobrado)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-primary group-hover:underline">
                    <span>Ver vista exclusiva de {suc.barrio}</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Fila de Sumatoria Global */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-content">
              <span>🌐</span>
              <span>
                SUMATORIA GLOBAL ({data.sucursalesResumen.length} sucursales):
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Cuotas Cobradas:{" "}
                <strong className="text-emerald-400 font-black">
                  {formatMoney(metricas.recaudacionHastaAhora)}
                </strong>
              </span>
              <span>•</span>
              <span>
                🥤 Ventas Kiosco:{" "}
                <strong className="text-cyan-400 font-black">
                  {formatMoney(metricas.ingresosKiosco)}
                </strong>{" "}
                <span className="text-emerald-400 font-semibold">
                  (Ganancia Neta: {formatMoney(metricas.gananciaNetaKiosco)})
                </span>
              </span>
              <span>•</span>
              <span>
                Total Caja (Cuotas + Kiosco):{" "}
                <strong className="text-primary font-black">
                  {formatMoney(metricas.recaudacionTotalConKiosco)}
                </strong>
              </span>
              <span>•</span>
              <span>
                📉 Gastos Operativos:{" "}
                <strong className="text-rose-400 font-black">
                  -{formatMoney(metricas.totalGastosOperativos)}
                </strong>
              </span>
              <span>•</span>
              <span>
                📊 Beneficio Neto Real:{" "}
                <strong
                  className={`font-black ${metricas.beneficioNetoReal >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                    }`}
                >
                  {metricas.beneficioNetoReal >= 0 ? "+" : ""}
                  {formatMoney(metricas.beneficioNetoReal)} ({metricas.margenNetoPorcentaje}%)
                </strong>
              </span>
              <span>•</span>
              <span>
                Pendiente Cuotas:{" "}
                <strong className="text-amber-400 font-black">
                  {formatMoney(metricas.pendienteCobro)}
                </strong>
              </span>
              <span>•</span>
              <span>
                Socios al Día:{" "}
                <strong className="text-content font-black">
                  {metricas.miembrosPagados} / {metricas.totalMiembrosConPlan}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TARJETAS KPI RECAUDACIÓN, GASTOS, MARGEN NETO Y COBRANZAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Recaudado hasta ahora */}
        <div className="bg-surface border border-border rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-content-muted">
              Cuotas Cobradas
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-bold">
              💰
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-content tracking-tight">
              {formatMoney(metricas.recaudacionHastaAhora)}
            </span>
          </div>
          <div className="mt-2 text-xs text-content-muted flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{metricas.porcentajeCobrado}% del potencial mensual</span>
          </div>
          {metricas.ingresosKiosco > 0 && (
            <div className="mt-1.5 text-[11px] font-bold text-primary">
              Total c/ Kiosco: {formatMoney(metricas.recaudacionTotalConKiosco)}
            </div>
          )}
          {/* Barra de progreso visual */}
          <div className="w-full bg-background rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metricas.porcentajeCobrado)}%` }}
            />
          </div>
        </div>

        {/* Ventas Kiosco / Mostrador */}
        <div className="bg-surface border border-cyan-500/30 rounded-2xl p-5 relative overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Ventas Kiosco
              </span>
              <span className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-sm font-bold">
                🥤
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-content tracking-tight">
                {formatMoney(metricas.ingresosKiosco)}
              </span>
            </div>
            <div className="mt-1.5 text-xs text-emerald-400 font-bold">
              Ganancia Neta: {formatMoney(metricas.gananciaNetaKiosco)}
            </div>
            <div className="text-[11px] text-content-muted mt-0.5">
              Costo mercadería: {formatMoney(metricas.costoKiosco)} ({metricas.cantidadVentasKiosco} ventas)
            </div>
          </div>
          <div className="pt-2.5 mt-2 border-t border-border/60">
            <Link
              href={
                selectedSucursalId !== null
                  ? `/admin/kiosco?sucursalId=${selectedSucursalId}`
                  : "/admin/kiosco"
              }
              className="inline-flex items-center justify-between w-full text-[11px] font-bold text-cyan-400 hover:underline"
            >
              <span>Ir a Mostrador / Stock</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Gastos Operativos y Beneficio Neto Real (Ingresos vs Egresos) */}
        <div className="bg-surface border border-violet-500/30 rounded-2xl p-5 relative overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                Beneficio Neto Real
              </span>
              <span className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center text-sm font-bold">
                📉
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`text-2xl font-black tracking-tight ${metricas.beneficioNetoReal >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
                  }`}
              >
                {metricas.beneficioNetoReal >= 0 ? "+" : ""}
                {formatMoney(metricas.beneficioNetoReal)}
              </span>
            </div>
            <div className="mt-1.5 text-xs text-rose-400 font-bold">
              Gastos Operativos: -{formatMoney(metricas.totalGastosOperativos)}
            </div>
            <div className="text-[11px] text-content-muted mt-0.5">
              Margen Neto: <strong className="text-content">{metricas.margenNetoPorcentaje}%</strong> ({metricas.cantidadGastosOperativos} gastos)
            </div>
          </div>
          <div className="pt-2.5 mt-2 border-t border-border/60">
            <button
              type="button"
              onClick={() => handleOpenModalNuevoGasto()}
              className="inline-flex items-center justify-between w-full text-[11px] font-bold text-violet-400 hover:underline cursor-pointer"
            >
              <span>+ Cargar Gasto Operativo</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Total potencial del mes */}
        <div className="bg-surface border border-border rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-content-muted">
              Total Potencial Mensual
            </span>
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
              🎯
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-content tracking-tight">
              {formatMoney(metricas.recaudacionTotalPotencial)}
            </span>
          </div>
          <div className="mt-2 text-xs text-content-muted">
            100% cuotas de miembros activos
          </div>
          <div className="w-full bg-background rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-primary h-full rounded-full w-full opacity-60" />
          </div>
        </div>

        {/* Pendiente de cobro */}
        <div className="bg-surface border border-border rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-content-muted">
              Pendiente de Cobro
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm font-bold">
              ⏳
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-content tracking-tight">
              {formatMoney(metricas.pendienteCobro)}
            </span>
          </div>
          <div className="mt-2 text-xs text-amber-400/90 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span>{metricas.miembrosPendientes} miembros sin registrar pago</span>
            </div>
            {(conteoSemaforo.criticos15 > 0 || conteoSemaforo.alertas10 > 0) && (
              <div className="flex items-center gap-2 pt-0.5 text-[11px]">
                {conteoSemaforo.criticos15 > 0 && (
                  <span className="text-red-400 font-bold flex items-center gap-0.5">
                    <span>🔴</span>
                    <span>{conteoSemaforo.criticos15} morosos (+15d)</span>
                  </span>
                )}
                {conteoSemaforo.alertas10 > 0 && (
                  <span className="text-orange-400 font-bold flex items-center gap-0.5">
                    <span>🟠</span>
                    <span>{conteoSemaforo.alertas10} alertas (+10d)</span>
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="w-full bg-background rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${metricas.recaudacionTotalPotencial > 0
                  ? Math.round(
                    (metricas.pendienteCobro / metricas.recaudacionTotalPotencial) * 100
                  )
                  : 0
                  }%`,
              }}
            />
          </div>
        </div>

        {/* Estado de miembros al día */}
        <div className="bg-surface border border-border rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-content-muted">
              Miembros al Día
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm font-bold">
              👥
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-content tracking-tight">
              {metricas.miembrosPagados} / {metricas.totalMiembrosConPlan}
            </span>
          </div>
          <div className="mt-2 text-xs text-content-muted">
            {metricas.totalMiembrosConPlan > 0
              ? `${Math.round(
                (metricas.miembrosPagados / metricas.totalMiembrosConPlan) * 100
              )}% de miembros con cuota paga`
              : "Sin miembros activos"}
          </div>
          <div className="w-full bg-background rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${metricas.totalMiembrosConPlan > 0
                  ? Math.round(
                    (metricas.miembrosPagados / metricas.totalMiembrosConPlan) * 100
                  )
                  : 0
                  }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICOS DE EVOLUCIÓN Y PROYECCIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO 1: EVOLUCIÓN DEL DINERO + PROYECCIÓN */}
        <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Evolución Financiera
                </span>
                <h3 className="text-lg font-bold text-content mt-0.5">
                  Recaudación Mensual y Proyección
                </h3>
                <p className="text-xs text-content-muted mt-1">
                  Histórico de los últimos 6 meses y estimación estimada para los próximos 3 meses
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs shrink-0">
                <span className="flex items-center gap-1.5 text-content-muted">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                  Cobrado
                </span>
                <span className="flex items-center gap-1.5 text-content-muted">
                  <span className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-500 border-dashed inline-block"></span>
                  Proyectado
                </span>
              </div>
            </div>

            {/* Visualizador de Barras de Recaudación */}
            <div className="mt-8 h-56 flex items-end justify-between gap-2 sm:gap-3 pt-6 border-b border-border pb-2">
              {evolucionCombinada.map((item, idx) => {
                const heightPercent = Math.max(8, Math.round((item.recaudacion / maxRecaudacion) * 100));
                const esMesSeleccionado =
                  item.mes === selectedMes && item.anio === selectedAnio;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip flotante */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border text-content text-[11px] py-1 px-2 rounded-lg shadow-xl pointer-events-none z-10 whitespace-nowrap font-medium text-center">
                      <div>{item.label}</div>
                      <div className="font-bold text-emerald-400">
                        {formatMoney(item.recaudacion)}
                      </div>
                      {item.esProyeccion && (
                        <div className="text-[10px] text-content-muted">(Proyección)</div>
                      )}
                    </div>

                    {/* Barra */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[42px] rounded-t-lg transition-all duration-300 relative flex items-start justify-center ${item.esProyeccion
                        ? "bg-emerald-500/25 border-2 border-dashed border-emerald-500 group-hover:bg-emerald-500/40"
                        : esMesSeleccionado
                          ? "bg-emerald-400 ring-2 ring-emerald-300 shadow-md shadow-emerald-500/30 group-hover:brightness-110"
                          : "bg-emerald-500/80 group-hover:bg-emerald-500"
                        }`}
                    >
                      {/* Valor rotado/arriba en desktop */}
                      <span className="text-[10px] text-content font-bold -top-5 absolute hidden sm:block whitespace-nowrap">
                        ${Math.round(item.recaudacion / 1000)}k
                      </span>
                    </div>

                    {/* Etiqueta del mes */}
                    <span
                      className={`text-[11px] mt-2 font-medium tracking-tight whitespace-nowrap ${esMesSeleccionado
                        ? "text-primary font-bold"
                        : item.esProyeccion
                          ? "text-content-muted italic"
                          : "text-content-muted"
                        }`}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-content-muted">
            <span>
              Pico proyectado:{" "}
              <strong className="text-content font-bold">
                {formatMoney(
                  Math.max(...proyeccionFutura.map((p) => p.recaudacion), 0)
                )}
              </strong>
            </span>
            <span className="text-[11px] italic">
              * Basado en la tasa de retención y crecimiento mensual
            </span>
          </div>
        </div>

        {/* GRÁFICO 2: EVOLUCIÓN DE USUARIOS ACTIVOS */}
        <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Crecimiento de Membresías
                </span>
                <h3 className="text-lg font-bold text-content mt-0.5">
                  Evolución de Usuarios Activos
                </h3>
                <p className="text-xs text-content-muted mt-1">
                  Cantidad de socios activos con membresía activa mes a mes
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs shrink-0">
                <span className="flex items-center gap-1.5 text-content-muted">
                  <span className="w-3 h-3 rounded bg-blue-500 inline-block"></span>
                  Socios
                </span>
                <span className="flex items-center gap-1.5 text-content-muted">
                  <span className="w-3 h-3 rounded bg-blue-500/40 border border-blue-500 border-dashed inline-block"></span>
                  Proyectados
                </span>
              </div>
            </div>

            {/* Visualizador de Barras de Usuarios */}
            <div className="mt-8 h-56 flex items-end justify-between gap-2 sm:gap-3 pt-6 border-b border-border pb-2">
              {evolucionCombinada.map((item, idx) => {
                const heightPercent = Math.max(10, Math.round((item.cantidadUsuarios / maxUsuarios) * 100));
                const esMesSeleccionado =
                  item.mes === selectedMes && item.anio === selectedAnio;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip flotante */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border text-content text-[11px] py-1 px-2 rounded-lg shadow-xl pointer-events-none z-10 whitespace-nowrap font-medium text-center">
                      <div>{item.label}</div>
                      <div className="font-bold text-blue-400">
                        {item.cantidadUsuarios} socios
                      </div>
                      {item.esProyeccion && (
                        <div className="text-[10px] text-content-muted">(Proyección)</div>
                      )}
                    </div>

                    {/* Barra */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[42px] rounded-t-lg transition-all duration-300 relative flex items-start justify-center ${item.esProyeccion
                        ? "bg-blue-500/25 border-2 border-dashed border-blue-500 group-hover:bg-blue-500/40"
                        : esMesSeleccionado
                          ? "bg-blue-400 ring-2 ring-blue-300 shadow-md shadow-blue-500/30 group-hover:brightness-110"
                          : "bg-blue-500/80 group-hover:bg-blue-500"
                        }`}
                    >
                      <span className="text-[10px] text-content font-bold -top-5 absolute hidden sm:block">
                        {item.cantidadUsuarios}
                      </span>
                    </div>

                    {/* Etiqueta del mes */}
                    <span
                      className={`text-[11px] mt-2 font-medium tracking-tight whitespace-nowrap ${esMesSeleccionado
                        ? "text-blue-400 font-bold"
                        : item.esProyeccion
                          ? "text-content-muted italic"
                          : "text-content-muted"
                        }`}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-content-muted">
            <span>
              Socios mes actual:{" "}
              <strong className="text-content font-bold">
                {metricas.totalMiembrosConPlan} miembros
              </strong>
            </span>
            <span className="text-[11px] italic">
              Proyección a fin de año: ~
              {Math.max(...proyeccionFutura.map((p) => p.cantidadUsuarios), 0)} miembros
            </span>
          </div>
        </div>
      </div>

      {/* DESGLOSE DE MÉTODOS DE PAGO DEL MES */}
      {data.metodosPagoDesglose.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-content uppercase tracking-wider">
              Distribución por Método de Pago ({metricas.nombreMes})
            </h4>
            <span className="text-xs text-content-muted">
              {data.metodosPagoDesglose.reduce((acc, m) => acc + m.cantidad, 0)} pagos registrados
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {data.metodosPagoDesglose.map((m, idx) => (
              <div
                key={idx}
                className="bg-background border border-border rounded-xl p-3.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs text-content-muted">
                  <span className="font-semibold text-content">{m.metodo}</span>
                  <span>{m.porcentaje}%</span>
                </div>
                <div className="mt-2 text-lg font-black text-content">
                  {formatMoney(m.total)}
                </div>
                <div className="text-[11px] text-content-muted mt-0.5">
                  {m.cantidad} {m.cantidad === 1 ? "cobro" : "cobros"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN DE GESTIÓN DE GASTOS OPERATIVOS Y MARGEN NETO (INGRESOS VS EGRESOS) */}
      <div
        id="seccion-gastos-margen"
        className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-6"
      >
        {/* Cabecera y botones rápidos */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
              Estado de Resultados (P&amp;L) — {metricas.nombreMes} {metricas.anio}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-content mt-0.5 flex items-center gap-2">
              <span>📉</span>
              <span>
                Gestión de Gastos Operativos y Margen Neto{" "}
                {selectedSucursalId === null
                  ? "(Vista Global)"
                  : (() => {
                    const s = data.sucursalesResumen.find(
                      (suc) => suc.id === selectedSucursalId
                    );
                    return s ? `— Sede ${s.barrio}` : "";
                  })()}
              </span>
            </h3>
            <p className="text-xs text-content-muted mt-1">
              Registrá alquiler, honorarios de profesores, luz/servicios y reposición de máquinas para conocer en tiempo real el beneficio neto real del gimnasio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleClonarGastosMesAnterior}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-surface-hover text-content text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              title="Copia automáticamente los gastos marcados como fijos/recurrentes del mes anterior"
            >
              <span>🔄</span>
              <span>Copiar Gastos Fijos Mes Anterior</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenModalNuevoGasto()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-extrabold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <span>+</span>
              <span>Registrar Gasto Operativo</span>
            </button>
          </div>
        </div>

        {/* Ecuación de Beneficio Neto Real (Ingresos vs Egresos) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-background border border-border rounded-xl p-4">
          <div className="p-2.5 rounded-lg bg-surface/60 border border-border/60">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-content-muted block">
              1. Ingresos Cuotas
            </span>
            <span className="text-lg font-black text-emerald-400 mt-1 block">
              +{formatMoney(metricas.recaudacionHastaAhora)}
            </span>
            <span className="text-[10px] text-content-muted">
              {metricas.miembrosPagados} cuotas cobradas
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface/60 border border-border/60">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-content-muted block">
              2. Ventas Kiosco (Bruto)
            </span>
            <span className="text-lg font-black text-cyan-400 mt-1 block">
              +{formatMoney(metricas.ingresosKiosco)}
            </span>
            <span className="text-[10px] text-content-muted">
              Costo mercadería: -{formatMoney(metricas.costoKiosco)}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface/60 border border-border/60">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-content-muted block">
              3. Total Ingresos Caja
            </span>
            <span className="text-lg font-black text-content mt-1 block">
              {formatMoney(metricas.recaudacionTotalConKiosco)}
            </span>
            <span className="text-[10px] text-content-muted">
              Cuotas + Kiosco mostrador
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 block">
              4. Total Egresos
            </span>
            <span className="text-lg font-black text-rose-400 mt-1 block">
              -{formatMoney(metricas.egresosTotales)}
            </span>
            <span className="text-[10px] text-content-muted">
              Gastos Op.: {formatMoney(metricas.totalGastosOperativos)} + Costo Kiosco: {formatMoney(metricas.costoKiosco)}
            </span>
          </div>

          <div
            className={`p-2.5 rounded-lg border ${metricas.beneficioNetoReal >= 0
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-rose-500/10 border-rose-500/30"
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-content">
                5. Beneficio Neto Real
              </span>
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${metricas.beneficioNetoReal >= 0
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/20 text-rose-400"
                  }`}
              >
                {metricas.margenNetoPorcentaje}% margen
              </span>
            </div>
            <span
              className={`text-xl font-black mt-1 block ${metricas.beneficioNetoReal >= 0
                ? "text-emerald-400"
                : "text-rose-400"
                }`}
            >
              {metricas.beneficioNetoReal >= 0 ? "+" : ""}
              {formatMoney(metricas.beneficioNetoReal)}
            </span>
            <span className="text-[10px] text-content-muted">
              Resultado limpio en bolsillo
            </span>
          </div>
        </div>

        {/* Botones rápidos de carga por rubro típico + Desglose por categoría */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
              Carga rápida por categoría o filtro de rubros:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: "🏢 + Alquiler", cat: "Alquiler" },
                { label: "🏋️ + Profesores", cat: "Profesores" },
                { label: "💡 + Luz y Servicios", cat: "Luz y Servicios" },
                { label: "🔧 + Reposición Máquinas", cat: "Reposición de Máquinas" },
              ].map((btn) => (
                <button
                  key={btn.cat}
                  type="button"
                  onClick={() => handleOpenModalNuevoGasto(btn.cat)}
                  className="px-2.5 py-1 rounded-lg border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {data.categoriasGastoDesglose && data.categoriasGastoDesglose.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              {data.categoriasGastoDesglose.map((c) => {
                const isSelectedCat = filtroCategoriaGasto === c.categoria;
                return (
                  <button
                    key={c.categoria}
                    type="button"
                    onClick={() =>
                      setFiltroCategoriaGasto(
                        isSelectedCat ? "todas" : c.categoria
                      )
                    }
                    className={`text-left rounded-xl p-3 border transition-all cursor-pointer ${isSelectedCat
                      ? "border-violet-500 bg-violet-500/10 shadow-sm"
                      : "border-border bg-background hover:border-violet-500/40"
                      }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-content truncate">
                        {c.categoria}
                      </span>
                      <span className="text-[11px] font-bold text-rose-400">
                        {c.porcentaje}%
                      </span>
                    </div>
                    <div className="mt-1.5 text-base font-black text-rose-400">
                      -{formatMoney(c.total)}
                    </div>
                    <div className="w-full bg-surface rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, c.porcentaje)}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-content-muted flex items-center justify-between">
                      <span>
                        {c.cantidad} {c.cantidad === 1 ? "gasto" : "gastos"}
                      </span>
                      <span>{isSelectedCat ? "Quitar filtro ✕" : "Filtrar"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Filtros y Tabla de Gastos Operativos */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchGastoQuery}
                onChange={(e) => setSearchGastoQuery(e.target.value)}
                placeholder="Buscar gasto por concepto, sede o nota..."
                className="px-3 py-2 rounded-xl border border-border bg-background text-content text-xs w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <select
                value={filtroCategoriaGasto}
                onChange={(e) => setFiltroCategoriaGasto(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-background text-content text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="todas">Todas las categorías</option>
                {CATEGORIAS_GASTO.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-content-muted">
              Mostrando <strong>{gastosFiltrados.length}</strong> de{" "}
              <strong>{data.gastosOperativos?.length || 0}</strong> gastos operativos
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/70 text-[11px] font-bold uppercase tracking-wider text-content-muted">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Sucursal</th>
                  <th className="py-3 px-4">Concepto / Detalle</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Medio de Pago</th>
                  <th className="py-3 px-4 text-right">Monto Egreso</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {gastosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 text-center text-content-muted"
                    >
                      No hay gastos operativos registrados para este filtro en{" "}
                      {metricas.nombreMes} {metricas.anio}.
                    </td>
                  </tr>
                ) : (
                  gastosFiltrados.map((g) => (
                    <tr
                      key={g.id}
                      className="hover:bg-background/50 transition-colors"
                    >
                      <td className="py-3 px-4 whitespace-nowrap text-content-muted">
                        {new Date(g.fechaGasto).toLocaleDateString("es-AR")}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                          <span>📍</span>
                          <span>{g.sucursal.barrio}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-content">{g.concepto}</div>
                        {(g.notas || g.comprobante) && (
                          <div className="text-[11px] text-content-muted mt-0.5">
                            {g.comprobante ? `Comp: ${g.comprobante} ` : ""}
                            {g.notas ? `• ${g.notas}` : ""}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                          {g.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {g.esRecurrente ? (
                          <span className="text-[11px] font-semibold text-sky-400">
                            🔄 Fijo mensual
                          </span>
                        ) : (
                          <span className="text-[11px] text-content-muted">
                            Eventual
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-content-muted">
                        {g.metodoPago}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right font-black text-rose-400">
                        -{formatMoney(g.monto)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenModalEditarGasto(g)}
                            className="px-2 py-1 rounded-lg border border-border bg-background hover:bg-surface text-content text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Editar gasto"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminarGasto(g)}
                            disabled={isPending}
                            className="px-2 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            title="Eliminar gasto"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TABLA DE MIEMBROS Y ESTADO DE PAGO */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Cabecera y Filtros */}
        <div className="p-4 sm:p-5 border-b border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-content">
                Control de Pagos de Socios
              </h3>
              <p className="text-xs text-content-muted mt-0.5">
                Mes en vista: {metricas.nombreMes} {metricas.anio} ({filteredUsuarios.length}{" "}
                socios listados)
              </p>
            </div>

            {/* Selector de Estado con Semáforo de Vencimientos */}
            <div className="flex flex-wrap items-center bg-background rounded-xl p-1 border border-border self-start sm:self-auto gap-1">
              <button
                onClick={() => setStatusFilter("todos")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === "todos"
                  ? "bg-surface text-content shadow-sm"
                  : "text-content-muted hover:text-content"
                  }`}
              >
                Todos ({data.usuarios.length})
              </button>
              <button
                onClick={() => setStatusFilter("pagados")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === "pagados"
                  ? "bg-emerald-500/15 text-emerald-400 font-bold shadow-sm"
                  : "text-content-muted hover:text-content"
                  }`}
              >
                Pagados ({metricas.miembrosPagados})
              </button>
              <button
                onClick={() => setStatusFilter("pendientes")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === "pendientes"
                  ? "bg-amber-500/15 text-amber-400 font-bold shadow-sm"
                  : "text-content-muted hover:text-content"
                  }`}
              >
                Pendientes ({metricas.miembrosPendientes})
              </button>
              {conteoSemaforo.alertas10 > 0 && (
                <button
                  onClick={() => setStatusFilter("vencidos_10")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${statusFilter === "vencidos_10"
                    ? "bg-orange-500/20 text-orange-400 font-bold shadow-sm ring-1 ring-orange-500/40"
                    : "text-orange-400/80 hover:text-orange-300 hover:bg-orange-500/10"
                    }`}
                  title="Socios cuya cuota venció hace más de 10 días"
                >
                  <span>🟠</span>
                  <span>+10 días ({conteoSemaforo.alertas10})</span>
                </button>
              )}
              {conteoSemaforo.criticos15 > 0 && (
                <button
                  onClick={() => setStatusFilter("vencidos_15")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${statusFilter === "vencidos_15"
                    ? "bg-red-500/20 text-red-400 font-bold shadow-sm ring-1 ring-red-500/40"
                    : "text-red-400/80 hover:text-red-300 hover:bg-red-500/10"
                    }`}
                  title="Socios cuya cuota venció hace más de 15 días"
                >
                  <span>🔴</span>
                  <span>+15 días ({conteoSemaforo.criticos15})</span>
                </button>
              )}
            </div>
          </div>

          {/* Barra de Búsqueda y Filtro por Plan */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre, apellido, DNI o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-content text-sm placeholder:text-content-muted/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="w-full sm:w-auto flex items-center gap-2">
              <span className="text-xs text-content-muted shrink-0 hidden sm:inline">
                Filtrar Plan:
              </span>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-xl border border-border bg-background text-content text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="todos">Todos los planes</option>
                {data.planesDisponibles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({formatMoney(p.precio)})
                  </option>
                ))}
                <option value="sin_plan">Sin Plan Asignado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listado / Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50 text-content-muted text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Socio</th>
                <th className="py-3 px-4 font-semibold">Sucursal</th>
                <th className="py-3 px-4 font-semibold">Plan Asignado</th>
                <th className="py-3 px-4 font-semibold">Importe Cuota</th>
                <th className="py-3 px-4 font-semibold text-center">Estado del Mes</th>
                <th className="py-3 px-4 font-semibold">Detalles de Cobro</th>
                <th className="py-3 px-4 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-content-muted">
                    <div className="text-3xl mb-2">📋</div>
                    <p className="font-medium text-content">
                      No se encontraron miembros con los filtros seleccionados
                    </p>
                    <p className="text-xs mt-1">
                      Probá cambiando el texto de búsqueda o los filtros de estado/plan.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map((u) => {
                  const importePlan = u.plan?.precio || 0;
                  const montoCobrado = u.pagoMesActual?.monto || importePlan;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-background/40 transition-colors group"
                    >
                      {/* Nombre y Contacto (sin avatar de iniciales para ahorrar espacio) */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-bold text-content flex items-center gap-2">
                            <span>
                              {u.nombre} {u.apellido}
                            </span>
                            {!u.isActive && (
                              <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-normal">
                                Inactivo
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-content-muted flex items-center gap-2 mt-0.5">
                            {u.dni && <span>DNI: {u.dni}</span>}
                            {u.telefono && (
                              <>
                                <span>•</span>
                                <span>{u.telefono}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Sucursal */}
                      <td className="py-3.5 px-4">
                        {u.sucursal ? (
                          <div>
                            <div className="font-semibold text-content text-xs flex items-center gap-1">
                              <span>📍</span>
                              <span>{u.sucursal.barrio}</span>
                            </div>
                            <div className="text-[11px] text-content-muted">
                              {u.sucursal.direccion}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-content-muted italic">
                            Sin sucursal
                          </span>
                        )}
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        {u.plan ? (
                          <div>
                            <div className="font-semibold text-content text-xs">
                              {u.plan.nombre}
                            </div>
                            <div className="text-[11px] text-content-muted">
                              {u.plan.diasPorSemana} días por semana
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-content-muted italic">
                            Sin plan asignado
                          </span>
                        )}
                      </td>

                      {/* Importe Cuota */}
                      <td className="py-3.5 px-4 font-bold text-content">
                        {u.plan ? formatMoney(u.plan.precio) : "-"}
                      </td>

                      {/* Estado del Mes con Semáforo de Vencimiento */}
                      <td className="py-3.5 px-4 text-center">
                        {u.haPagado ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <span>✓</span>
                            <span>Pagado</span>
                          </span>
                        ) : (() => {
                          const sem = calcularSemaforoVencimiento(u);
                          return (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-transform hover:scale-105 cursor-help ${sem.badgeClase}`}
                                title={
                                  sem.diasVencido > 0
                                    ? `Vencido hace ${sem.diasVencido} días (fecha límite habitual día ${datosBancarios.diaVencimiento})`
                                    : `Vence el día ${datosBancarios.diaVencimiento} de ${metricas.nombreMes}`
                                }
                              >
                                <span>{sem.icono}</span>
                                <span>{sem.label}</span>
                              </span>
                              {sem.diasVencido > 10 && (
                                <span className="text-[10px] text-content-muted font-medium">
                                  {sem.diasVencido > 15 ? "Moroso crítico" : "Aviso necesario"}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Detalles del pago (si pagó) */}
                      <td className="py-3.5 px-4">
                        {u.pagoMesActual ? (
                          <div className="text-xs space-y-0.5">
                            <div className="font-medium text-content">
                              {formatMoney(u.pagoMesActual.monto)} •{" "}
                              <span className="text-content-muted">
                                {u.pagoMesActual.metodoPago || "Efectivo"}
                              </span>
                            </div>
                            <div className="text-[11px] text-content-muted">
                              {new Date(u.pagoMesActual.fechaPago).toLocaleDateString("es-AR")}
                              {u.pagoMesActual.comprobante && ` • #${u.pagoMesActual.comprobante}`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-content-muted italic">
                            Sin registro de cobro
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <ActionsMenu
                            buttonTitle={`Acciones de cobro para ${u.nombre} ${u.apellido}`}
                            items={[
                              {
                                label: u.haPagado
                                  ? "Desmarcar / Anular Pago"
                                  : "Marcar como Pagado",
                                icon: <span>{u.haPagado ? "↩️" : "✅"}</span>,
                                onClick: () => handleTogglePago(u),
                                disabled: isPending,
                                variant: u.haPagado ? "warning" : "success",
                                title: u.haPagado
                                  ? "Anular o desmarcar el pago del mes"
                                  : "Marcar cuota como pagada en 1 clic",
                              },
                              {
                                label: "Editar / Detallar Cobro",
                                icon: <EditIcon />,
                                onClick: () => handleOpenModal(u),
                                title: "Editar comprobante, medio de pago o monto",
                              },
                              {
                                label: "Cobrar con Mercado Pago",
                                icon: <span>💳</span>,
                                onClick: () => handleOpenMpModal(u),
                                title:
                                  "Generar link de cobro o suscripción de Mercado Pago",
                              },
                              {
                                label: !u.haPagado
                                  ? "Enviar Recordatorio WhatsApp"
                                  : "Enviar WhatsApp",
                                icon: <WhatsAppIcon />,
                                onClick: () => handleEnviarWhatsAppDirecto(u),
                                variant: !u.haPagado ? "success" : "default",
                                title: !u.haPagado
                                  ? `Enviar recordatorio de cuota pendiente por WhatsApp a ${u.nombre}`
                                  : `Enviar mensaje por WhatsApp a ${u.nombre}`,
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUGERENCIAS DE FUNCIONALIDADES RELEVANTES PARA LA ECONOMÍA DEL GYM 
      <div className="bg-gradient-to-br from-surface to-background border border-border rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-primary">
          <span className="text-xl">💡</span>
          <h3 className="text-base font-bold uppercase tracking-wider text-content">
            Sugerencias de Funcionalidades para esta Sección
          </h3>
        </div>
        <p className="text-sm text-content-muted leading-relaxed">
          Para llevar la gestión económica del gimnasio al siguiente nivel, proponemos las siguientes
          herramientas y mejoras integrables:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {// Sugerencia 1: Recordatorios de Cobro por WhatsApp }
          <div className="bg-surface/80 border border-emerald-500/30 rounded-xl p-4 space-y-3 hover:border-emerald-500/60 transition-colors bg-gradient-to-br from-surface to-emerald-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-content">
                <span>💬</span>
                <span>Recordatorios por WhatsApp (1-Click)</span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                ¡Disponible!
              </span>
            </div>
            <p className="text-xs text-content-muted leading-relaxed">
              Envío directo de mensajes pre-redactados al socio con saldo pendiente, CBU/Alias del gimnasio y aviso de vencimiento.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const primerPendiente = data.usuarios.find((u) => !u.haPagado) || data.usuarios[0];
                  if (primerPendiente) setModalWaUsuario(primerPendiente);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-xs border border-emerald-500/30 transition-colors"
              >
                <span>💬 Probar Recordatorio</span>
              </button>
              <button
                type="button"
                onClick={() => setMostrarConfigBanco(true)}
                className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-background hover:bg-surface text-content text-xs font-semibold border border-border transition-colors"
                title="Configurar CBU, Alias y datos del gimnasio"
              >
                <span>⚙️ Configurar CBU</span>
              </button>
            </div>
          </div>

          {// Sugerencia 2: Módulo de Gastos Fijos y Flujo de Caja (P&L)}
          <div className="bg-surface/80 border border-violet-500/30 rounded-xl p-4 space-y-3 hover:border-violet-500/60 transition-colors bg-gradient-to-br from-surface to-violet-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-content">
                <span>📉</span>
                <span>Gestión de Gastos y Margen Neto</span>
              </div>
              <span className="text-[10px] font-bold bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30">
                ¡Disponible!
              </span>
            </div>
            <p className="text-xs text-content-muted leading-relaxed">
              Carga de gastos operativos (alquiler, profesores, luz, reposición de máquinas) por sucursal y global para calcular en tiempo real el beneficio neto real (Ingresos vs Egresos).
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleOpenModalNuevoGasto()}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 font-bold text-xs border border-violet-500/30 transition-colors cursor-pointer"
              >
                <span>+ Cargar Gasto</span>
              </button>
              <a
                href="#seccion-gastos-margen"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-background hover:bg-surface text-content text-xs font-semibold border border-border transition-colors"
              >
                <span>📊 Ver P&amp;L Neto</span>
              </a>
            </div>
          </div>

          {// Sugerencia 3: Alertas de Vencimiento y Morosidad (Semáforo) }
          <div className="bg-surface/80 border border-orange-500/30 rounded-xl p-4 space-y-3 hover:border-orange-500/60 transition-colors bg-gradient-to-br from-surface to-orange-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-content">
                <span>🚨</span>
                <span>Semáforo de Vencimientos</span>
              </div>
              <span className="text-[10px] font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                ¡Disponible!
              </span>
            </div>
            <p className="text-xs text-content-muted leading-relaxed">
              Monitoreo visual informativo de cuotas con retraso de <strong>+10 días (🟠 alerta)</strong> y <strong>+15 días (🔴 crítico)</strong> sin bloqueo forzoso: el administrador tiene control total de las acciones.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStatusFilter("vencidos_10")}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 font-bold text-xs border border-orange-500/30 transition-colors"
              >
                <span>🟠 Ver +10 días ({conteoSemaforo.alertas10})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("vencidos_15")}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 font-bold text-xs border border-red-500/30 transition-colors"
              >
                <span>🔴 Ver +15 días ({conteoSemaforo.criticos15})</span>
              </button>
            </div>
          </div>

          {//Sugerencia 4: Integración con Pasarelas de Cobro (Mercado Pago / Débito) }
          <div className="bg-surface/80 border border-sky-500/30 rounded-xl p-4 space-y-3 hover:border-sky-500/60 transition-colors bg-gradient-to-br from-surface to-sky-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-content">
                <span>💳</span>
                <span>Cobro Online (Mercado Pago / Débito)</span>
              </div>
              <span className="text-[10px] font-bold bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full border border-sky-500/30">
                ¡Disponible!
              </span>
            </div>
            <p className="text-xs text-content-muted leading-relaxed">
              Generación de links de pago individuales o suscripción con débito automático mensual con tarjeta, acreditando en tiempo real vía Webhook.
            </p>
            {data.usuarios.length > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const primerPendiente = data.usuarios.find((u) => !u.haPagado) || data.usuarios[0];
                    handleOpenMpModal(primerPendiente);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 font-bold text-xs border border-sky-500/30 transition-colors"
                >
                  <span>⚡ Probar Generador de Link / Suscripción</span>
                </button>
              </div>
            )}
          </div>

          {// Sugerencia 5: Reportes y Exportación Excel / PDF }
          <div className="bg-surface/80 border border-emerald-500/30 rounded-xl p-4 space-y-3 hover:border-emerald-500/60 transition-colors bg-gradient-to-br from-surface to-emerald-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-content">
                <span>📑</span>
                <span>Exportar Balance a Excel / PDF</span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                ¡Disponible!
              </span>
            </div>
            <p className="text-xs text-content-muted leading-relaxed">
              Descarga con un clic el balance mensual de cobros, detalle por medio de pago y listado de socios al día y morosos para auditoría contable.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => exportarBalanceExcel(data)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-xs border border-emerald-500/30 transition-colors"
              >
                <span>📊 Descargar Excel</span>
              </button>
              <button
                type="button"
                onClick={() => exportarBalancePDF(data)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 font-bold text-xs border border-red-500/30 transition-colors"
              >
                <span>📑 Imprimir PDF</span>
              </button>
            </div>
          </div>

          {// Sugerencia 6: Tarifas Promocionales y Venta de Productos}
          <div className="bg-surface/80 border border-cyan-500/30 rounded-xl p-4 space-y-3 hover:border-cyan-500/60 transition-colors bg-gradient-to-br from-surface to-cyan-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-content">
                <span>🥤</span>
                <span>Kiosco & Suplementación del Gym</span>
              </div>
              <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">
                ¡Disponible!
              </span>
            </div>
            <p className="text-xs text-content-muted leading-relaxed">
              Registro de ventas rápidas adicionales en mostrador (bebidas isotónicas, proteínas, indumentaria, toallas), manejo de stock con precios de compra/venta y habilitación por sucursal.
            </p>
            <div className="pt-1">
              <Link
                href={
                  selectedSucursalId !== null
                    ? `/admin/kiosco?sucursalId=${selectedSucursalId}`
                    : "/admin/kiosco"
                }
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 font-bold text-xs border border-cyan-500/30 transition-colors"
              >
                <span>⚡ Ir a Kiosco / Mostrador y Stock</span>
              </Link>
            </div>
          </div>
        </div>
      </div> 
      */}

      {/* MODAL PARA DETALLES DE PAGO / COBRO PERSONALIZADO */}
      {modalPagoUsuario && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setModalPagoUsuario(null)}
              className="absolute right-4 top-4 text-content-muted hover:text-content text-sm"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                💵
              </div>
              <div>
                <h3 className="font-bold text-content text-base">
                  Registrar / Modificar Cobro
                </h3>
                <p className="text-xs text-content-muted">
                  {modalPagoUsuario.nombre} {modalPagoUsuario.apellido} —{" "}
                  {metricas.nombreMes} {metricas.anio}
                </p>
              </div>
            </div>

            <form onSubmit={handleGuardarPagoModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                  Monto Cobrado ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={formMonto}
                  onChange={(e) => setFormMonto(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {modalPagoUsuario.plan && (
                  <p className="text-[11px] text-content-muted mt-1">
                    Valor sugerido del plan: {formatMoney(modalPagoUsuario.plan.precio)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                  Método de Pago
                </label>
                <select
                  value={formMetodo}
                  onChange={(e) => setFormMetodo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Mercado Pago">Mercado Pago</option>
                  <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                  N° de Comprobante / Recibo (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: REC-10492 o Transf. 98124"
                  value={formComprobante}
                  onChange={(e) => setFormComprobante(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                  Notas u Observaciones (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Descuento aplicado por familiar, pagó en dos partes..."
                  value={formNotas}
                  onChange={(e) => setFormNotas(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalPagoUsuario(null)}
                  className="px-4 py-2 rounded-xl border border-border text-content text-xs font-semibold hover:bg-background transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingModal}
                  className="px-4 py-2 rounded-xl bg-primary text-black font-extrabold text-xs hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmittingModal ? "Guardando..." : "Guardar Cobro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MERCADO PAGO — LINK DE COBRO & DÉBITO AUTOMÁTICO */}
      {modalMpUsuario && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => {
                setModalMpUsuario(null);
                setLinkGenerado(null);
              }}
              className="absolute right-4 top-4 text-content-muted hover:text-content text-sm"
            >
              ✕
            </button>

            {/* Header del Modal */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold text-xl shrink-0">
                🤝
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-content text-base">
                    Cobro Online con Mercado Pago
                  </h3>
                  <span className="text-[10px] bg-sky-500/20 text-sky-400 font-bold px-1.5 py-0.5 rounded">
                    Webhook Activo
                  </span>
                </div>
                <p className="text-xs text-content-muted">
                  Socio: <strong className="text-content">{modalMpUsuario.nombre} {modalMpUsuario.apellido}</strong> (DNI: {modalMpUsuario.dni || "N/A"})
                </p>
              </div>
            </div>

            {/* Selector de Modalidad: Cuota Única vs Débito Recurrente */}
            <div className="bg-background rounded-xl p-1 border border-border flex items-center gap-1 mb-5">
              <button
                type="button"
                onClick={() => handleChangeTipoCobroOnline("cuota_mes")}
                disabled={isGenerandoLink}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${tipoCobroOnline === "cuota_mes"
                  ? "bg-surface text-content shadow-sm border border-border"
                  : "text-content-muted hover:text-content"
                  }`}
              >
                <span>💳</span>
                <span>Cuota Mes Actual ({metricas.nombreMes})</span>
              </button>
              <button
                type="button"
                onClick={() => handleChangeTipoCobroOnline("suscripcion_mensual")}
                disabled={isGenerandoLink}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${tipoCobroOnline === "suscripcion_mensual"
                  ? "bg-purple-500/15 text-purple-400 font-bold shadow-sm border border-purple-500/30"
                  : "text-content-muted hover:text-content"
                  }`}
              >
                <span>🔁</span>
                <span>Suscripción (Débito Mensual)</span>
              </button>
            </div>

            {/* Resumen del Importe */}
            <div className="bg-background/60 border border-border rounded-xl p-4 mb-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-content-muted block">
                  {tipoCobroOnline === "suscripcion_mensual" ? "Débito automático mensual:" : "Importe cuota a cobrar:"}
                </span>
                <span className="text-sm font-bold text-content">
                  {modalMpUsuario.plan ? modalMpUsuario.plan.nombre : "Plan Estándar"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-content">
                  {formatMoney(modalMpUsuario.plan ? modalMpUsuario.plan.precio : 28000)}
                </span>
                <span className="text-[11px] text-content-muted block">
                  {tipoCobroOnline === "suscripcion_mensual" ? "por mes (recurrente)" : "pago único"}
                </span>
              </div>
            </div>

            {/* Estado de Carga o Link Listo */}
            {isGenerandoLink ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
                <span className="text-xs text-content-muted">Generando link de cobro seguro...</span>
              </div>
            ) : linkGenerado ? (
              <div className="space-y-4">
                {/* Input con URL generada */}
                <div>
                  <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                    Link de Pago Generado:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={linkGenerado.initPoint}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-xs font-mono select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopiarLink}
                      className="px-3 py-2 rounded-xl border border-border bg-background hover:bg-surface text-content text-xs font-bold shrink-0 transition-colors"
                    >
                      {copiadoLink ? "✓ Copiado" : "📋 Copiar"}
                    </button>
                  </div>
                </div>

                {/* Acciones Rápidas con el Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {/* Abrir Checkout interactivo */}
                  <a
                    href={linkGenerado.initPoint}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs transition-colors shadow-sm"
                  >
                    <span>🚀</span>
                    <span>Abrir Checkout</span>
                  </a>

                  {/* Enviar por WhatsApp */}
                  {(() => {
                    const mensajeWa = encodeURIComponent(
                      `Hola ${modalMpUsuario.nombre}! Te comparto el link de ${tipoCobroOnline === "suscripcion_mensual" ? "adhesión al débito automático mensual" : `pago de tu cuota de ${metricas.nombreMes}`
                      } de Gym Meraki por un valor de ${formatMoney(modalMpUsuario.plan ? modalMpUsuario.plan.precio : 28000)}:\n\n${linkGenerado.initPoint}\n\nUna vez abonado, se acredita automáticamente en tu perfil. Saludos!`
                    );
                    const telLimpio = (modalMpUsuario.telefono || "").replace(/\D/g, "");
                    const waUrl = telLimpio
                      ? `https://wa.me/${telLimpio}?text=${mensajeWa}`
                      : `https://wa.me/?text=${mensajeWa}`;

                    return (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
                      >
                        <span>💬</span>
                        <span>Enviar por WhatsApp</span>
                      </a>
                    );
                  })()}
                </div>

                {/* Nota del Webhook */}
                <div className="p-3 rounded-xl bg-background border border-border text-[11px] text-content-muted leading-relaxed flex items-start gap-2">
                  <span className="text-base leading-none">ℹ️</span>
                  <span>
                    Cuando el socio completa el pago desde el Checkout, el webhook de Mercado Pago actualiza el estado de la cuota a <strong>&quot;Pagado&quot;</strong> en tiempo real de forma automática.
                  </span>
                </div>
              </div>
            ) : null}

            <div className="mt-5 pt-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setModalMpUsuario(null);
                  setLinkGenerado(null);
                }}
                className="px-4 py-2 rounded-xl border border-border text-content text-xs font-semibold hover:bg-background transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: VISTA PREVIA Y ENVÍO DE RECORDATORIO POR WHATSAPP */}
      {modalWaUsuario && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => {
                setModalWaUsuario(null);
                setCopiadoWaText(false);
              }}
              className="absolute right-4 top-4 text-content-muted hover:text-content text-sm"
            >
              ✕
            </button>

            {/* Header del Modal */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-xl shrink-0">
                💬
              </div>
              <div>
                <h3 className="font-bold text-content text-base">
                  Recordatorio de Cuota por WhatsApp
                </h3>
                <p className="text-xs text-content-muted">
                  Socio: <strong className="text-content">{modalWaUsuario.nombre} {modalWaUsuario.apellido}</strong> • {modalWaUsuario.telefono ? `Tel: ${modalWaUsuario.telefono}` : "Sin teléfono registrado"}
                </p>
              </div>
            </div>

            {/* Resumen del Saldo y Vencimiento */}
            <div className="bg-background/60 border border-border rounded-xl p-3.5 mb-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-content-muted block">Monto Pendiente:</span>
                <span className="text-base font-black text-amber-400">
                  {formatMoney(modalWaUsuario.plan ? modalWaUsuario.plan.precio : 28000)}
                </span>
                <span className="text-[11px] text-content-muted block">
                  Cuota {metricas.nombreMes} {metricas.anio}
                </span>
              </div>
              <div>
                <span className="text-content-muted block">Vencimiento habitual:</span>
                <span className="font-bold text-content">
                  Día {datosBancarios.diaVencimiento} de {metricas.nombreMes}
                </span>
                <span className="text-[11px] text-content-muted block">
                  Alias: <strong className="text-content">{datosBancarios.alias}</strong>
                </span>
              </div>
            </div>

            {/* Vista Previa del Mensaje Estilo WhatsApp */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-content-muted uppercase tracking-wider">
                  Mensaje Pre-redactado:
                </span>
                <button
                  type="button"
                  onClick={() => setMostrarConfigBanco(true)}
                  className="text-[11px] text-primary hover:underline font-semibold"
                >
                  ⚙️ Cambiar CBU/Alias
                </button>
              </div>
              <div className="bg-[#0b141a]/95 text-[#e9edef] p-3.5 rounded-xl border border-emerald-900/40 text-xs font-sans whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto select-text shadow-inner">
                {generarMensajeWhatsAppRecordatorio(modalWaUsuario)}
              </div>
            </div>

            {/* Acciones de Envío y Copiado */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleEnviarWhatsAppDirecto(modalWaUsuario)}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>🚀</span>
                <span>Abrir WhatsApp y Enviar (1-Click)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopiarMensajeWa(modalWaUsuario)}
                className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl border border-border bg-background hover:bg-surface text-content text-xs font-bold transition-colors shrink-0"
              >
                {copiadoWaText ? "✓ Copiado" : "📋 Copiar Texto"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalWaUsuario(null);
                  setCopiadoWaText(false);
                }}
                className="w-full sm:w-auto py-2.5 px-3 rounded-xl border border-border text-content-muted hover:text-content text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIGURACIÓN DE DATOS BANCARIOS (CBU / ALIAS / VENCIMIENTO) */}
      {mostrarConfigBanco && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setMostrarConfigBanco(false)}
              className="absolute right-4 top-4 text-content-muted hover:text-content text-sm"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                🏦
              </div>
              <div>
                <h3 className="font-bold text-content text-base">
                  Datos Bancarios del Gimnasio
                </h3>
                <p className="text-xs text-content-muted">
                  Estos datos viajan en el mensaje automático de WhatsApp
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                  Alias de Transferencia:
                </label>
                <input
                  type="text"
                  value={datosBancarios.alias}
                  onChange={(e) =>
                    setDatosBancarios((prev) => ({ ...prev, alias: e.target.value.toUpperCase() }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: MERAKI.GYM"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                  CBU / CVU (22 dígitos):
                </label>
                <input
                  type="text"
                  value={datosBancarios.cbu}
                  onChange={(e) =>
                    setDatosBancarios((prev) => ({ ...prev, cbu: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: 0000003100012345678901"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                  Nombre del Titular de la Cuenta:
                </label>
                <input
                  type="text"
                  value={datosBancarios.titular}
                  onChange={(e) =>
                    setDatosBancarios((prev) => ({ ...prev, titular: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: Gym Meraki S.R.L."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                    Banco / Billetera:
                  </label>
                  <input
                    type="text"
                    value={datosBancarios.banco}
                    onChange={(e) =>
                      setDatosBancarios((prev) => ({ ...prev, banco: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: Banco Galicia"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                    Día de Vencimiento:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={datosBancarios.diaVencimiento}
                    onChange={(e) =>
                      setDatosBancarios((prev) => ({ ...prev, diaVencimiento: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: 10"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setMostrarConfigBanco(false)}
                className="px-4 py-2 rounded-xl bg-primary text-black font-extrabold text-xs hover:bg-primary/90 transition-colors"
              >
                Guardar y Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REGISTRAR / EDITAR GASTO OPERATIVO (ALQUILER, PROFESORES, LUZ, MÁQUINAS) */}
      {modalGastoOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setModalGastoOpen(false)}
              className="absolute right-4 top-4 text-content-muted hover:text-content text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center font-bold text-lg">
                📉
              </div>
              <div>
                <h3 className="font-bold text-content text-base">
                  {editandoGasto
                    ? "Editar Gasto Operativo"
                    : "Registrar Gasto Operativo"}
                </h3>
                <p className="text-xs text-content-muted">
                  Período {metricas.nombreMes} {metricas.anio} — Se descuenta automáticamente del margen neto
                </p>
              </div>
            </div>

            <form onSubmit={handleGuardarGasto} className="space-y-3.5 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                    Sucursal Correspondiente *
                  </label>
                  <select
                    value={gastoSucursalId}
                    onChange={(e) => setGastoSucursalId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {data.sucursalesResumen.map((s) => (
                      <option key={s.id} value={s.id}>
                        📍 {s.barrio} ({s.direccion})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                    Categoría / Rubro *
                  </label>
                  <select
                    value={gastoCategoria}
                    onChange={(e) => setGastoCategoria(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {CATEGORIAS_GASTO.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                  Concepto del Gasto *
                </label>
                <input
                  type="text"
                  required
                  value={gastoConcepto}
                  onChange={(e) => setGastoConcepto(e.target.value)}
                  placeholder="Ej: Alquiler mensual local, Honorarios Profesores, Factura Luz, Cable polea..."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                    Monto ($ ARS) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={gastoMonto}
                    onChange={(e) => setGastoMonto(e.target.value)}
                    placeholder="Ej: 150000"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                    Medio de Pago
                  </label>
                  <select
                    value={gastoMetodoPago}
                    onChange={(e) => setGastoMetodoPago(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="Transferencia">Transferencia</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Débito Automático">Débito Automático</option>
                    <option value="Mercado Pago">Mercado Pago</option>
                    <option value="Tarjeta">Tarjeta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                    N° Comprobante / Factura (Opcional)
                  </label>
                  <input
                    type="text"
                    value={gastoComprobante}
                    onChange={(e) => setGastoComprobante(e.target.value)}
                    placeholder="Ej: FAC-000124"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                    Notas / Detalle (Opcional)
                  </label>
                  <input
                    type="text"
                    value={gastoNotas}
                    onChange={(e) => setGastoNotas(e.target.value)}
                    placeholder="Observaciones adicionales..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-content text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-background cursor-pointer">
                <input
                  type="checkbox"
                  checked={gastoRecurrente}
                  onChange={(e) => setGastoRecurrente(e.target.checked)}
                  className="rounded border-border text-violet-500 focus:ring-violet-500"
                />
                <span className="text-xs text-content">
                  <strong>Gasto Fijo Mensual Recurrente</strong> (permite copiarlo con 1 clic en los meses siguientes)
                </span>
              </label>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalGastoOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-content-muted hover:text-content text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGasto}
                  className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-extrabold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingGasto
                    ? "Guardando..."
                    : editandoGasto
                      ? "Guardar Cambios"
                      : "Registrar Gasto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

