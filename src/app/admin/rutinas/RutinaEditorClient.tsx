"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  RutinaCompletaEditable,
  RutinaDiaConfig,
  RutinaEjercicioConfig,
  guardarRutinaCompleta,
  getEjerciciosDeRutina,
} from "./actions";

interface PlanOption {
  id: number;
  nombre: string;
  diasPorSemana: number;
}

interface EjercicioSelectorItem {
  id: number;
  nombre: string;
  grupoMuscular: string | null;
}

interface RutinaSelectorItem {
  id: number;
  nombre: string;
  totalEjercicios: number;
}

interface RutinaEditorClientProps {
  initialData?: RutinaCompletaEditable | null;
  planes: PlanOption[];
  ejerciciosDisponibles: EjercicioSelectorItem[];
  rutinasExistentes: RutinaSelectorItem[];
}

export function RutinaEditorClient({
  initialData,
  planes,
  ejerciciosDisponibles,
  rutinasExistentes,
}: RutinaEditorClientProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData);

  // Estado general de la rutina
  const [nombre, setNombre] = useState(initialData?.nombre || "");
  const [descripcion, setDescripcion] = useState(initialData?.descripcion || "");
  const [planId, setPlanId] = useState<number>(
    initialData?.planId || planes[0]?.id || 1
  );
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);

  // Determinar cantidad de días según el plan seleccionado
  const selectedPlan = planes.find((p) => p.id === Number(planId));
  const diasPorSemana = selectedPlan?.diasPorSemana || 3;

  // Inicializar días de entrenamiento
  const [dias, setDias] = useState<RutinaDiaConfig[]>(() => {
    if (initialData && initialData.dias.length > 0) {
      return initialData.dias.map((d) => ({
        diaNumero: d.diaNumero,
        nombreDia: d.nombreDia,
        rutinaIdExistente: d.rutinaId,
        ejercicios: d.ejercicios || [],
      }));
    }

    return Array.from({ length: diasPorSemana }, (_, i) => ({
      diaNumero: i + 1,
      nombreDia: `Día ${i + 1}`,
      rutinaIdExistente: null,
      ejercicios: [],
    }));
  });

  // Día activo seleccionado en el editor (índice 0..N-1)
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Estados del selector de ejercicios en línea
  const [isExerciseDrawerOpen, setIsExerciseDrawerOpen] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("ALL");

  // Estado para importar rutina existente en el día actual
  const [selectedRutinaToImport, setSelectedRutinaToImport] = useState<number | "">("");
  const [isImporting, startImportTransition] = useTransition();

  // Estados de guardado y feedback
  const [isSaving, startSavingTransition] = useTransition();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sincronizar cantidad de días si el usuario cambia de plan
  const handlePlanChange = (newPlanId: number) => {
    setPlanId(newPlanId);
    const plan = planes.find((p) => p.id === newPlanId);
    const count = plan ? plan.diasPorSemana : 3;

    setDias((prev) => {
      const next: RutinaDiaConfig[] = [];
      for (let i = 1; i <= count; i++) {
        const existente = prev.find((d) => d.diaNumero === i);
        if (existente) {
          next.push(existente);
        } else {
          next.push({
            diaNumero: i,
            nombreDia: `Día ${i}`,
            rutinaIdExistente: null,
            ejercicios: [],
          });
        }
      }
      return next;
    });

    if (activeDayIndex >= count) {
      setActiveDayIndex(0);
    }
  };

  const currentDia = dias[activeDayIndex] || dias[0];

  // Actualizar nombre del día activo
  const handleDayNameChange = (newName: string) => {
    setDias((prev) =>
      prev.map((d, idx) =>
        idx === activeDayIndex ? { ...d, nombreDia: newName } : d
      )
    );
  };

  // Cargar ejercicios de una rutina existente en el día activo
  const handleImportRutina = () => {
    if (!selectedRutinaToImport) return;

    startImportTransition(async () => {
      const ejercicios = await getEjerciciosDeRutina(Number(selectedRutinaToImport));
      if (ejercicios && ejercicios.length > 0) {
        setDias((prev) =>
          prev.map((d, idx) =>
            idx === activeDayIndex
              ? {
                  ...d,
                  rutinaIdExistente: Number(selectedRutinaToImport),
                  ejercicios: ejercicios.map((ej, index) => ({
                    ...ej,
                    orden: index + 1,
                  })),
                }
              : d
          )
        );
        setSelectedRutinaToImport("");
      }
    });
  };

  // Agregar un ejercicio al día activo
  const handleAddExerciseToCurrentDay = (ej: EjercicioSelectorItem) => {
    const yaExiste = currentDia.ejercicios.some((e) => e.ejercicioId === ej.id);
    if (yaExiste) return;

    const nuevoEjercicio: RutinaEjercicioConfig = {
      ejercicioId: ej.id,
      nombre: ej.nombre,
      grupoMuscular: ej.grupoMuscular,
      grupoNumero: null,
      orden: currentDia.ejercicios.length + 1,
      series: 4,
      repeticiones: "10-12",
      descansoSegundos: 60,
      pesoSugerido: null,
      notas: null,
    };

    setDias((prev) =>
      prev.map((d, idx) =>
        idx === activeDayIndex
          ? {
              ...d,
              rutinaIdExistente: null, // Al personalizar, se vuelve una rutina propia
              ejercicios: [...d.ejercicios, nuevoEjercicio],
            }
          : d
      )
    );
  };

  // Remover ejercicio del día activo
  const handleRemoveExercise = (ejercicioId: number) => {
    setDias((prev) =>
      prev.map((d, idx) => {
        if (idx !== activeDayIndex) return d;
        const filtrados = d.ejercicios.filter((e) => e.ejercicioId !== ejercicioId);
        return {
          ...d,
          rutinaIdExistente: null,
          ejercicios: filtrados.map((e, index) => ({ ...e, orden: index + 1 })),
        };
      })
    );
  };

  // Actualizar un campo de un ejercicio en el día activo
  const handleUpdateExerciseField = (
    ejercicioId: number,
    field: keyof RutinaEjercicioConfig,
    value: any
  ) => {
    setDias((prev) =>
      prev.map((d, idx) => {
        if (idx !== activeDayIndex) return d;
        return {
          ...d,
          rutinaIdExistente: null,
          ejercicios: d.ejercicios.map((e) =>
            e.ejercicioId === ejercicioId ? { ...e, [field]: value } : e
          ),
        };
      })
    );
  };

  // Mover ejercicio arriba o abajo
  const handleMoveExercise = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentDia.ejercicios.length) return;

    setDias((prev) =>
      prev.map((d, idx) => {
        if (idx !== activeDayIndex) return d;
        const list = [...d.ejercicios];
        const [moved] = list.splice(index, 1);
        list.splice(targetIndex, 0, moved);
        return {
          ...d,
          rutinaIdExistente: null,
          ejercicios: list.map((e, i) => ({ ...e, orden: i + 1 })),
        };
      })
    );
  };

  // Grupos musculares únicos disponibles para el filtro
  const uniqueMuscles = useMemo(() => {
    const set = new Set<string>();
    ejerciciosDisponibles.forEach((ej) => {
      if (ej.grupoMuscular) set.add(ej.grupoMuscular);
    });
    return Array.from(set).sort();
  }, [ejerciciosDisponibles]);

  // Ejercicios filtrados para el buscador
  const filteredEjercicios = useMemo(() => {
    const q = exerciseSearch.toLowerCase().trim();
    return ejerciciosDisponibles.filter((ej) => {
      const matchGrupo = muscleFilter === "ALL" || ej.grupoMuscular === muscleFilter;
      const matchSearch =
        !q ||
        ej.nombre.toLowerCase().includes(q) ||
        (ej.grupoMuscular && ej.grupoMuscular.toLowerCase().includes(q));
      return matchGrupo && matchSearch;
    });
  }, [ejerciciosDisponibles, exerciseSearch, muscleFilter]);

  // Set con IDs ya agregados en el día actual
  const addedIdsInCurrentDay = useMemo(() => {
    return new Set(currentDia?.ejercicios.map((e) => e.ejercicioId) || []);
  }, [currentDia]);

  // Total de ejercicios en toda la rutina
  const totalEjercicios = useMemo(() => {
    return dias.reduce((sum, d) => sum + (d.ejercicios?.length || 0), 0);
  }, [dias]);

  // Manejar guardado final
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!nombre.trim()) {
      setGeneralError("Por favor ingresá un nombre para la rutina.");
      return;
    }

    // Validar que cada día tenga al menos 1 ejercicio
    for (const d of dias) {
      if (!d.ejercicios || d.ejercicios.length === 0) {
        setGeneralError(
          `El "${d.nombreDia || `Día ${d.diaNumero}`}" no tiene ningún ejercicio cargado. Por favor agregá al menos un ejercicio a cada día.`
        );
        return;
      }
    }

    startSavingTransition(async () => {
      const res = await guardarRutinaCompleta({
        id: initialData?.id,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        planId: Number(planId),
        isActive,
        dias,
      });

      if (res.success) {
        setSaveSuccess(true);
        router.push("/admin/rutinas");
        router.refresh();
      } else {
        setGeneralError(res.error || "Ocurrió un error al guardar la rutina.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      {/* Cabecera / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-content-muted mb-1">
            <Link
              href="/admin/rutinas"
              className="hover:text-primary transition-colors"
            >
              Rutinas
            </Link>
            <span>/</span>
            <span className="text-content font-bold">
              {isEditing ? "Editar Rutina" : "Nueva Rutina"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content">
            {isEditing ? `Editar: ${nombre || "Rutina"}` : "Crear Nueva Rutina"}
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1">
            Definí los datos generales de la rutina y armá los ejercicios de cada día en una sola pantalla.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/rutinas"
            className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-content hover:bg-surface-hover transition-colors"
          >
            Cancelar
          </Link>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
            disabled={isSaving}
            className="px-5 shadow-xs"
          >
            {isEditing ? "Guardar Cambios" : "Crear Rutina"}
          </Button>
        </div>
      </div>

      {/* Alerta de Error */}
      {generalError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-start gap-2.5">
          <span className="text-base">⚠️</span>
          <div className="flex-1 font-medium">{generalError}</div>
        </div>
      )}

      {/* Alerta de Éxito */}
      {saveSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5">
          <span>✓</span>
          <span>¡Rutina guardada exitosamente! Redirigiendo...</span>
        </div>
      )}

      {/* BLOQUE 1: DATOS GENERALES DE LA RUTINA */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
              1
            </span>
            <h2 className="text-base font-bold text-content">
              Información de la Rutina
            </h2>
          </div>
          <span className="text-xs text-content-muted">
            {dias.length} días configurados • {totalEjercicios} ejercicios en total
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Nombre de la Rutina */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-content">
              Nombre de la Rutina <span className="text-red-500">*</span>
            </label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Hipertrofia y Fuerza 4 Días, Principiantes Adaptación..."
              required
              className="text-sm font-semibold"
            />
            <span className="text-[11px] text-content-muted">
              Un nombre claro para identificar la rutina en el catálogo y asignarla a los socios.
            </span>
          </div>

          {/* Plan / Frecuencia */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-content">
              Plan / Frecuencia Semanal <span className="text-red-500">*</span>
            </label>
            <Select
              value={planId}
              onChange={(e) => handlePlanChange(Number(e.target.value))}
              className="text-sm font-semibold"
            >
              {planes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.diasPorSemana} días por semana)
                </option>
              ))}
            </Select>
            <span className="text-[11px] text-content-muted">
              Determina automáticamente la cantidad de días de entrenamiento (1 a 7).
            </span>
          </div>

          {/* Descripción */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-content">
              Descripción u Objetivos (Opcional)
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Ej: Rutina de 3 días para personas que buscan ganar masa muscular con ejercicios compuestos..."
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs sm:text-sm text-content placeholder:text-content-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Toggle Activo */}
          <div className="space-y-1.5 flex flex-col justify-center">
            <label className="text-xs font-bold text-content">Estado de Disponibilidad</label>
            <label className="inline-flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
              />
              <span className="text-xs font-medium text-content">
                Rutina activa (disponible para asignar a socios)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* BLOQUE 2: CONSTRUCTOR MULTI-DÍA */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-6">
        <div className="border-b border-border pb-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
              2
            </span>
            <h2 className="text-base font-bold text-content">
              Configuración de Días y Ejercicios
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExerciseDrawerOpen(true)}
              className="gap-1.5 text-xs text-primary font-bold border-primary/30 hover:bg-primary/5"
            >
              <svg
                className="h-3.5 w-3.5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Agregar Ejercicios al {currentDia?.nombreDia}</span>
            </Button>
          </div>
        </div>

        {/* PESTAÑAS DE DÍAS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/80">
          {dias.map((d, idx) => {
            const isSelected = idx === activeDayIndex;
            const cantEjercicios = d.ejercicios?.length || 0;

            return (
              <button
                key={d.diaNumero}
                type="button"
                onClick={() => setActiveDayIndex(idx)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-surface-hover/60 text-content-muted border-border hover:bg-surface-hover hover:text-content"
                }`}
              >
                <span>{d.nombreDia || `Día ${d.diaNumero}`}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : cantEjercicios > 0
                        ? "bg-primary/15 text-primary"
                        : "bg-border text-content-muted"
                  }`}
                >
                  {cantEjercicios} ej.
                </span>
              </button>
            );
          })}
        </div>

        {/* PANEL DEL DÍA ACTIVO */}
        {currentDia && (
          <div className="space-y-6 pt-2">
            {/* Cabecera del Día: Nombre y Opción de precargar de catálogo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-hover/30 p-4 rounded-xl border border-border">
              {/* Nombre del Día */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-content">
                  Nombre de este Día
                </label>
                <Input
                  value={currentDia.nombreDia}
                  onChange={(e) => handleDayNameChange(e.target.value)}
                  placeholder="Ej: Día 1 - Pecho y Bíceps"
                  className="text-xs font-semibold bg-surface"
                />
              </div>

              {/* Precargar de rutina existente */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-content">
                  ¿Querés partir de una rutina ya existente? (Opcional)
                </label>
                <div className="flex gap-2">
                  <Select
                    value={selectedRutinaToImport}
                    onChange={(e) =>
                      setSelectedRutinaToImport(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    className="text-xs bg-surface flex-1"
                  >
                    <option value="">Seleccionar rutina para copiar...</option>
                    {rutinasExistentes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre} ({r.totalEjercicios} ejercicios)
                      </option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={!selectedRutinaToImport || isImporting}
                    isLoading={isImporting}
                    onClick={handleImportRutina}
                    className="shrink-0 text-xs font-bold"
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            </div>

            {/* LISTA DE EJERCICIOS DEL DÍA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
                  Ejercicios programados ({currentDia.ejercicios.length})
                </span>
                <span className="text-[11px] text-content-muted">
                  Podés agrupar ejercicios en superseries asignándoles el mismo grupo (ej: Grupo 1).
                </span>
              </div>

              {currentDia.ejercicios.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-border bg-surface-hover/20 text-center space-y-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg">
                    🏋️
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-content">
                      No hay ejercicios en el {currentDia.nombreDia}
                    </h4>
                    <p className="text-xs text-content-muted mt-0.5 max-w-sm">
                      Hacé clic en el botón de abajo para buscar y sumar ejercicios del catálogo a este día.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setIsExerciseDrawerOpen(true)}
                    className="gap-1.5 text-xs font-bold"
                  >
                    + Agregar Ejercicios
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentDia.ejercicios.map((ej, index) => {
                    const isSuperserie = Boolean(ej.grupoNumero);

                    return (
                      <div
                        key={ej.ejercicioId}
                        className={`rounded-xl border p-4 transition-all bg-surface space-y-3 ${
                          isSuperserie
                            ? "border-primary/40 bg-primary/5 shadow-2xs"
                            : "border-border hover:border-border/80"
                        }`}
                      >
                        {/* Fila 1: Nombre, Badge grupo, Orden y Eliminar */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            {/* Flechas para reordenar */}
                            <div className="flex flex-col items-center justify-center shrink-0">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => handleMoveExercise(index, "up")}
                                className="text-content-muted hover:text-content disabled:opacity-20 text-[10px] p-0.5 cursor-pointer disabled:pointer-events-none"
                                title="Subir orden"
                              >
                                ▲
                              </button>
                              <span className="text-[10px] font-bold text-content-muted">
                                {ej.orden}
                              </span>
                              <button
                                type="button"
                                disabled={index === currentDia.ejercicios.length - 1}
                                onClick={() => handleMoveExercise(index, "down")}
                                className="text-content-muted hover:text-content disabled:opacity-20 text-[10px] p-0.5 cursor-pointer disabled:pointer-events-none"
                                title="Bajar orden"
                              >
                                ▼
                              </button>
                            </div>

                            <div>
                              <h4 className="text-sm font-bold text-content">
                                {ej.nombre}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {ej.grupoMuscular && (
                                  <Badge variant="default" className="text-[10px] py-0">
                                    {ej.grupoMuscular}
                                  </Badge>
                                )}
                                {isSuperserie && (
                                  <Badge variant="primary" className="text-[10px] py-0 font-bold">
                                    Superserie — Grupo {ej.grupoNumero}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Selector de Superserie / Circuito */}
                            <div className="flex items-center gap-1.5">
                              <label className="text-[11px] font-semibold text-content-muted hidden sm:inline">
                                Agrupación:
                              </label>
                              <select
                                value={ej.grupoNumero || ""}
                                onChange={(e) =>
                                  handleUpdateExerciseField(
                                    ej.ejercicioId,
                                    "grupoNumero",
                                    e.target.value ? Number(e.target.value) : null
                                  )
                                }
                                className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-content focus:border-primary focus:outline-none"
                              >
                                <option value="">Individual</option>
                                <option value="1">Superserie Grupo 1</option>
                                <option value="2">Superserie Grupo 2</option>
                                <option value="3">Superserie Grupo 3</option>
                                <option value="4">Superserie Grupo 4</option>
                                <option value="5">Circuito Grupo 5</option>
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveExercise(ej.ejercicioId)}
                              aria-label="Eliminar ejercicio"
                              title="Eliminar este ejercicio"
                              className="text-content-muted hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                              <svg
                                className="h-4 w-4"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Fila 2: Inputs de Series, Reps, Pausa, Peso */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-border/60">
                          {/* Series */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">
                              Series
                            </label>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={ej.series}
                              onChange={(e) =>
                                handleUpdateExerciseField(
                                  ej.ejercicioId,
                                  "series",
                                  Number(e.target.value) || 1
                                )
                              }
                              className="text-xs h-8 font-bold"
                            />
                          </div>

                          {/* Repeticiones */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">
                              Repeticiones
                            </label>
                            <Input
                              type="text"
                              value={ej.repeticiones}
                              onChange={(e) =>
                                handleUpdateExerciseField(
                                  ej.ejercicioId,
                                  "repeticiones",
                                  e.target.value
                                )
                              }
                              placeholder="10-12, Fallo"
                              className="text-xs h-8 font-bold"
                            />
                          </div>

                          {/* Pausa (segundos) */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">
                              Descanso (seg)
                            </label>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                step={15}
                                value={ej.descansoSegundos ?? 60}
                                onChange={(e) =>
                                  handleUpdateExerciseField(
                                    ej.ejercicioId,
                                    "descansoSegundos",
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="text-xs h-8 font-bold"
                              />
                              <div className="flex gap-0.5">
                                {[60, 90, 120].map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() =>
                                      handleUpdateExerciseField(
                                        ej.ejercicioId,
                                        "descansoSegundos",
                                        preset
                                      )
                                    }
                                    className={`px-1.5 py-1 rounded text-[9px] font-bold border cursor-pointer ${
                                      ej.descansoSegundos === preset
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-surface text-content-muted border-border hover:bg-surface-hover"
                                    }`}
                                  >
                                    {preset}s
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Peso Sugerido (kg) */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">
                              Peso Ref. (kg)
                            </label>
                            <Input
                              type="number"
                              step="0.5"
                              min={0}
                              value={ej.pesoSugerido ?? ""}
                              onChange={(e) =>
                                handleUpdateExerciseField(
                                  ej.ejercicioId,
                                  "pesoSugerido",
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              placeholder="Opcional"
                              className="text-xs h-8"
                            />
                          </div>
                        </div>

                        {/* Fila 3: Notas técnicas */}
                        <div className="pt-1">
                          <input
                            type="text"
                            value={ej.notas || ""}
                            onChange={(e) =>
                              handleUpdateExerciseField(
                                ej.ejercicioId,
                                "notas",
                                e.target.value || null
                              )
                            }
                            placeholder="Notas técnicas: ej. Mantener codos pegados al cuerpo, bajar lento en 3s..."
                            className="w-full rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] text-content placeholder:text-content-muted/60 focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL / PANEL DE BÚSQUEDA Y AGREGADO DE EJERCICIOS */}
      {isExerciseDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
          onClick={() => setIsExerciseDrawerOpen(false)}
        >
          <div
            className="relative max-h-[85vh] max-w-2xl w-full rounded-2xl border border-border bg-surface p-5 shadow-2xl flex flex-col space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-content">
                  Agregar Ejercicios al {currentDia?.nombreDia}
                </h3>
                <p className="text-xs text-content-muted mt-0.5">
                  Buscá y sumá ejercicios. Podés agregar varios a la vez.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExerciseDrawerOpen(false)}
                className="rounded-lg p-1.5 text-content-muted hover:text-content hover:bg-surface-hover cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Buscador y Filtro por Músculo */}
            <div className="space-y-2">
              <Input
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                placeholder="Buscar por nombre de ejercicio (ej: Press, Sentadilla, Dominadas)..."
                className="text-xs"
                autoFocus
              />

              {/* Filtros de grupo muscular en pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setMuscleFilter("ALL")}
                  className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 cursor-pointer text-xs ${
                    muscleFilter === "ALL"
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface border border-border text-content-muted hover:text-content"
                  }`}
                >
                  Todos ({ejerciciosDisponibles.length})
                </button>
                {uniqueMuscles.map((muscle) => (
                  <button
                    key={muscle}
                    type="button"
                    onClick={() => setMuscleFilter(muscle)}
                    className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 cursor-pointer text-xs ${
                      muscleFilter === muscle
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface border border-border text-content-muted hover:text-content"
                    }`}
                  >
                    {muscle}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Ejercicios */}
            <div className="overflow-y-auto max-h-96 divide-y divide-border border border-border rounded-xl">
              {filteredEjercicios.length === 0 ? (
                <div className="p-8 text-center text-xs text-content-muted">
                  No se encontraron ejercicios con ese criterio de búsqueda.
                </div>
              ) : (
                filteredEjercicios.map((ej) => {
                  const isAdded = addedIdsInCurrentDay.has(ej.id);

                  return (
                    <div
                      key={ej.id}
                      className="flex items-center justify-between p-3 hover:bg-surface-hover/50 transition-colors"
                    >
                      <div>
                        <span className="font-bold text-xs text-content block">
                          {ej.nombre}
                        </span>
                        {ej.grupoMuscular && (
                          <span className="text-[10px] text-content-muted">
                            {ej.grupoMuscular}
                          </span>
                        )}
                      </div>

                      {isAdded ? (
                        <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                          Agregado ✓
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddExerciseToCurrentDay(ej)}
                          className="text-xs h-7 px-3 font-bold text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground"
                        >
                          + Agregar
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pie del modal */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-content-muted">
                {currentDia?.ejercicios.length} ejercicio(s) en este día
              </span>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsExerciseDrawerOpen(false)}
              >
                Listo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* BARRA INFERIOR FIJA DE ACCIÓN */}
      <div className="fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur-md border-t border-border p-4 shadow-xl z-20">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-content-muted hidden sm:inline">
              Resumen:
            </span>
            <span className="text-xs font-bold text-content">
              {dias.length} Días de Entrenamiento • {totalEjercicios} Ejercicios en total
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/rutinas"
              className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-content hover:bg-surface-hover transition-colors"
            >
              Cancelar
            </Link>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              disabled={isSaving}
              className="px-6 shadow-xs font-bold"
            >
              {isEditing ? "Guardar Rutina" : "Crear Rutina"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
