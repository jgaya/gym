"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GRUPOS_MUSCULARES } from "../ejercicios/constants";
import {
  RutinaItem,
  RutinaFormData,
  RutinaEjercicioConfig,
  crearRutina,
  actualizarRutina,
} from "./actions";

interface EjercicioSelectorItem {
  id: number;
  nombre: string;
  grupoMuscular: string | null;
}

interface RutinaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  rutina?: RutinaItem | null;
  ejerciciosDisponibles: EjercicioSelectorItem[];
  onSuccess: () => void;
}

export function RutinaFormModal({
  isOpen,
  onClose,
  rutina,
  ejerciciosDisponibles,
  onSuccess,
}: RutinaFormModalProps) {
  const isEditing = Boolean(rutina);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [esTemplate, setEsTemplate] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Lista de ejercicios configurados en la rutina
  const [ejerciciosSeleccionados, setEjerciciosSeleccionados] = useState<
    RutinaEjercicioConfig[]
  >([]);

  // Filtros del buscador de ejercicios
  const [busquedaEjercicio, setBusquedaEjercicio] = useState("");
  const [grupoFiltro, setGrupoFiltro] = useState<string>("ALL");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Inicializar formulario al abrir o cambiar rutina
  useEffect(() => {
    if (rutina) {
      setNombre(rutina.nombre || "");
      setDescripcion(rutina.descripcion || "");
      setEsTemplate(rutina.esTemplate ?? false);
      setIsActive(rutina.isActive ?? true);
      setEjerciciosSeleccionados(
        rutina.ejercicios.map((re) => ({
          ejercicioId: re.ejercicioId,
          nombre: re.ejercicio.nombre,
          grupoMuscular: re.ejercicio.grupoMuscular,
          grupoNumero: re.grupoNumero ?? null,
          orden: re.orden,
          series: re.series,
          repeticiones: re.repeticiones,
          descansoSegundos: re.descansoSegundos ?? 60,
          pesoSugerido: re.pesoSugerido ?? null,
          notas: re.notas ?? null,
        }))
      );
    } else {
      setNombre("");
      setDescripcion("");
      setEsTemplate(false);
      setIsActive(true);
      setEjerciciosSeleccionados([]);
    }
    setBusquedaEjercicio("");
    setGrupoFiltro("ALL");
    setErrors({});
    setGeneralError(null);
  }, [rutina, isOpen]);

  // Set con IDs actualmente seleccionados para chequeo O(1)
  const idsSeleccionados = useMemo(
    () => new Set(ejerciciosSeleccionados.map((e) => e.ejercicioId)),
    [ejerciciosSeleccionados]
  );

  // Filtrado de ejercicios disponibles
  const ejerciciosFiltrados = useMemo(() => {
    const q = busquedaEjercicio.toLowerCase().trim();
    return ejerciciosDisponibles.filter((ej) => {
      const matchGrupo = grupoFiltro === "ALL" || ej.grupoMuscular === grupoFiltro;
      const matchBusqueda =
        !q ||
        ej.nombre.toLowerCase().includes(q) ||
        (ej.grupoMuscular && ej.grupoMuscular.toLowerCase().includes(q));
      return matchGrupo && matchBusqueda;
    });
  }, [ejerciciosDisponibles, busquedaEjercicio, grupoFiltro]);

  // Alternar selección de un ejercicio individual
  const toggleEjercicio = (ej: EjercicioSelectorItem) => {
    if (idsSeleccionados.has(ej.id)) {
      setEjerciciosSeleccionados((prev) =>
        prev.filter((item) => item.ejercicioId !== ej.id)
      );
    } else {
      setEjerciciosSeleccionados((prev) => [
        ...prev,
        {
          ejercicioId: ej.id,
          nombre: ej.nombre,
          grupoMuscular: ej.grupoMuscular,
          grupoNumero: null,
          orden: prev.length + 1,
          series: 4,
          repeticiones: "10",
          descansoSegundos: 60,
          pesoSugerido: null,
          notas: null,
        },
      ]);
    }
  };

  // Seleccionar todos los visibles en el filtro actual
  const handleSelectAllFiltered = () => {
    const nuevos: RutinaEjercicioConfig[] = [];
    ejerciciosFiltrados.forEach((ej) => {
      if (!idsSeleccionados.has(ej.id)) {
        nuevos.push({
          ejercicioId: ej.id,
          nombre: ej.nombre,
          grupoMuscular: ej.grupoMuscular,
          grupoNumero: null,
          orden: ejerciciosSeleccionados.length + nuevos.length + 1,
          series: 4,
          repeticiones: "10",
          descansoSegundos: 60,
          pesoSugerido: null,
          notas: null,
        });
      }
    });

    if (nuevos.length > 0) {
      setEjerciciosSeleccionados((prev) => [...prev, ...nuevos]);
    }
  };

  // Quitar todos los seleccionados
  const handleClearAll = () => {
    setEjerciciosSeleccionados([]);
  };

  // Actualizar valores de series o repeticiones de un ejercicio configurado
  const updateEjercicioConfig = <K extends keyof RutinaEjercicioConfig>(
    ejercicioId: number,
    field: K,
    value: RutinaEjercicioConfig[K]
  ) => {
    setEjerciciosSeleccionados((prev) =>
      prev.map((item) => {
        if (item.ejercicioId === ejercicioId) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Agrupar visualmente los ejercicios que comparten el mismo número de grupo
  const itemsAgrupados = useMemo(() => {
    const result: Array<
      | { type: "group"; grupoNumero: number; items: RutinaEjercicioConfig[] }
      | { type: "single"; item: RutinaEjercicioConfig }
    > = [];

    const groupMap = new Map<number, RutinaEjercicioConfig[]>();

    for (const item of ejerciciosSeleccionados) {
      if (item.grupoNumero && item.grupoNumero >= 1 && item.grupoNumero <= 10) {
        if (!groupMap.has(item.grupoNumero)) {
          const list = [item];
          groupMap.set(item.grupoNumero, list);
          result.push({
            type: "group",
            grupoNumero: item.grupoNumero,
            items: list,
          });
        } else {
          groupMap.get(item.grupoNumero)!.push(item);
        }
      } else {
        result.push({ type: "single", item });
      }
    }

    return result;
  }, [ejerciciosSeleccionados]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nombre.trim()) {
      newErrors.nombre = "El nombre de la rutina es obligatorio";
    }
    if (ejerciciosSeleccionados.length === 0) {
      newErrors.ejercicios = "Debes seleccionar al menos un ejercicio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGeneralError(null);

    // Ordenar los ejercicios respetando los grupos creados
    const ejerciciosParaGuardar: RutinaEjercicioConfig[] = [];
    let contadorOrden = 1;

    for (const bloque of itemsAgrupados) {
      if (bloque.type === "group") {
        for (const ej of bloque.items) {
          ejerciciosParaGuardar.push({
            ...ej,
            orden: contadorOrden++,
          });
        }
      } else {
        ejerciciosParaGuardar.push({
          ...bloque.item,
          orden: contadorOrden++,
        });
      }
    }

    const payload: RutinaFormData = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      esTemplate,
      isActive,
      ejercicios: ejerciciosParaGuardar,
    };

    try {
      let result;
      if (isEditing && rutina) {
        result = await actualizarRutina(rutina.id, payload);
      } else {
        result = await crearRutina(payload);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setGeneralError(result.error || "Ocurrió un error al guardar la rutina");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderEjercicioCard = (
    item: RutinaEjercicioConfig,
    indexNumber: number,
    isInGroup: boolean = false
  ) => (
    <div
      key={item.ejercicioId}
      className={`rounded-lg border p-2.5 space-y-2 text-xs transition-colors ${
        isInGroup
          ? "border-primary/20 bg-surface shadow-2xs"
          : "border-border bg-surface-hover/40"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">
            {indexNumber}
          </span>
          <span className="font-semibold text-content truncate">
            {item.nombre}
          </span>
          {item.grupoMuscular && (
            <span className="shrink-0 text-[10px] text-content-muted font-medium bg-surface-hover px-1.5 py-0.5 rounded border border-border">
              {item.grupoMuscular}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Select de Grupo (1 al 10) al costado del ejercicio */}
          <div
            className="flex items-center gap-1 bg-surface border border-border rounded px-2 py-0.5"
            title="Asignar número de grupo para hacer juntos (1 al 10)"
          >
            <span className="text-[10px] font-bold text-content-muted uppercase">
              Grupo:
            </span>
            <select
              value={item.grupoNumero ?? ""}
              onChange={(e) =>
                updateEjercicioConfig(
                  item.ejercicioId,
                  "grupoNumero",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="bg-transparent text-xs font-black text-primary focus:outline-none cursor-pointer"
            >
              <option value="">-</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() =>
              setEjerciciosSeleccionados((prev) =>
                prev.filter((e) => e.ejercicioId !== item.ejercicioId)
              )
            }
            className="text-content-muted hover:text-red-500 p-0.5 rounded cursor-pointer"
            title="Quitar de la rutina"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Inputs compactos de Series, Reps y Descanso */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-content-muted uppercase">
            Series
          </label>
          <select
            value={item.series}
            onChange={(e) =>
              updateEjercicioConfig(
                item.ejercicioId,
                "series",
                Number(e.target.value)
              )
            }
            className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-content focus:border-primary focus:outline-none cursor-pointer"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "serie" : "series"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-content-muted uppercase">
            Reps
          </label>
          <input
            type="text"
            value={item.repeticiones}
            onChange={(e) =>
              updateEjercicioConfig(
                item.ejercicioId,
                "repeticiones",
                e.target.value
              )
            }
            placeholder="10"
            className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-content focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-content-muted uppercase">
            Descanso (s)
          </label>
          <input
            type="number"
            step="5"
            min="0"
            value={item.descansoSegundos ?? 60}
            onChange={(e) =>
              updateEjercicioConfig(
                item.ejercicioId,
                "descansoSegundos",
                Number(e.target.value)
              )
            }
            className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-content focus:border-primary focus:outline-none"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Modificar Rutina: ${rutina?.nombre}` : "Crear Nueva Rutina"}
      description="Armá la rutina seleccionando ejercicios y configurando series y repeticiones."
      maxWidth="5xl"
      footer={
        <>
          <div className="flex-1 text-left text-xs font-medium text-content-muted">
            {ejerciciosSeleccionados.length}{" "}
            {ejerciciosSeleccionados.length === 1 ? "ejercicio seleccionado" : "ejercicios seleccionados"}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {isEditing ? "Guardar Cambios" : "Crear Rutina"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {generalError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
            {generalError}
          </div>
        )}

        {/* Datos Principales de la Rutina */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nombre de la Rutina"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            error={errors.nombre}
            placeholder="Ej: Día 1 - Pecho y Tríceps Hipertrofia"
            required
          />

          <div className="w-full space-y-1.5">
            <label
              htmlFor="rutina-descripcion"
              className="block text-xs font-semibold uppercase tracking-wider text-content"
            >
              Descripción / Objetivo de la Rutina
            </label>
            <textarea
              id="rutina-descripcion"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Rutina de fuerza y acondicionamiento general, foco en patrones de empuje..."
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-content placeholder:text-content-muted transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary hover:border-content-muted/50 resize-y"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-1">
          <label className="flex items-center gap-2 text-sm font-medium text-content cursor-pointer">
            <input
              type="checkbox"
              checked={esTemplate}
              onChange={(e) => setEsTemplate(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <span>Definir como Plantilla (Template reutilizable)</span>
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-content cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <span>Rutina activa</span>
          </label>
        </div>

        {/* Separador */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-content">
              Ejercicios de la Rutina
            </h3>
            {errors.ejercicios && (
              <span className="text-xs font-semibold text-red-500">
                {errors.ejercicios}
              </span>
            )}
          </div>

          {/* Selector de Dos Columnas */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Columna Izquierda: Filtro y Selección Masiva de Ejercicios */}
            <div className="lg:col-span-6 flex flex-col rounded-xl border border-border bg-surface p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content">
                  Catálogo ({ejerciciosDisponibles.length})
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  + Seleccionar visibles
                </button>
              </div>

              {/* Buscador de ejercicios */}
              <input
                type="text"
                value={busquedaEjercicio}
                onChange={(e) => setBusquedaEjercicio(e.target.value)}
                placeholder="Filtrar por nombre o músculo..."
                className="w-full rounded-lg border border-border bg-surface-hover/50 px-3 py-1.5 text-xs text-content placeholder:text-content-muted focus:outline-none focus:ring-1 focus:ring-primary"
              />

              {/* Chips rápidos de grupos musculares */}
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pb-1">
                <button
                  type="button"
                  onClick={() => setGrupoFiltro("ALL")}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                    grupoFiltro === "ALL"
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-hover text-content-muted hover:text-content"
                  }`}
                >
                  Todos
                </button>
                {GRUPOS_MUSCULARES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrupoFiltro(g)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                      grupoFiltro === g
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-hover text-content-muted hover:text-content"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Lista scrolleable con Checkboxes */}
              <div className="h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/40">
                {ejerciciosFiltrados.length === 0 ? (
                  <p className="text-center text-xs text-content-muted py-8">
                    No hay ejercicios coincidentes
                  </p>
                ) : (
                  ejerciciosFiltrados.map((ej) => {
                    const isChecked = idsSeleccionados.has(ej.id);
                    return (
                      <label
                        key={ej.id}
                        onClick={() => toggleEjercicio(ej)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors pt-2 ${
                          isChecked
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-surface-hover"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Manejado por onClick del label
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                          />
                          <span
                            className={`text-xs font-medium ${
                              isChecked ? "text-primary font-bold" : "text-content"
                            }`}
                          >
                            {ej.nombre}
                          </span>
                        </div>
                        {ej.grupoMuscular && (
                          <span className="text-[10px] text-content-muted font-semibold bg-surface-hover px-1.5 py-0.5 rounded">
                            {ej.grupoMuscular}
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Columna Derecha: Ejercicios Seleccionados y Configuración */}
            <div className="lg:col-span-6 flex flex-col rounded-xl border border-border bg-surface p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content">
                  En la Rutina ({ejerciciosSeleccionados.length})
                </span>
                {ejerciciosSeleccionados.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-semibold text-red-500 hover:underline cursor-pointer"
                  >
                    Quitar todos
                  </button>
                )}
              </div>

              <div className="h-[345px] overflow-y-auto space-y-2.5 pr-1">
                {itemsAgrupados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-content-muted">
                    <span className="text-2xl mb-1">📋</span>
                    <p className="text-xs font-medium">Ningún ejercicio seleccionado</p>
                    <p className="text-[11px] text-content-muted/70 mt-0.5">
                      Marcá las casillas de la izquierda para agregar ejercicios a esta rutina.
                    </p>
                  </div>
                ) : (
                  itemsAgrupados.map((bloque) => {
                    if (bloque.type === "group") {
                      return (
                        <div
                          key={`grupo-box-${bloque.grupoNumero}`}
                          className="rounded-xl border-2 border-primary/30 bg-primary/5 p-2.5 space-y-2 transition-all shadow-xs"
                        >
                          <div className="flex items-center justify-between border-b border-primary/20 pb-1.5 px-0.5">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-black text-primary-foreground">
                                G{bloque.grupoNumero}
                              </span>
                              <span className="text-xs font-extrabold uppercase tracking-wide text-primary">
                                Grupo {bloque.grupoNumero} ({bloque.items.length}{" "}
                                {bloque.items.length === 1 ? "ejercicio" : "ejercicios juntos"})
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                              Hacer juntos
                            </span>
                          </div>

                          <div className="space-y-2 pl-2 border-l-2 border-primary/40">
                            {bloque.items.map((item) => {
                              const overallIdx =
                                ejerciciosSeleccionados.findIndex(
                                  (e) => e.ejercicioId === item.ejercicioId
                                ) + 1;
                              return renderEjercicioCard(item, overallIdx, true);
                            })}
                          </div>
                        </div>
                      );
                    } else {
                      const overallIdx =
                        ejerciciosSeleccionados.findIndex(
                          (e) => e.ejercicioId === bloque.item.ejercicioId
                        ) + 1;
                      return renderEjercicioCard(bloque.item, overallIdx, false);
                    }
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
