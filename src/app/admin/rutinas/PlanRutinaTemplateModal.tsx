"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  PlanRutinaTemplateItem,
  PlanRutinaTemplateFormData,
  crearPlanRutinaTemplate,
  actualizarPlanRutinaTemplate,
} from "./actions";

interface PlanOption {
  id: number;
  nombre: string;
  diasPorSemana: number;
}

interface RutinaOption {
  id: number;
  nombre: string;
  totalEjercicios: number;
  esTemplate: boolean;
}

interface PlanRutinaTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: PlanRutinaTemplateItem | null;
  planes: PlanOption[];
  rutinas: RutinaOption[];
  onSuccess: () => void;
}

export function PlanRutinaTemplateModal({
  isOpen,
  onClose,
  template,
  planes,
  rutinas,
  onSuccess,
}: PlanRutinaTemplateModalProps) {
  const isEditing = Boolean(template);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [planId, setPlanId] = useState<number>(planes[0]?.id || 1);
  const [isActive, setIsActive] = useState(true);
  const [diasConfig, setDiasConfig] = useState<
    Array<{ diaNumero: number; nombreDia: string; rutinaId: number }>
  >([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Obtener la cantidad de días del plan seleccionado
  const selectedPlan = planes.find((p) => p.id === Number(planId));
  const diasPermitidos = selectedPlan?.diasPorSemana || 3;

  // Inicializar o resetear datos
  useEffect(() => {
    if (template) {
      setNombre(template.nombre);
      setDescripcion(template.descripcion || "");
      setPlanId(template.planId);
      setIsActive(template.isActive);

      // Mapear días existentes
      setDiasConfig(
        template.dias.map((d) => ({
          diaNumero: d.diaNumero,
          nombreDia: d.nombreDia || `Día ${d.diaNumero}`,
          rutinaId: d.rutinaId,
        }))
      );
    } else {
      setNombre("");
      setDescripcion("");
      const initialPlan = planes[0];
      const initialPlanId = initialPlan ? initialPlan.id : 1;
      setPlanId(initialPlanId);
      setIsActive(true);

      const count = initialPlan ? initialPlan.diasPorSemana : 3;
      const initialDias = Array.from({ length: count }, (_, i) => ({
        diaNumero: i + 1,
        nombreDia: `Día ${i + 1}`,
        rutinaId: rutinas[0]?.id || 0,
      }));
      setDiasConfig(initialDias);
    }

    setErrors({});
    setGeneralError(null);
  }, [template, isOpen, planes, rutinas]);

  // Si cambia el plan seleccionado, ajustar la cantidad de días
  const handlePlanChange = (newPlanId: number) => {
    setPlanId(newPlanId);
    const plan = planes.find((p) => p.id === newPlanId);
    const count = plan ? plan.diasPorSemana : 3;

    setDiasConfig((prev) => {
      const next: Array<{ diaNumero: number; nombreDia: string; rutinaId: number }> = [];
      for (let i = 1; i <= count; i++) {
        const existente = prev.find((d) => d.diaNumero === i);
        if (existente) {
          next.push(existente);
        } else {
          next.push({
            diaNumero: i,
            nombreDia: `Día ${i}`,
            rutinaId: rutinas[0]?.id || 0,
          });
        }
      }
      return next;
    });
  };

  const handleUpdateDia = (
    diaNumero: number,
    field: "nombreDia" | "rutinaId",
    value: string | number
  ) => {
    setDiasConfig((prev) =>
      prev.map((d) => (d.diaNumero === diaNumero ? { ...d, [field]: value } : d))
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nombre.trim()) {
      newErrors.nombre = "El nombre de la plantilla es obligatorio";
    }

    // Verificar que todos los días tengan una rutina válida seleccionada
    const diasSinRutina = diasConfig.filter((d) => !d.rutinaId || d.rutinaId === 0);
    if (diasSinRutina.length > 0) {
      newErrors.dias = `Falta seleccionar la rutina para: ${diasSinRutina
        .map((d) => `Día ${d.diaNumero}`)
        .join(", ")}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGeneralError(null);

    const formData: PlanRutinaTemplateFormData = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      planId: Number(planId),
      isActive,
      dias: diasConfig.map((d) => ({
        diaNumero: d.diaNumero,
        nombreDia: d.nombreDia.trim() || `Día ${d.diaNumero}`,
        rutinaId: Number(d.rutinaId),
      })),
    };

    try {
      let result;
      if (isEditing && template) {
        result = await actualizarPlanRutinaTemplate(template.id, formData);
      } else {
        result = await crearPlanRutinaTemplate(formData);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setGeneralError(result.error || "Ocurrió un error al guardar la plantilla");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? `Modificar Plantilla de Plan: ${template?.nombre}`
          : "Nueva Plantilla de Rutina para Plan"
      }
      description="Creá una estructura completa de entrenamiento con una rutina asignada para cada día del plan."
      maxWidth="4xl"
      footer={
        <>
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
            {isEditing ? "Guardar Cambios" : "Crear Plantilla"}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Input
              label="Nombre de la Plantilla"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              error={errors.nombre}
              placeholder="Ej: Rutina Principiante — 3 Días (Fuerza y Acondicionamiento)"
              required
            />
          </div>

          <Select
            label="Plan de Membresía"
            value={planId}
            onChange={(e) => handlePlanChange(Number(e.target.value))}
            disabled={isEditing} // Si se edita, preservar el plan base
          >
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.diasPorSemana} días)
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full space-y-1.5">
          <label
            htmlFor="template-descripcion"
            className="block text-xs font-semibold uppercase tracking-wider text-content"
          >
            Descripción / Perfil del Atleta
          </label>
          <textarea
            id="template-descripcion"
            rows={2}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Diseñada para miembros que inician en sala de musculación. Enfoque en adaptación y técnica."
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-content placeholder:text-content-muted transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary hover:border-content-muted/50 resize-y"
          />
        </div>

        {/* Configuración de Días del Plan */}
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-content">
                Días de Entrenamiento ({diasConfig.length} de {diasPermitidos} días)
              </h3>
              <p className="text-xs text-content-muted">
                Asigná una rutina del catálogo a cada día de este plan:
              </p>
            </div>
            {errors.dias && (
              <span className="text-xs font-semibold text-red-500">
                {errors.dias}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {diasConfig.map((dia) => {
              const rutinaSeleccionada = rutinas.find(
                (r) => r.id === Number(dia.rutinaId)
              );

              return (
                <div
                  key={dia.diaNumero}
                  className="rounded-xl border border-border bg-surface-hover/30 p-3.5 space-y-2.5 transition-colors hover:border-primary/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-black text-xs">
                        {dia.diaNumero}
                      </span>
                      <span className="font-semibold text-xs text-content">
                        Día {dia.diaNumero} de la Semana
                      </span>
                    </div>

                    {rutinaSeleccionada && (
                      <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {rutinaSeleccionada.totalEjercicios}{" "}
                        {rutinaSeleccionada.totalEjercicios === 1
                          ? "ejercicio"
                          : "ejercicios"}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-semibold uppercase text-content-muted mb-1">
                        Nombre / Enfoque del Día
                      </label>
                      <input
                        type="text"
                        value={dia.nombreDia}
                        onChange={(e) =>
                          handleUpdateDia(dia.diaNumero, "nombreDia", e.target.value)
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
                          handleUpdateDia(
                            dia.diaNumero,
                            "rutinaId",
                            Number(e.target.value)
                          )
                        }
                        className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-content focus:border-primary focus:outline-none cursor-pointer"
                      >
                        <option value={0}>Seleccionar rutina del catálogo...</option>
                        {rutinas.map((r) => (
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

        <div className="pt-1 flex items-center gap-2">
          <input
            type="checkbox"
            id="template-isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
          <label
            htmlFor="template-isActive"
            className="text-sm font-medium text-content cursor-pointer"
          >
            Plantilla activa y disponible para asignar a miembros
          </label>
        </div>
      </form>
    </Modal>
  );
}

