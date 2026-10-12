"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  EjercicioItem,
  EjercicioFormData,
  crearEjercicio,
  actualizarEjercicio,
} from "./actions";
import { GRUPOS_MUSCULARES } from "./constants";

interface EjercicioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  ejercicio?: EjercicioItem | null;
  onSuccess: () => void;
}

export function EjercicioFormModal({
  isOpen,
  onClose,
  ejercicio,
  onSuccess,
}: EjercicioFormModalProps) {
  const isEditing = Boolean(ejercicio);

  const [formData, setFormData] = useState<EjercicioFormData>({
    nombre: "",
    grupoMuscular: "Pecho",
    descripcion: "",
    imagenUrl: "",
    videoUrl: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (ejercicio) {
      setFormData({
        nombre: ejercicio.nombre || "",
        grupoMuscular: ejercicio.grupoMuscular || "Pecho",
        descripcion: ejercicio.descripcion || "",
        imagenUrl: ejercicio.imagenUrl || "",
        videoUrl: ejercicio.videoUrl || "",
        isActive: ejercicio.isActive ?? true,
      });
    } else {
      setFormData({
        nombre: "",
        grupoMuscular: "Pecho",
        descripcion: "",
        imagenUrl: "",
        videoUrl: "",
        isActive: true,
      });
    }
    setErrors({});
    setGeneralError(null);
  }, [ejercicio, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
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
      newErrors.nombre = "El nombre del ejercicio es obligatorio";
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
      if (isEditing && ejercicio) {
        result = await actualizarEjercicio(ejercicio.id, formData);
      } else {
        result = await crearEjercicio(formData);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setGeneralError(result.error || "Ocurrió un error al procesar el ejercicio");
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
      title={isEditing ? `Modificar Ejercicio: ${ejercicio?.nombre}` : "Alta de Nuevo Ejercicio"}
      description="Definí los detalles del ejercicio, grupo muscular, instrucciones paso a paso y recursos multimedia."
      maxWidth="xl"
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
            {isEditing ? "Guardar Cambios" : "Crear Ejercicio"}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Input
              label="Nombre del Ejercicio"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              error={errors.nombre}
              placeholder="Ej: Press de Banca Plano con Barra"
              required
            />
          </div>

          <Select
            label="Grupo Muscular"
            name="grupoMuscular"
            value={formData.grupoMuscular || ""}
            onChange={handleChange}
          >
            {GRUPOS_MUSCULARES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
            <option value="Otro">Otro</option>
          </Select>
        </div>

        <div className="w-full space-y-1.5">
          <label
            htmlFor="descripcion"
            className="block text-xs font-semibold uppercase tracking-wider text-content"
          >
            Instrucciones / Técnica de Ejecución y Postura
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={8}
            value={formData.descripcion || ""}
            onChange={handleChange}
            placeholder={`- Colócate de pie con los pies separados a la altura de los hombros y sostén la mancuerna/barra.&#10;- Empuja tus caderas hacia atrás y baja de manera controlada.&#10;- Mantén los codos en posición y el core activo.&#10;- Impulsa con fuerza manteniendo la respiración y postura adecuada.&#10;Asegúrate de mantener el pecho hacia arriba y evitar compensaciones con la espalda baja.`}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-content placeholder:text-content-muted/70 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary hover:border-content-muted/50 font-sans leading-relaxed resize-y"
          />
          <p className="text-xs text-content-muted">
            Texto enriquecido sin límite de caracteres: podés detallar los pasos con viñetas (-), consejos de postura, respiración y prevención de lesiones.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="URL de Imagen / GIF Demostrativo"
            name="imagenUrl"
            type="url"
            value={formData.imagenUrl || ""}
            onChange={handleChange}
            placeholder="https://ejemplo.com/ejercicio.gif"
            helperText="Opcional. Imagen o GIF animado."
          />

          <Input
            label="URL de Video Demostrativo"
            name="videoUrl"
            type="url"
            value={formData.videoUrl || ""}
            onChange={handleChange}
            placeholder="https://youtube.com/watch?v=..."
            helperText="Opcional. Enlace a video de técnica."
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
            Ejercicio activo en el catálogo
          </label>
        </div>
      </form>
    </Modal>
  );
}
