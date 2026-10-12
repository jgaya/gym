"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PlanItem, PlanFormData, crearPlan, actualizarPlan } from "./actions";

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: PlanItem | null;
  onSuccess: () => void;
}

export function PlanFormModal({
  isOpen,
  onClose,
  plan,
  onSuccess,
}: PlanFormModalProps) {
  const isEditing = Boolean(plan);

  const [formData, setFormData] = useState<PlanFormData>({
    nombre: "",
    descripcion: "",
    diasPorSemana: 3,
    precio: null,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      setFormData({
        nombre: plan.nombre || "",
        descripcion: plan.descripcion || "",
        diasPorSemana: plan.diasPorSemana || 3,
        precio: plan.precio !== null ? plan.precio : null,
        isActive: plan.isActive ?? true,
      });
    } else {
      setFormData({
        nombre: "",
        descripcion: "",
        diasPorSemana: 3,
        precio: null,
        isActive: true,
      });
    }
    setErrors({});
    setGeneralError(null);
  }, [plan, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "diasPorSemana") {
      setFormData((prev) => ({ ...prev, diasPorSemana: Number(value) }));
    } else if (name === "precio") {
      setFormData((prev) => ({
        ...prev,
        precio: value === "" ? null : Number(value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre del plan es obligatorio";
    }

    const dias = Number(formData.diasPorSemana);
    if (isNaN(dias) || dias < 1 || dias > 7) {
      newErrors.diasPorSemana = "Debe ser entre 1 y 7 días";
    }

    if (formData.precio !== null && formData.precio !== undefined) {
      if (isNaN(Number(formData.precio)) || Number(formData.precio) < 0) {
        newErrors.precio = "El precio debe ser un número positivo";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGeneralError(null);

    try {
      let result;
      if (isEditing && plan) {
        result = await actualizarPlan(plan.id, formData);
      } else {
        result = await crearPlan(formData);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setGeneralError(result.error || "Ocurrió un error al procesar el plan");
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
      title={isEditing ? `Modificar Plan: ${plan?.nombre}` : "Crear Nuevo Plan de Membresía"}
      description="Configurá los días por semana y el valor del plan para los usuarios."
      maxWidth="md"
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
            {isEditing ? "Guardar Cambios" : "Crear Plan"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
            {generalError}
          </div>
        )}

        <Input
          label="Nombre del Plan"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          error={errors.nombre}
          placeholder="Ej: Plan 3 Días Musculación"
          required
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Días por Semana"
            name="diasPorSemana"
            value={formData.diasPorSemana}
            onChange={handleChange}
            error={errors.diasPorSemana}
            required
          >
            <option value={1}>1 Día por semana</option>
            <option value={2}>2 Días por semana</option>
            <option value={3}>3 Días por semana</option>
            <option value={4}>4 Días por semana</option>
            <option value={5}>5 Días por semana</option>
            <option value={6}>6 Días por semana</option>
            <option value={7}>7 Días (Pase Libre)</option>
          </Select>

          <Input
            label="Precio Mensual ($)"
            type="number"
            step="0.01"
            min="0"
            name="precio"
            value={formData.precio !== null && formData.precio !== undefined ? formData.precio : ""}
            onChange={handleChange}
            error={errors.precio}
            placeholder="Ej: 25000"
            helperText="Opcional. Valor de la cuota mensual."
          />
        </div>

        <div className="w-full space-y-1.5">
          <label
            htmlFor="descripcion"
            className="block text-xs font-semibold uppercase tracking-wider text-content"
          >
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={3}
            value={formData.descripcion || ""}
            onChange={handleChange}
            placeholder="Detalles del plan, acceso a clases o áreas del gimnasio..."
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-content placeholder:text-content-muted transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary hover:border-content-muted/50"
          />
        </div>

        <div className="pt-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
            }
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-content cursor-pointer">
            Plan activo para nuevas asignaciones
          </label>
        </div>
      </form>
    </Modal>
  );
}
