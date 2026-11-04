"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CalendarioData, CalendarioRegistroItem } from "./actions";

interface CalendarioClientProps {
  data: CalendarioData;
}

const DIAS_SEMANA_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DIAS_SEMANA_LARGOS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const NOMBRES_MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Helper para convertir Date a formato YYYY-MM-DD
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Helper para obtener el Lunes de la semana de una fecha
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // day: 0 es Domingo, 1 es Lunes, ..., 6 es Sábado
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function CalendarioClient({ data }: CalendarioClientProps) {
  const todayKey = useMemo(() => toDateKey(new Date()), []);

  // Vista actual: "mes" o "semana"
  const [vista, setVista] = useState<"mes" | "semana">("mes");

  // Fecha de referencia actual para navegar
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Día seleccionado para inspección (por defecto hoy, o el día de asistencia más reciente)
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => {
    if (data.diasAsistidosKeys.includes(todayKey)) {
      return todayKey;
    }
    return data.diasAsistidosKeys[0] || todayKey;
  });

  // Agrupar registros por fecha YYYY-MM-DD
  const registrosPorFecha = useMemo(() => {
    const map = new Map<string, CalendarioRegistroItem[]>();
    for (const r of data.registros) {
      const list = map.get(r.fechaDiaKey) || [];
      list.push(r);
      map.set(r.fechaDiaKey, list);
    }
    return map;
  }, [data.registros]);

  // Set de fechas en las que el usuario asistió (al menos 1 ejercicio completado)
  const asistenciasSet = useMemo(() => {
    return new Set(data.diasAsistidosKeys);
  }, [data.diasAsistidosKeys]);

  // Navegación anterior / siguiente
  const handleNavPrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (vista === "mes") {
        next.setMonth(next.getMonth() - 1);
      } else {
        next.setDate(next.getDate() - 7);
      }
      return next;
    });
  };

  const handleNavNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (vista === "mes") {
        next.setMonth(next.getMonth() + 1);
      } else {
        next.setDate(next.getDate() + 7);
      }
      return next;
    });
  };

  const handleIrHoy = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateKey(todayKey);
  };

  // Cálculo de estadísticas rápidas
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const asistenciasEsteMes = useMemo(() => {
    return data.diasAsistidosKeys.filter((key) => {
      const [y, m] = key.split("-").map(Number);
      return y === currentYear && m === currentMonth + 1;
    }).length;
  }, [data.diasAsistidosKeys, currentYear, currentMonth]);

  const asistenciasEstaSemana = useMemo(() => {
    const startOfWeek = getStartOfWeek(new Date());
    const weekKeys = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return toDateKey(d);
    });
    return weekKeys.filter((k) => asistenciasSet.has(k)).length;
  }, [asistenciasSet]);

  const metaDiasPlan = data.usuario.diasPorSemanaPlan || 3;

  // Días para la cuadrícula del MES
  const diasMesGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Ajustar para empezar en Lunes (0 en JS es Domingo, así que Lunes es 1)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Domingo pasa a índice 6

    const days: Array<{
      date: Date;
      dateKey: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      asistio: boolean;
      totalEjercicios: number;
    }> = [];

    // Días del mes anterior para rellenar
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const k = toDateKey(d);
      days.push({
        date: d,
        dateKey: k,
        isCurrentMonth: false,
        isToday: k === todayKey,
        asistio: asistenciasSet.has(k),
        totalEjercicios: registrosPorFecha.get(k)?.length || 0,
      });
    }

    // Días del mes actual
    for (let dayNum = 1; dayNum <= lastDayOfMonth.getDate(); dayNum++) {
      const d = new Date(year, month, dayNum);
      const k = toDateKey(d);
      days.push({
        date: d,
        dateKey: k,
        isCurrentMonth: true,
        isToday: k === todayKey,
        asistio: asistenciasSet.has(k),
        totalEjercicios: registrosPorFecha.get(k)?.length || 0,
      });
    }

    // Días del mes siguiente para completar múltiplos de 7 (hasta 35 o 42 celdas)
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const d = new Date(year, month + 1, i);
        const k = toDateKey(d);
        days.push({
          date: d,
          dateKey: k,
          isCurrentMonth: false,
          isToday: k === todayKey,
          asistio: asistenciasSet.has(k),
          totalEjercicios: registrosPorFecha.get(k)?.length || 0,
        });
      }
    }

    return days;
  }, [currentDate, todayKey, asistenciasSet, registrosPorFecha]);

  // Días para la vista de SEMANA
  const diasSemanaGrid = useMemo(() => {
    const startOfWeek = getStartOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const k = toDateKey(d);
      return {
        date: d,
        dateKey: k,
        nombreDiaCorto: DIAS_SEMANA_CORTOS[i],
        nombreDiaLargo: DIAS_SEMANA_LARGOS[i],
        numeroDia: d.getDate(),
        isToday: k === todayKey,
        asistio: asistenciasSet.has(k),
        totalEjercicios: registrosPorFecha.get(k)?.length || 0,
      };
    });
  }, [currentDate, todayKey, asistenciasSet, registrosPorFecha]);

  // Detalle del día seleccionado
  const ejerciciosDelDiaSeleccionado = registrosPorFecha.get(selectedDateKey) || [];
  const asistioDiaSeleccionado = asistenciasSet.has(selectedDateKey);

  // Formato legible para el título del día seleccionado
  const fechaSeleccionadaLegible = useMemo(() => {
    const [y, m, d] = selectedDateKey.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = DIAS_SEMANA_LARGOS[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1];
    return `${dayOfWeek}, ${d} de ${NOMBRES_MESES[m - 1]} de ${y}`;
  }, [selectedDateKey]);

  return (
    <div className="space-y-6">
      {/* 1. TARJETAS DE MÉTRICAS Y ESTADÍSTICAS (Optimizado para Mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Asistencias este mes */}
        <div className="rounded-xl border border-border bg-surface p-3.5 sm:p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Este Mes</span>
            <span className="text-base">📅</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-content">{asistenciasEsteMes}</span>
            <span className="text-xs text-content-muted font-semibold">días</span>
          </div>
          <p className="text-[11px] text-content-muted truncate">
            En {NOMBRES_MESES[currentMonth]}
          </p>
        </div>

        {/* Meta semanal */}
        <div className="rounded-xl border border-border bg-surface p-3.5 sm:p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Semana Actual</span>
            <span className="text-base">🎯</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-primary">{asistenciasEstaSemana}</span>
            <span className="text-xs text-content-muted font-semibold">de {metaDiasPlan} d</span>
          </div>
          <p className="text-[11px] text-content-muted truncate">
            {asistenciasEstaSemana >= metaDiasPlan ? "🎉 ¡Meta cumplida!" : `Falta ${metaDiasPlan - asistenciasEstaSemana} día(s)`}
          </p>
        </div>

        {/* Total histórico */}
        <div className="rounded-xl border border-border bg-surface p-3.5 sm:p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Histórico</span>
            <span className="text-base">💪</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-content">{data.totalDiasAsistidos}</span>
            <span className="text-xs text-content-muted font-semibold">días</span>
          </div>
          <p className="text-[11px] text-content-muted truncate">
            Sesiones de gym registradas
          </p>
        </div>

        {/* Estado actual */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/15 p-3.5 sm:p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
            <span className="text-[11px] font-bold uppercase tracking-wider">Entrenaste Hoy</span>
            <span className="text-base">⚡</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {asistenciasSet.has(todayKey) ? "¡SÍ!" : "AÚN NO"}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 truncate">
            {asistenciasSet.has(todayKey) ? "Completaste ejercicios hoy" : "Registrá tu rutina hoy"}
          </p>
        </div>
      </div>

      {/* 2. BARRA DE CONTROL: NAVEGACIÓN Y SELECTOR DE VISTA */}
      <div className="rounded-2xl border border-border bg-surface p-3.5 sm:p-5 shadow-xs space-y-3 sm:space-y-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Fila 1 en mobile / Derecha en desktop: Selector de Vistas + Botón Hoy debajo en mobile */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
            {/* Toggle de Vistas: Mensual vs Semanal */}
            <div className="flex items-center rounded-xl bg-surface-hover/70 p-1 border border-border/70 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setVista("mes")}
                className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  vista === "mes"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-content-muted hover:text-content"
                }`}
              >
                📅 Mensual
              </button>
              <button
                type="button"
                onClick={() => setVista("semana")}
                className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  vista === "semana"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-content-muted hover:text-content"
                }`}
              >
                📆 Semanal
              </button>
            </div>

            {/* Botón Hoy: bajo los botones Mensual y Semanal en mobile, al lado en desktop */}
            <button
              type="button"
              onClick={handleIrHoy}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-bold rounded-xl border border-border bg-surface hover:bg-surface-hover text-content transition-colors cursor-pointer active:scale-95 shadow-2xs"
              title="Volver al día de hoy"
            >
              <span className="text-primary text-sm leading-none">📍</span>
              <span>Ir a Hoy</span>
            </button>
          </div>

          {/* Fila 2 en mobile / Izquierda en desktop: Navegación del Período < Mes y Año > */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 order-2 sm:order-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleNavPrev}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface-hover text-content transition-colors cursor-pointer active:scale-95 shadow-2xs"
              title="Período anterior"
              aria-label="Período anterior"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center px-2">
              <h2 className="text-sm sm:text-base font-bold text-content capitalize whitespace-nowrap">
                {vista === "mes" ? (
                  `${NOMBRES_MESES[currentMonth]} ${currentYear}`
                ) : (
                  `Semana de ${NOMBRES_MESES[diasSemanaGrid[0].date.getMonth()]}`
                )}
              </h2>
              {vista === "semana" && (
                <p className="text-[10px] sm:text-[11px] text-content-muted whitespace-nowrap">
                  {diasSemanaGrid[0].numeroDia} al {diasSemanaGrid[6].numeroDia} de {NOMBRES_MESES[diasSemanaGrid[6].date.getMonth()]}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleNavNext}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface-hover text-content transition-colors cursor-pointer active:scale-95 shadow-2xs"
              title="Período siguiente"
              aria-label="Período siguiente"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 3. VISTA MENSUAL: CUADRÍCULA 7 COLUMNAS */}
        {vista === "mes" ? (
          <div className="space-y-2">
            {/* Cabecera con días de la semana */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
              {DIAS_SEMANA_CORTOS.map((d) => (
                <div key={d} className="py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-content-muted">
                  {d}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {diasMesGrid.map((item) => {
                const isSelected = item.dateKey === selectedDateKey;

                return (
                  <button
                    key={item.dateKey}
                    type="button"
                    onClick={() => setSelectedDateKey(item.dateKey)}
                    className={`relative flex flex-col items-center justify-between min-h-[46px] sm:min-h-[66px] p-1 sm:p-2 rounded-lg sm:rounded-xl transition-all cursor-pointer border text-left touch-manipulation ${
                      isSelected
                        ? "ring-2 ring-primary border-primary bg-primary/5 dark:bg-primary/10 shadow-sm z-10 scale-[1.02]"
                        : item.asistio
                          ? "border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-950/20 hover:border-emerald-500 shadow-2xs"
                          : item.isToday
                            ? "border-primary/50 bg-surface-hover/80"
                            : item.isCurrentMonth
                              ? "border-border/70 bg-surface hover:bg-surface-hover hover:border-border"
                              : "border-transparent bg-surface/30 opacity-35 hover:opacity-70"
                    }`}
                  >
                    {/* Número de día + indicador "Hoy" */}
                    <div className="w-full flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          item.isToday
                            ? "flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-black"
                            : item.asistio
                              ? "text-emerald-700 dark:text-emerald-300 font-extrabold"
                              : item.isCurrentMonth
                                ? "text-content"
                                : "text-content-muted"
                        }`}
                      >
                        {item.date.getDate()}
                      </span>

                      {item.asistio && (
                        <span
                          className="flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500 shadow-xs"
                          title="Asististe este día"
                        />
                      )}
                    </div>

                    {/* Insignia de entrenamiento en el día */}
                    <div className="w-full flex items-center justify-center sm:justify-start pt-1">
                      {item.asistio ? (
                        <span className="hidden sm:inline-flex items-center gap-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 text-[10px] font-bold">
                          ✓ {item.totalEjercicios} ej.
                        </span>
                      ) : null}

                      {/* En mobile: mostrar badge de ícono */}
                      {item.asistio && (
                        <span className="sm:hidden text-xs" title={`${item.totalEjercicios} ejercicios completados`}>
                          💪
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* 4. VISTA SEMANAL (Formato de tarjetas horizontales/verticales optimizado para móvil) */
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
            {diasSemanaGrid.map((item) => {
              const isSelected = item.dateKey === selectedDateKey;

              return (
                <button
                  key={item.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(item.dateKey)}
                  className={`flex sm:flex-col items-center justify-between p-3.5 sm:p-3 rounded-xl border transition-all cursor-pointer text-left touch-manipulation ${
                    isSelected
                      ? "ring-2 ring-primary border-primary bg-primary/5 dark:bg-primary/10 shadow-sm scale-[1.01]"
                      : item.asistio
                        ? "border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-950/20 hover:border-emerald-500"
                        : item.isToday
                          ? "border-primary/40 bg-surface-hover"
                          : "border-border/70 bg-surface hover:bg-surface-hover"
                  }`}
                >
                  <div className="flex sm:flex-col items-center gap-2 sm:gap-1">
                    <span className="text-xs sm:text-[11px] font-bold uppercase tracking-wider text-content-muted sm:order-1">
                      {item.nombreDiaCorto}
                    </span>
                    <span
                      className={`text-base sm:text-xl font-black sm:order-2 ${
                        item.isToday
                          ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs"
                          : item.asistio
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-content"
                      }`}
                    >
                      {item.numeroDia}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:mt-2">
                    {item.asistio ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white px-2.5 py-1 text-[11px] font-bold shadow-2xs">
                        <span>✓</span>
                        <span>{item.totalEjercicios} ej.</span>
                      </span>
                    ) : item.isToday ? (
                      <span className="rounded-full bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 text-[11px] font-bold">
                        Hoy
                      </span>
                    ) : (
                      <span className="text-[11px] text-content-muted">Descanso</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Leyenda rápida */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs text-content-muted">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500 border border-emerald-600 inline-block shadow-2xs" />
              <span>Día con entrenamiento</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-primary inline-block" />
              <span>Día actual (Hoy)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-primary ring-1 ring-primary inline-block" />
              <span>Día seleccionado</span>
            </div>
          </div>
          <span className="text-[11px] italic">
            * Se registra asistencia con al menos 1 ejercicio completado.
          </span>
        </div>
      </div>

      {/* 5. DETALLE DEL DÍA SELECCIONADO (Inspector detallado) */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/70 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Detalle del Día
              </span>
              {selectedDateKey === todayKey && (
                <span className="rounded-full bg-primary/15 text-primary text-[10px] font-black px-2 py-0.5 border border-primary/20">
                  HOY
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-content mt-0.5">
              {fechaSeleccionadaLegible}
            </h3>
          </div>

          <div>
            {asistioDiaSeleccionado ? (
              <Badge variant="success">
                ✓ Fuiste a entrenar ({ejerciciosDelDiaSeleccionado.length} ejercicios)
              </Badge>
            ) : (
              <Badge variant="default">
                Sin asistencia registrada
              </Badge>
            )}
          </div>
        </div>

        {/* Contenido del día: Lista de ejercicios realizados o estado de descanso */}
        {asistioDiaSeleccionado ? (
          <div className="space-y-3">
            <p className="text-xs font-medium text-content-muted">
              Ejercicios completados durante esta sesión:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ejerciciosDelDiaSeleccionado.map((ej, idx) => (
                <div
                  key={ej.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-hover/40 shadow-2xs gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white font-black text-xs shadow-2xs">
                      {idx + 1}
                    </span>

                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-content truncate leading-tight">
                        {ej.nombre}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {ej.grupoMuscular && (
                          <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider bg-surface px-1.5 py-0.5 rounded border border-border">
                            {ej.grupoMuscular}
                          </span>
                        )}
                        {ej.horaFormateada && (
                          <span className="text-[11px] text-content-muted">
                            ⏱️ {ej.horaFormateada} hs
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-primary block">
                      {ej.peso > 0 ? `${ej.peso} kg` : "Sin carga"}
                    </span>
                    {ej.seriesCompletadas && (
                      <span className="text-[11px] text-content-muted font-medium">
                        {ej.seriesCompletadas} series
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
            <span className="text-3xl block">😴</span>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-content">
                No hay entrenamientos registrados para este día
              </h4>
              <p className="text-xs text-content-muted max-w-sm mx-auto">
                {selectedDateKey === todayKey
                  ? "¡Todavía estás a tiempo para completar tu rutina hoy y sumar una nueva asistencia!"
                  : "Los días de descanso también son fundamentales para la recuperación muscular y el progreso."}
              </p>
            </div>

            {selectedDateKey === todayKey && (
              <div className="pt-2">
                <Link href="/mi-rutina">
                  <Button variant="primary" size="sm">
                    Ir a Mi Rutina de Hoy ➜
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

