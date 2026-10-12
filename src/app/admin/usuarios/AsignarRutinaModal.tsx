"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  UsuarioItem,
  getAsignacionRutinaUsuario,
  asignarTemplateAUsuario,
  asignarRutinasPersonalizadasAUsuario,
  desasignarRutinaUsuario,
  DiaPersonalizadoInput,
  AsignacionRutinaData,
} from "./actions";

interface RutinaCatalogoItem {
  id: number;
  nombre: string;
  totalEjercicios: number;
}

interface TemplateDisponibleItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  totalDias: number;
  dias: {
    diaNumero: number;
    nombreDia: string | null;
    rutinaId: number;
    rutinaNombre: string;
    totalEjercicios: number;
  }[];
}

interface AsignarRutinaModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: UsuarioItem | null;
  onSuccess: () => void;
}

export function AsignarRutinaModal({
  isOpen,
  onClose,
  usuario,
  onSuccess,
}: AsignarRutinaModalProps) {
  // Pestaña activa: "templates" (en 1 clic) o "custom" (día por día a mano)
  const [activeTab, setActiveTab] = useState<"templates" | "custom">("templates");

  const [loadingData, setLoadingData] = useState(false);
  const [data, setData] = useState<AsignacionRutinaData | null>(null);

  // Estado para la asignación manual día por día
  const [customDias, setCustomDias] = useState<
    Array<{ diaNumero: number; nombreDia: string; rutinaId: number }>
  >([]);

  const [assigningTemplateId, setAssigningTemplateId] = useState<number | null>(null);
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const cargarDatos = async (usuarioId: number) => {
    setLoadingData(true);
    setErrorMsg(null);
    try {
      const res = await getAsignacionRutinaUsuario(usuarioId);
      setData(res);

      if (res && res.usuario.plan) {
        const diasPorSemana = res.usuario.plan.diasPorSemana;
        // Inicializar slots personalizados
        const slots: Array<{ diaNumero: number; nombreDia: string; rutinaId: number }> = [];

        for (let i = 1; i <= diasPorSemana; i++) {
          const asignado = res.rutinasDias.find((d) => d.diaNumero === i);
          if (asignado) {
            slots.push({
              diaNumero: i,
              nombreDia: asignado.nombreDia || `Día ${i}`,
              rutinaId: asignado.rutinaId || asignado.rutina?.id || 0,
            });
          } else {
            slots.push({
              diaNumero: i,
              nombreDia: `Día ${i}`,
              rutinaId: 0,
            });
          }
        }
        setCustomDias(slots);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al cargar la información del socio";
      setErrorMsg(message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isOpen && usuario) {
      setSuccessMsg(null);
      setErrorMsg(null);
      setActiveTab("templates");
      cargarDatos(usuario.id);
    } else {
      setData(null);
      setCustomDias([]);
    }
  }, [isOpen, usuario]);

  // Actualizar un campo de un día en modo personalizado
  const handleUpdateCustomDia = (
    diaNumero: number,
    field: "nombreDia" | "rutinaId",
    value: string | number
  ) => {
    setCustomDias((prev) =>
      prev.map((d) => (d.diaNumero === diaNumero ? { ...d, [field]: value } : d))
    );
  };

  // Cargar valores en los slots personalizados desde una plantilla predefinida
  const handleCargarDesdeTemplate = (templateId: number) => {
    if (!data) return;
    const tpl = data.templatesDisponibles.find((t) => t.id === templateId);
    if (!tpl) return;

    setCustomDias((prev) =>
      prev.map((d) => {
        const tplDia = tpl.dias.find((td) => td.diaNumero === d.diaNumero);
        if (tplDia) {
          return {
            diaNumero: d.diaNumero,
            nombreDia: tplDia.nombreDia || `Día ${d.diaNumero}`,
            rutinaId: tplDia.rutinaId,
          };
        }
        return d;
      })
    );
    setSuccessMsg(`Valores cargados desde "${tpl.nombre}". Podés modificarlos a continuación.`);
  };

  // Asignar plantilla completa (1 clic)
  const handleAsignarTemplate = async (templateId: number) => {
    if (!usuario) return;
    setAssigningTemplateId(templateId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await asignarTemplateAUsuario({
        usuarioId: usuario.id,
        templateId,
      });

      if (res.success) {
        setSuccessMsg("¡Plantilla asignada exitosamente al socio!");
        await cargarDatos(usuario.id);
        onSuccess();
      } else {
        setErrorMsg(res.error || "No se pudo asignar la plantilla");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado al asignar";
      setErrorMsg(message);
    } finally {
      setAssigningTemplateId(null);
    }
  };

  // Guardar asignación personalizada día por día
  const handleGuardarPersonalizada = async () => {
    if (!usuario) return;

    // Validar que al menos un día tenga rutina seleccionada
    const diasSeleccionados = customDias.filter((d) => d.rutinaId && d.rutinaId > 0);
    if (diasSeleccionados.length === 0) {
      setErrorMsg("Debes seleccionar al menos una rutina para algún día");
      return;
    }

    setIsSavingCustom(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const diasInput: DiaPersonalizadoInput[] = diasSeleccionados.map((d) => ({
        diaNumero: d.diaNumero,
        nombreDia: d.nombreDia.trim() || `Día ${d.diaNumero}`,
        rutinaId: Number(d.rutinaId),
      }));

      const res = await asignarRutinasPersonalizadasAUsuario({
        usuarioId: usuario.id,
        dias: diasInput,
      });

      if (res.success) {
        setSuccessMsg("¡Rutina personalizada guardada y asignada exitosamente!");
        await cargarDatos(usuario.id);
        onSuccess();
      } else {
        setErrorMsg(res.error || "No se pudo guardar la rutina personalizada");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al guardar la rutina personalizada";
      setErrorMsg(message);
    } finally {
      setIsSavingCustom(false);
    }
  };

  const handleDesasignar = async () => {
    if (!usuario) return;
    setIsRemoving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await desasignarRutinaUsuario(usuario.id);
      if (res.success) {
        setSuccessMsg("Rutina desasignada correctamente");
        await cargarDatos(usuario.id);
        onSuccess();
      } else {
        setErrorMsg(res.error || "No se pudo desasignar la rutina");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al desasignar";
      setErrorMsg(message);
    } finally {
      setIsRemoving(false);
    }
  };

  if (!usuario) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Gestión de Rutina: ${usuario.nombre} ${usuario.apellido}`}
      description="Asigná una plantilla completa o seleccioná a mano qué rutina realizar cada día del plan."
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {data?.rutinasDias && data.rutinasDias.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDesasignar}
                isLoading={isRemoving}
                className="text-xs text-red-600 hover:bg-red-500/10 hover:border-red-500/30"
              >
                Quitar Rutina Asignada
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            {activeTab === "custom" && usuario.plan && (
              <Button
                variant="primary"
                onClick={handleGuardarPersonalizada}
                isLoading={isSavingCustom}
              >
                Guardar Rutina Personalizada
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Banner de Información del Miembro */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl bg-surface-hover/60 border border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-sm text-primary-foreground">
              {usuario.nombre.charAt(0)}
              {usuario.apellido.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-content text-sm">
                {usuario.nombre} {usuario.apellido}
              </p>
              <p className="text-xs text-content-muted">DNI: {usuario.dni}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-content-muted">Plan de Membresía:</span>
            {usuario.plan ? (
              <Badge variant="primary" className="text-xs">
                {usuario.plan.nombre} ({usuario.plan.diasPorSemana} días/sem)
              </Badge>
            ) : (
              <Badge variant="danger" className="text-xs">
                Sin Plan Asignado
              </Badge>
            )}
          </div>
        </div>

        {/* Mensajes de Feedback */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {successMsg}
          </div>
        )}

        {/* Advertencia si no tiene plan */}
        {!usuario.plan && (
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-400 space-y-2">
            <p className="font-semibold">Este miembro no tiene un plan configurado.</p>
            <p>
              Para asignarle una rutina, primero debés asignarle un Plan de Membresía (por ejemplo, Plan 3 Días o Plan 5 Días) editando sus datos en la tabla de miembros.
            </p>
          </div>
        )}

        {/* Carga activa */}
        {loadingData ? (
          <div className="py-12 text-center text-content-muted">
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Cargando asignación y catálogo...
            </div>
          </div>
        ) : data && usuario.plan ? (
          <div className="space-y-4">
            {/* Rutina Actualmente Asignada */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-content">
                  Rutina Actual del Socio
                </h4>
                {data.rutinasDias.length > 0 && (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    ✓ {data.rutinasDias.length} de {usuario.plan.diasPorSemana} días configurados
                  </span>
                )}
              </div>

              {data.rutinasDias.length === 0 ? (
                <div className="p-3 rounded-xl border border-dashed border-border bg-surface-hover/20 text-center text-xs text-content-muted">
                  El socio aún no tiene rutinas asignadas. Elegí una plantilla o configurá los días manualmente.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {data.rutinasDias.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-lg border border-border bg-surface p-2.5 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 text-[10px] font-black text-primary">
                          {d.diaNumero}
                        </span>
                        <span className="text-[10px] font-semibold text-content-muted uppercase truncate">
                          {d.nombreDia || `Día ${d.diaNumero}`}
                        </span>
                      </div>
                      <p className="font-semibold text-xs text-content truncate">
                        {d.rutina.nombre}
                      </p>
                      <p className="text-[10px] text-content-muted">
                        {d.rutina.ejercicios.length} ejercicios
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pestañas de Asignación: Plantillas vs Personalizada Día por Día */}
            <div className="border-t border-border pt-4 space-y-4">
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("templates")}
                  className={`flex items-center gap-2 border-b-2 py-2 px-4 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "templates"
                      ? "border-primary text-primary"
                      : "border-transparent text-content-muted hover:border-border hover:text-content"
                  }`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Plantillas del Plan ({data.templatesDisponibles.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("custom")}
                  className={`flex items-center gap-2 border-b-2 py-2 px-4 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "custom"
                      ? "border-primary text-primary"
                      : "border-transparent text-content-muted hover:border-border hover:text-content"
                  }`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Personalizar Día por Día (Manual)
                </button>
              </div>

              {/* ============================================================= */}
              {/* VISTA 1: PLANTILLAS PREDEFINIDAS */}
              {/* ============================================================= */}
              {activeTab === "templates" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-content-muted">
                      Seleccioná una plantilla para aplicar todos los días del plan automáticamente en 1 clic:
                    </p>
                  </div>

                  {data.templatesDisponibles.length === 0 ? (
                    <div className="p-5 rounded-xl border border-border bg-surface-hover/30 text-center space-y-2">
                      <p className="text-xs text-content-muted">
                        No hay plantillas creadas todavía para planes de {usuario.plan.diasPorSemana} días.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("custom")}
                        className="inline-flex items-center text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Podés armar una rutina personalizada a mano aquí →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {data.templatesDisponibles.map((tpl) => (
                        <div
                          key={tpl.id}
                          className="rounded-xl border border-border bg-surface p-3.5 space-y-2.5 transition-all hover:border-primary/40 hover:shadow-2xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-sm text-content">
                                  {tpl.nombre}
                                </h5>
                                <Badge variant="primary" className="text-[10px]">
                                  {tpl.totalDias} días
                                </Badge>
                              </div>
                              {tpl.descripcion && (
                                <p className="text-xs text-content-muted mt-0.5 line-clamp-2">
                                  {tpl.descripcion}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleCargarDesdeTemplate(tpl.id);
                                  setActiveTab("custom");
                                }}
                                title="Copiar estos días a la configuración manual para editar libremente"
                                className="text-xs"
                              >
                                Copiar y Editar
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleAsignarTemplate(tpl.id)}
                                isLoading={assigningTemplateId === tpl.id}
                              >
                                Asignar Directo
                              </Button>
                            </div>
                          </div>

                          {/* Días y Rutinas de la plantilla */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 border-t border-border/50">
                            {tpl.dias.map((d) => (
                              <div
                                key={d.diaNumero}
                                className="flex items-center gap-2 rounded bg-surface-hover/50 px-2 py-1.5 text-xs"
                              >
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-primary/20 text-[10px] font-black text-primary">
                                  {d.diaNumero}
                                </span>
                                <div className="truncate">
                                  <span className="font-semibold text-content block text-[11px] truncate">
                                    {d.nombreDia || `Día ${d.diaNumero}`}
                                  </span>
                                  <span className="text-[10px] text-content-muted truncate block">
                                    {d.rutinaNombre} ({d.totalEjercicios} ej.)
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* VISTA 2: PERSONALIZAR DÍA POR DÍA A MANO */}
              {/* ============================================================= */}
              {activeTab === "custom" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-xs text-content font-semibold">
                        Configuración Manual de los {usuario.plan.diasPorSemana} Días del Plan
                      </p>
                      <p className="text-[11px] text-content-muted">
                        Seleccioná qué rutina del catálogo corresponde a cada día y dale el nombre que prefieras:
                      </p>
                    </div>

                    {/* Atajo para cargar desde plantilla si hay disponibles */}
                    {data.templatesDisponibles.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-content-muted uppercase font-bold">
                          Cargar plantilla:
                        </span>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleCargarDesdeTemplate(Number(e.target.value));
                              e.target.value = "";
                            }
                          }}
                          className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-content focus:border-primary focus:outline-none cursor-pointer"
                        >
                          <option value="">Seleccionar base...</option>
                          {data.templatesDisponibles.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Lista de Slots de cada día */}
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {customDias.map((dia) => {
                      const rutinaSeleccionada = data.rutinasDisponibles.find(
                        (r) => r.id === Number(dia.rutinaId)
                      );

                      return (
                        <div
                          key={dia.diaNumero}
                          className="rounded-xl border border-border bg-surface-hover/30 p-3.5 space-y-2.5 transition-colors hover:border-primary/40"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground font-black text-[11px]">
                                {dia.diaNumero}
                              </span>
                              <span className="font-bold text-xs text-content">
                                Día {dia.diaNumero} de la Semana
                              </span>
                            </div>

                            {rutinaSeleccionada ? (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                {rutinaSeleccionada.totalEjercicios} ejercicios configurados
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                                Sin rutina asignada para este día
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                            <div className="sm:col-span-5">
                              <label className="block text-[10px] font-semibold uppercase text-content-muted mb-1">
                                Nombre / Enfoque del Día
                              </label>
                              <input
                                type="text"
                                value={dia.nombreDia}
                                onChange={(e) =>
                                  handleUpdateCustomDia(
                                    dia.diaNumero,
                                    "nombreDia",
                                    e.target.value
                                  )
                                }
                                placeholder={`Ej: Día ${dia.diaNumero} — Pecho y Bíceps`}
                                className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-content focus:border-primary focus:outline-none"
                              />
                            </div>

                            <div className="sm:col-span-7">
                              <label className="block text-[10px] font-semibold uppercase text-content-muted mb-1">
                                Rutina del Catálogo
                              </label>
                              <select
                                value={dia.rutinaId}
                                onChange={(e) =>
                                  handleUpdateCustomDia(
                                    dia.diaNumero,
                                    "rutinaId",
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-content focus:border-primary focus:outline-none cursor-pointer"
                              >
                                <option value={0}>Seleccionar rutina del catálogo...</option>
                                {data.rutinasDisponibles.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.nombre} ({r.totalEjercicios} ejercicios)
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
