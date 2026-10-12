"use client";

import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { actualizarPesoEjercicio, toggleCompletarEjercicioHoy, MiRutinaData } from "./actions";
import { HistorialGraficoModal } from "@/app/mi-rutina/HistorialGraficoModal";

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

  // Estado de ejercicios completados hoy (Set de ejercicioId)
  const [completadosHoy, setCompletadosHoy] = useState<Set<number>>(
    () => new Set(usuario.ejerciciosCompletadosHoy || [])
  );
  const [loadingCompletadoId, setLoadingCompletadoId] = useState<number | null>(null);

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

  // Toggle completar ejercicio hoy
  const handleToggleCompletado = async (ejercicioId: number) => {
    setLoadingCompletadoId(ejercicioId);
    const pesoActual = pesosMap[ejercicioId] || 0;

    try {
      const res = await toggleCompletarEjercicioHoy(ejercicioId, pesoActual);
      if (res.success) {
        setCompletadosHoy((prev) => {
          const next = new Set(prev);
          if (res.completado) {
            next.add(ejercicioId);
          } else {
            next.delete(ejercicioId);
          }
          return next;
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

    return (
      <div
        key={re.id}
        className={`rounded-xl border p-4 space-y-3 transition-all ${
          isCompletadoHoy
            ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/10 shadow-2xs"
            : isInGroup
              ? "border-border/80 bg-surface shadow-2xs hover:border-primary/40"
              : "border-border bg-surface-hover/30 hover:border-primary/40"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* PARTE IZQUIERDA: Nombre, Grupo Muscular, Descripción y (Series, Reps, Descanso) */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-black text-sm transition-colors ${
                isCompletadoHoy
                  ? "bg-emerald-500 text-white"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {isCompletadoHoy ? "✓" : itemIndex}
            </span>

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`font-bold text-base transition-colors ${
                    isCompletadoHoy
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-content"
                  }`}
                >
                  {re.ejercicio.nombre}
                </h3>
                {re.ejercicio.grupoMuscular && (
                  <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-bold uppercase text-content-muted border border-border">
                    {re.ejercicio.grupoMuscular}
                  </span>
                )}
                {re.grupoNumero && !isInGroup && (
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary border border-primary/20">
                    Grupo {re.grupoNumero}
                  </span>
                )}
              </div>

              {re.ejercicio.descripcion && (
                <p className="text-xs text-content-muted whitespace-pre-line line-clamp-2">
                  {re.ejercicio.descripcion}
                </p>
              )}

              {/* Series, Repeticiones y Descanso a la izquierda bajo el nombre */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
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
          </div>

          {/* PARTE DERECHA: Espacio ampliado con los 3 botones de acción */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 justify-end pt-2 lg:pt-0 border-t border-border/40 lg:border-t-0 pl-11 lg:pl-0">
            {/* ACCIÓN 1: Carga actual / Modificar peso */}
            <button
              type="button"
              onClick={() => handleOpenPesoModal(re.ejercicio.id, re.ejercicio.nombre)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-content hover:bg-surface-hover hover:border-primary/40 transition-colors cursor-pointer shadow-2xs"
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
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-content hover:bg-surface-hover hover:border-primary/40 transition-colors cursor-pointer shadow-2xs"
              title="Ver evolución y gráfico de suba de carga"
            >
              <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <span>Historial</span>
            </button>

            {/* ACCIÓN 3: Botón Toggle para marcar como completado hoy */}
            <button
              type="button"
              onClick={() => handleToggleCompletado(re.ejercicio.id)}
              disabled={loadingCompletadoId === re.ejercicio.id}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                isCompletadoHoy
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-surface border border-border text-content hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/40"
              }`}
              title={
                isCompletadoHoy
                  ? "Completado hoy. Hacé clic para desmarcar y borrar del historial de hoy."
                  : "Marcar como completado hoy y guardar registro en el historial."
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
              <span>{isCompletadoHoy ? "Completado" : "Marcar Hecho"}</span>
            </button>
          </div>
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

            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Badge variant={completadosDia === totalEjerciciosDia && totalEjerciciosDia > 0 ? "success" : "primary"}>
                  {completadosDia} de {totalEjerciciosDia} completados hoy
                </Badge>
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
    </div>
  );
}
