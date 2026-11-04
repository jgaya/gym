"use client";

import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { actualizarPesoEjercicio, toggleCompletarEjercicioHoy, MiRutinaData } from "./actions";
import { HistorialGraficoModal } from "@/app/mi-rutina/HistorialGraficoModal";
import { EjercicioDetalleModal } from "./EjercicioDetalleModal";
import { TimerFlotante } from "./TimerFlotante";
import { LockScreenProgress } from "./LockScreenProgress";
import confetti from "canvas-confetti";

interface EjercicioDetalle {
  id: number;
  orden: number;
  grupoNumero?: number | null;
  series: number;
  repeticiones: string;
  descansoSegundos: number | null;
  pesoSugerido: number | null;
  notas: string | null;
  ejercicio: {
    id: number;
    nombre: string;
    descripcion: string | null;
    grupoMuscular: string | null;
    imagenUrl: string | null;
    videoUrl: string | null;
  };
}

interface RutinaDia {
  id: number;
  diaNumero: number;
  nombreDia: string | null;
  rutinaId: number;
  rutina: {
    id: number;
    nombre: string;
    descripcion: string | null;
    ejercicios: EjercicioDetalle[];
  };
}

interface MiRutinaClientProps {
  usuario: MiRutinaData;
}

export function MiRutinaClient({ usuario }: MiRutinaClientProps) {
  const [activeDiaNumero, setActiveDiaNumero] = useState<number>(
    usuario.rutinasDias[0]?.diaNumero || 1
  );

  // Modal para registrar/modificar peso
  const [pesoModalEjercicio, setPesoModalEjercicio] = useState<{
    id: number;
    nombre: string;
    pesoActual: number;
  } | null>(null);
  const [nuevoPeso, setNuevoPeso] = useState<string>("");
  const [isSavingPeso, setIsSavingPeso] = useState(false);

  // Modal para ver gráfico de evolución histórica
  const [historialModalEjercicio, setHistorialModalEjercicio] = useState<{
    id: number;
    nombre: string;
  } | null>(null);

  // Modal para ver detalles, técnica, imagen y video del ejercicio
  const [ejercicioDetalleModal, setEjercicioDetalleModal] = useState<EjercicioDetalle["ejercicio"] | null>(null);

  // Estado de ejercicios completados hoy (Set de ejercicioId)
  const [completadosHoy, setCompletadosHoy] = useState<Set<number>>(
    () => new Set(usuario.ejerciciosCompletadosHoy || [])
  );
  const [loadingCompletadoId, setLoadingCompletadoId] = useState<number | null>(null);

  // Helper para clave de localStorage de series del día
  const getStorageKey = () => {
    const today = new Date().toISOString().split("T")[0];
    return `gym_series_${usuario.id}_${today}`;
  };

  const saveSeriesToStorage = (map: Record<number, number>) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(map));
    } catch {
      // Ignorar quota exceeded o modo incógnito
    }
  };

  // Estado del conteo de series completadas por ejercicio (ejercicioId -> número de series realizadas)
  const [seriesMap, setSeriesMap] = useState<Record<number, number>>(() => {
    const initialMap: Record<number, number> = {};

    // 1. Cargar series completadas desde el servidor si están disponibles
    if (usuario.seriesCompletadasHoy) {
      Object.assign(initialMap, usuario.seriesCompletadasHoy);
    }

    // 2. Si un ejercicio ya está completado hoy en DB, asegurar que tenga todas sus series
    const completadosSet = new Set(usuario.ejerciciosCompletadosHoy || []);
    for (const dia of usuario.rutinasDias) {
      for (const re of dia.rutina.ejercicios) {
        if (completadosSet.has(re.ejercicio.id)) {
          initialMap[re.ejercicio.id] = Math.max(1, re.series || 1);
        }
      }
    }

    return initialMap;
  });

  // Sincronizar en cliente con localStorage para restaurar series parciales de hoy
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const saved = localStorage.getItem(`gym_series_${usuario.id}_${today}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setSeriesMap((prev) => {
            const merged = { ...parsed, ...prev };
            // Asegurar que los completados hoy conserven todas sus series
            for (const dia of usuario.rutinasDias) {
              for (const re of dia.rutina.ejercicios) {
                if (completadosHoy.has(re.ejercicio.id)) {
                  merged[re.ejercicio.id] = Math.max(1, re.series || 1);
                }
              }
            }
            return merged;
          });
        }
      }
    } catch {
      // Ignorar error de parseo
    }
  }, [completadosHoy, usuario.id, usuario.rutinasDias]);

  const [pesosMap, setPesosMap] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    for (const ep of usuario.ejerciciosPersonalizados) {
      map[ep.ejercicioId] = ep.pesoActual;
    }
    return map;
  });

  const diaActual = usuario.rutinasDias.find(
    (d) => d.diaNumero === activeDiaNumero
  );

  const handleOpenPesoModal = (ejercicioId: number, nombre: string) => {
    const pesoActual = pesosMap[ejercicioId] || 0;
    setPesoModalEjercicio({ id: ejercicioId, nombre, pesoActual });
    setNuevoPeso(pesoActual > 0 ? String(pesoActual) : "");
  };

  const handleSavePeso = async () => {
    if (!pesoModalEjercicio) return;
    const pesoNum = parseFloat(nuevoPeso);
    if (isNaN(pesoNum) || pesoNum < 0) return;

    setIsSavingPeso(true);
    try {
      const res = await actualizarPesoEjercicio(pesoModalEjercicio.id, pesoNum);
      if (res.success) {
        setPesosMap((prev) => ({
          ...prev,
          [pesoModalEjercicio.id]: pesoNum,
        }));
        setPesoModalEjercicio(null);
      }
    } finally {
      setIsSavingPeso(false);
    }
  };

  // Disparar celebración con confeti en ráfaga
  const triggerConfettiCelebration = () => {
    try {
      // Primera ráfaga central
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ea580c", "#16a34a", "#38bdf8", "#fbbf24", "#f43f5e"],
      });

      // Ráfagas laterales retardadas para efecto fuegos artificiales
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#ea580c", "#16a34a", "#fbbf24"],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#38bdf8", "#16a34a", "#f43f5e"],
        });
      }, 250);
    } catch (e) {
      console.warn("No se pudo ejecutar confetti:", e);
    }
  };

  // Marcar/desmarcar serie individual de un ejercicio
  const handleToggleSerie = async (
    ejercicioId: number,
    serieNum: number,
    totalSeries: number
  ) => {
    const currentCount = seriesMap[ejercicioId] || 0;
    const isCurrentlyCompleted = completadosHoy.has(ejercicioId);
    const pesoActual = pesosMap[ejercicioId] || 0;

    let newCount: number;

    if (serieNum <= currentCount) {
      // Al hacer clic en una serie ya completada, desmarca esa serie y posteriores
      newCount = serieNum - 1;
    } else {
      // Al hacer clic en una serie pendiente, avanza hasta esa serie
      newCount = serieNum;
    }

    newCount = Math.max(0, Math.min(totalSeries, newCount));

    setSeriesMap((prev) => {
      const updated = { ...prev, [ejercicioId]: newCount };
      saveSeriesToStorage(updated);
      return updated;
    });

    // Caso 1: Se completó la última serie (o todas) y el ejercicio no estaba completo -> Marcar ejercicio completo
    if (newCount >= totalSeries && !isCurrentlyCompleted) {
      setLoadingCompletadoId(ejercicioId);
      try {
        const res = await toggleCompletarEjercicioHoy(ejercicioId, pesoActual, totalSeries);
        if (res.success && res.completado) {
          setCompletadosHoy((prev) => {
            const next = new Set(prev);
            next.add(ejercicioId);

            if (diaActual && diaActual.rutina.ejercicios.length > 0) {
              const todosCompletos = diaActual.rutina.ejercicios.every((re) =>
                next.has(re.ejercicio.id)
              );
              if (todosCompletos) {
                triggerConfettiCelebration();
              }
            }

            return next;
          });
        }
      } finally {
        setLoadingCompletadoId(null);
      }
    }
    // Caso 2: El ejercicio estaba completado pero se desmarcó una serie -> Desmarcar ejercicio completo
    else if (newCount < totalSeries && isCurrentlyCompleted) {
      setLoadingCompletadoId(ejercicioId);
      try {
        const res = await toggleCompletarEjercicioHoy(ejercicioId, pesoActual);
        if (res.success && !res.completado) {
          setCompletadosHoy((prev) => {
            const next = new Set(prev);
            next.delete(ejercicioId);
            return next;
          });
        }
      } finally {
        setLoadingCompletadoId(null);
      }
    }
  };

  // Marcar/desmarcar ejercicio completo de una vez (botón de acción directa)
  const handleToggleCompletado = async (
    ejercicioId: number,
    totalSeries: number
  ) => {
    setLoadingCompletadoId(ejercicioId);
    const pesoActual = pesosMap[ejercicioId] || 0;

    try {
      const res = await toggleCompletarEjercicioHoy(
        ejercicioId,
        pesoActual,
        totalSeries
      );
      if (res.success) {
        setCompletadosHoy((prev) => {
          const next = new Set(prev);
          if (res.completado) {
            next.add(ejercicioId);
          } else {
            next.delete(ejercicioId);
          }

          // Verificar si con este cambio se completaron TODOS los ejercicios del día actual (100%)
          if (res.completado && diaActual && diaActual.rutina.ejercicios.length > 0) {
            const todosCompletos = diaActual.rutina.ejercicios.every((re) =>
              next.has(re.ejercicio.id)
            );
            if (todosCompletos) {
              triggerConfettiCelebration();
            }
          }

          return next;
        });

        // Sincronizar series: si se completó de una vez, todas quedan completadas; si se desmarcó, a 0
        setSeriesMap((prev) => {
          const updated = {
            ...prev,
            [ejercicioId]: res.completado ? totalSeries : 0,
          };
          saveSeriesToStorage(updated);
          return updated;
        });
      }
    } finally {
      setLoadingCompletadoId(null);
    }
  };

  // Cantidad de ejercicios completados del día actual
  const totalEjerciciosDia = diaActual?.rutina.ejercicios.length || 0;
  const completadosDia = diaActual?.rutina.ejercicios.filter((re) =>
    completadosHoy.has(re.ejercicio.id)
  ).length || 0;

  // Agrupar visualmente los ejercicios que pertenecen al mismo grupo
  const bloquesEjercicios = useMemo(() => {
    if (!diaActual) return [];

    const result: Array<
      | { type: "group"; grupoNumero: number; ejercicios: EjercicioDetalle[] }
      | { type: "single"; ejercicio: EjercicioDetalle }
    > = [];

    const groupMap = new Map<number, EjercicioDetalle[]>();

    for (const re of diaActual.rutina.ejercicios) {
      if (re.grupoNumero && re.grupoNumero >= 1 && re.grupoNumero <= 10) {
        if (!groupMap.has(re.grupoNumero)) {
          const list = [re];
          groupMap.set(re.grupoNumero, list);
          result.push({
            type: "group",
            grupoNumero: re.grupoNumero,
            ejercicios: list,
          });
        } else {
          groupMap.get(re.grupoNumero)!.push(re);
        }
      } else {
        result.push({ type: "single", ejercicio: re });
      }
    }

    return result;
  }, [diaActual]);

  const renderEjercicioCard = (
    re: EjercicioDetalle,
    itemIndex: number,
    isInGroup: boolean = false
  ) => {
    const pesoActual = pesosMap[re.ejercicio.id] || 0;
    const isCompletadoHoy = completadosHoy.has(re.ejercicio.id);
    const totalSeries = Math.max(1, re.series || 1);
    const seriesHechas = isCompletadoHoy
      ? totalSeries
      : Math.min(totalSeries, Math.max(0, seriesMap[re.ejercicio.id] || 0));

    return (
      <div
        key={re.id}
        className={`rounded-xl border p-4 transition-all space-y-3.5 ${
          isCompletadoHoy
            ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/10 shadow-2xs"
            : isInGroup
              ? "border-border/80 bg-surface shadow-2xs hover:border-primary/40"
              : "border-border bg-surface-hover/30 hover:border-primary/40"
        }`}
      >
        {/* FILA SUPERIOR: Número de ejercicio + Tags de Grupo + Botón Info & Guía alineados */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-black text-xs transition-colors ${
                isCompletadoHoy
                  ? "bg-emerald-500 text-white"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {isCompletadoHoy ? "✓" : itemIndex}
            </span>

            {re.ejercicio.grupoMuscular && (
              <span className="rounded bg-surface px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-content-muted border border-border shadow-2xs">
                {re.ejercicio.grupoMuscular}
              </span>
            )}

            {re.grupoNumero && !isInGroup && (
              <span className="rounded bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary border border-primary/20 shadow-2xs">
                Grupo {re.grupoNumero}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setEjercicioDetalleModal(re.ejercicio)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-2.5 py-1 text-xs font-semibold transition-all hover:scale-105 cursor-pointer shadow-2xs shrink-0"
            title="Ver explicación completa, técnica, imagen y video"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Guía y Técnica</span>
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL: Título del ejercicio a ancho completo */}
        <div className="space-y-2">
          <h3
            className={`font-bold text-base sm:text-lg transition-colors leading-snug ${
              isCompletadoHoy
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-content"
            }`}
          >
            {re.ejercicio.nombre}
          </h3>

          {/* Métricas: Series, Repeticiones, Descanso y Peso Sugerido */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
            <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2.5 py-1 text-content border border-border font-medium shadow-2xs">
              <span className="text-primary font-bold">{re.series}</span> series
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2.5 py-1 text-content border border-border font-medium shadow-2xs">
              <span className="text-primary font-bold">{re.repeticiones}</span> reps
            </span>
            {re.descansoSegundos && (
              <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2.5 py-1 text-content-muted border border-border font-medium shadow-2xs">
                ⏱️ {re.descansoSegundos}s descanso
              </span>
            )}
            {re.pesoSugerido && (
              <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2.5 py-1 text-content-muted border border-border text-[11px] shadow-2xs">
                Sugerido: {re.pesoSugerido} kg
              </span>
            )}
          </div>
        </div>

        {/* SECCIÓN INTERACTIVA: Registro paso a paso de series */}
        <div className="rounded-xl border border-border/80 bg-surface/70 p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-content">Series:</span>
              <span className="font-black text-primary">
                {seriesHechas} de {totalSeries}
              </span>
              <span className="text-[11px] text-content-muted">
                ({Math.round((seriesHechas / totalSeries) * 100)}%)
              </span>
            </div>

            {isCompletadoHoy ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Ejercicio completado
              </span>
            ) : seriesHechas > 0 ? (
              <span className="text-[11px] font-medium text-content-muted">
                Falta{totalSeries - seriesHechas > 1 ? "n" : ""} {totalSeries - seriesHechas} serie{totalSeries - seriesHechas > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-[11px] text-content-muted">
                Tocá cada serie al terminarla
              </span>
            )}
          </div>

          {/* Botones de Series interactivas */}
          <div className="flex flex-wrap gap-2 items-center">
            {Array.from({ length: totalSeries }, (_, idx) => {
              const num = idx + 1;
              const isDone = num <= seriesHechas;
              const isNext = num === seriesHechas + 1 && !isCompletadoHoy;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleToggleSerie(re.ejercicio.id, num, totalSeries)}
                  disabled={loadingCompletadoId === re.ejercicio.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                    isDone
                      ? "bg-emerald-600 text-white border-emerald-700 dark:bg-emerald-500 dark:border-emerald-600 shadow-xs"
                      : isNext
                        ? "bg-primary/10 text-primary border-primary/40 hover:bg-primary/20 hover:scale-102"
                        : "bg-surface border-border text-content hover:bg-surface-hover hover:border-border/80"
                  }`}
                  title={
                    isDone
                      ? `Serie ${num} completada. Hacé clic para desmarcar.`
                      : num === totalSeries
                        ? `Serie ${num} (última). Al marcarla se completará el ejercicio automáticamente.`
                        : `Marcar Serie ${num} como completada.`
                  }
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black ${
                      isDone
                        ? "bg-white/20 text-white"
                        : isNext
                          ? "bg-primary text-primary-foreground"
                          : "bg-content-muted/20 text-content"
                    }`}
                  >
                    {isDone ? "✓" : num}
                  </span>
                  <span>Serie {num}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FILA INFERIOR: Botones de Acción en fila de ancho completo (Carga actual, Historial, Marcar Hecho) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border/50">
          {/* ACCIÓN 1: Carga actual / Modificar peso */}
          <button
            type="button"
            onClick={() => handleOpenPesoModal(re.ejercicio.id, re.ejercicio.nombre)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-content hover:bg-surface-hover hover:border-primary/40 transition-colors cursor-pointer shadow-2xs w-full"
            title="Modificar peso o carga de trabajo"
          >
            <span className="text-content-muted text-[11px] font-normal">Carga:</span>
            <span className={pesoActual > 0 ? "text-primary font-black" : "text-content-muted italic"}>
              {pesoActual > 0 ? `${pesoActual} kg` : "0 kg"}
            </span>
            <svg className="h-3 w-3 text-content-muted ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          {/* ACCIÓN 2: Ver historial de carga con gráfico */}
          <button
            type="button"
            onClick={() =>
              setHistorialModalEjercicio({
                id: re.ejercicio.id,
                nombre: re.ejercicio.nombre,
              })
            }
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-content hover:bg-surface-hover hover:border-primary/40 transition-colors cursor-pointer shadow-2xs w-full"
            title="Ver evolución y gráfico de suba de carga"
          >
            <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <span>Historial</span>
          </button>

          {/* ACCIÓN 3: Botón para completar todo el ejercicio de una vez o desmarcarlo */}
          <button
            type="button"
            onClick={() => handleToggleCompletado(re.ejercicio.id, totalSeries)}
            disabled={loadingCompletadoId === re.ejercicio.id}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer shadow-2xs w-full ${
              isCompletadoHoy
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-surface border border-border text-content hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/40"
            }`}
            title={
              isCompletadoHoy
                ? "Completado hoy. Hacé clic para desmarcar y reiniciar series."
                : "Completar todo el ejercicio de una vez (marca todas las series y guarda registro)."
            }
          >
            {loadingCompletadoId === re.ejercicio.id ? (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isCompletadoHoy ? (
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
              </svg>
            )}
            <span>{isCompletadoHoy ? "Completado" : "Completar Todo"}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Selector de Días de Entrenamiento */}
      {usuario.rutinasDias.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-content-muted mr-2">
            Días del Plan:
          </span>
          {usuario.rutinasDias.map((d) => (
            <button
              key={d.diaNumero}
              type="button"
              onClick={() => setActiveDiaNumero(d.diaNumero)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeDiaNumero === d.diaNumero
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface border border-border text-content hover:bg-surface-hover hover:border-content-muted/40"
                }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black ${activeDiaNumero === d.diaNumero
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-primary/20 text-primary"
                  }`}
              >
                {d.diaNumero}
              </span>
              <span>{d.nombreDia || `Día ${d.diaNumero}`}</span>
            </button>
          ))}
        </div>
      ) : null}

      {/* Contenido del Día Seleccionado o Estado Vacío */}
      {!diaActual ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-content">
            Aún no tenés una rutina asignada
          </h3>
          <p className="text-sm text-content-muted max-w-md mx-auto">
            {usuario.plan
              ? `Estás suscripto al plan ${usuario.plan.nombre} (${usuario.plan.diasPorSemana} días por semana). Tu entrenador te asignará una plantilla acorde en tu próxima visita.`
              : "No tenés un plan de membresía activo en este momento. Consultá en recepción para darte de alta."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-6">
          {/* Cabecera de la Rutina del Día */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-black text-primary-foreground">
                  {diaActual.diaNumero}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {diaActual.nombreDia || `Día ${diaActual.diaNumero}`}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-content mt-1">
                {diaActual.rutina.nombre}
              </h2>
              {diaActual.rutina.descripcion && (
                <p className="text-sm text-content-muted mt-1 max-w-2xl">
                  {diaActual.rutina.descripcion}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={completadosDia === totalEjerciciosDia && totalEjerciciosDia > 0 ? "success" : "primary"}>
                  {completadosDia} de {totalEjerciciosDia} completados hoy
                </Badge>
                <LockScreenProgress
                  completados={completadosDia}
                  total={totalEjerciciosDia}
                  rutinaNombre={diaActual.rutina.nombre}
                  diaNumero={diaActual.diaNumero}
                />
              </div>

              {/* Barra de Progreso del Día */}
              {totalEjerciciosDia > 0 && (
                <div className="w-40 sm:w-48 bg-surface-hover rounded-full h-2 overflow-hidden border border-border/60">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(completadosDia / totalEjerciciosDia) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Listado de Ejercicios */}
          <div className="space-y-4">
            {bloquesEjercicios.map((bloque) => {
              if (bloque.type === "group") {
                return (
                  <div
                    key={`bloque-grupo-${bloque.grupoNumero}`}
                    className="rounded-2xl border-2 border-primary/30 bg-primary/[0.03] dark:bg-primary/[0.06] p-4 sm:p-5 space-y-4 shadow-2xs transition-all"
                  >
                    {/* Cabecera del Grupo */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground shadow-xs">
                          G{bloque.grupoNumero}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-extrabold text-content uppercase tracking-wider">
                              Grupo {bloque.grupoNumero}
                            </h3>
                            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary border border-primary/20">
                              {bloque.ejercicios.length === 1
                                ? "1 ejercicio"
                                : `${bloque.ejercicios.length} ejercicios combinados`}
                            </span>
                          </div>
                          <p className="text-[11px] text-content-muted mt-0.5">
                            ⚡ <strong>Hacer juntos:</strong> Realizá estos ejercicios de forma consecutiva (superserie / circuito sin descanso intermedio).
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                        🔗 En bloque
                      </span>
                    </div>

                    {/* Ejercicios del grupo */}
                    <div className="space-y-3 pl-2 sm:pl-3 border-l-2 border-primary/40">
                      {bloque.ejercicios.map((re) => {
                        const globalIndex =
                          diaActual.rutina.ejercicios.findIndex((e) => e.id === re.id) + 1;
                        return renderEjercicioCard(re, globalIndex, true);
                      })}
                    </div>
                  </div>
                );
              } else {
                const globalIndex =
                  diaActual.rutina.ejercicios.findIndex(
                    (e) => e.id === bloque.ejercicio.id
                  ) + 1;
                return renderEjercicioCard(bloque.ejercicio, globalIndex, false);
              }
            })}
          </div>
        </div>
      )}

      {/* Modal para registrar carga/peso */}
      <Modal
        isOpen={Boolean(pesoModalEjercicio)}
        onClose={() => setPesoModalEjercicio(null)}
        title="Registrar Carga de Trabajo"
        description={
          pesoModalEjercicio
            ? `Ingresá el peso actual que estás levantando en ${pesoModalEjercicio.nombre}.`
            : ""
        }
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPesoModalEjercicio(null)}
              disabled={isSavingPeso}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSavePeso}
              isLoading={isSavingPeso}
            >
              Guardar Carga
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-content mb-1.5">
              Peso en Kilogramos (kg)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                value={nuevoPeso}
                onChange={(e) => setNuevoPeso(e.target.value)}
                placeholder="Ej: 45.5"
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                autoFocus
              />
              <span className="absolute right-3.5 top-2 text-sm font-semibold text-content-muted pointer-events-none">
                kg
              </span>
            </div>
            <p className="text-[11px] text-content-muted mt-1">
              Este valor quedará guardado para tus próximas sesiones y registrará un nuevo punto en tu historial de evolución.
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal interactivo con gráfico de historial de carga */}
      <HistorialGraficoModal
        isOpen={Boolean(historialModalEjercicio)}
        onClose={() => setHistorialModalEjercicio(null)}
        ejercicio={historialModalEjercicio}
        pesoActual={historialModalEjercicio ? pesosMap[historialModalEjercicio.id] || 0 : 0}
      />

      {/* Modal de Explicación Completa, Técnica, Imagen y Video */}
      <EjercicioDetalleModal
        isOpen={Boolean(ejercicioDetalleModal)}
        onClose={() => setEjercicioDetalleModal(null)}
        ejercicio={ejercicioDetalleModal}
      />

      {/* Timer / Cronómetro Flotante para Descansos */}
      <TimerFlotante initialSeconds={60} />
    </div>
  );
}
