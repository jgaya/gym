"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { actualizarDatosPerfil, PerfilFormData } from "./actions";

export const OBJETIVOS_OPCIONES = [
  { id: "bajar_peso", label: "Bajar de peso", icon: "🔥" },
  { id: "aumentar_masa_muscular", label: "Aumentar masa muscular", icon: "💪" },
  { id: "mejorar_condicion_fisica", label: "Mejorar condición física", icon: "⚡" },
  { id: "rendimiento_deportivo", label: "Rendimiento deportivo", icon: "🏆" },
  { id: "rehabilitacion", label: "Rehabilitación", icon: "🩺" },
  { id: "salud_bienestar", label: "Salud y bienestar", icon: "🌿" },
  { id: "otro", label: "Otro", icon: "✨" },
] as const;

interface PerfilFormProps {
  initialData: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    dni: string;
    direccion: string | null;
    birthDate: Date | null;
    tieneLesion: boolean;
    detalleLesion: string | null;
    tomaMedicacion: boolean;
    detalleMedicacion: string | null;
    tieneRestricciones: boolean;
    detalleRestricciones: string | null;
    autorizadoPorMedico: boolean;
    observacionesSalud: string | null;
    emergenciaContacto: string | null;
    emergenciaParentesco: string | null;
    emergenciaTelefono: string | null;
    objetivos: string[];
    objetivoOtro: string | null;
  };
}

export function PerfilForm({ initialData }: PerfilFormProps) {
  const [formData, setFormData] = useState<PerfilFormData>({
    nombre: initialData.nombre || "",
    apellido: initialData.apellido || "",
    email: initialData.email || "",
    telefono: initialData.telefono || "",
    direccion: initialData.direccion || "",
    birthDate: initialData.birthDate
      ? new Date(initialData.birthDate).toISOString().split("T")[0]
      : "",
    tieneLesion: Boolean(initialData.tieneLesion),
    detalleLesion: initialData.detalleLesion || "",
    tomaMedicacion: Boolean(initialData.tomaMedicacion),
    detalleMedicacion: initialData.detalleMedicacion || "",
    tieneRestricciones: Boolean(initialData.tieneRestricciones),
    detalleRestricciones: initialData.detalleRestricciones || "",
    autorizadoPorMedico: Boolean(initialData.autorizadoPorMedico),
    observacionesSalud: initialData.observacionesSalud || "",
    emergenciaContacto: initialData.emergenciaContacto || "",
    emergenciaParentesco: initialData.emergenciaParentesco || "",
    emergenciaTelefono: initialData.emergenciaTelefono || "",
    objetivos: Array.isArray(initialData.objetivos) ? initialData.objetivos : [],
    objetivoOtro: initialData.objetivoOtro || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccessMessage(null);
    setErrorMessage(null);

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleToggleBoolean = (
    field:
      | "tieneLesion"
      | "tomaMedicacion"
      | "tieneRestricciones"
      | "autorizadoPorMedico",
    val: boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleToggleObjetivo = (objetivoId: string) => {
    setFormData((prev) => {
      const exists = prev.objetivos.includes(objetivoId);
      const nextObjetivos = exists
        ? prev.objetivos.filter((id) => id !== objetivoId)
        : [...prev.objetivos, objetivoId];
      return {
        ...prev,
        objetivos: nextObjetivos,
      };
    });
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!formData.apellido.trim())
      newErrors.apellido = "El apellido es obligatorio";
    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Formato de correo inválido";
    }
    if (!formData.telefono.trim())
      newErrors.telefono = "El teléfono / WhatsApp es obligatorio";

    if (formData.tieneLesion && !formData.detalleLesion?.trim()) {
      newErrors.detalleLesion = "Por favor indicá cuál es la lesión o condición médica";
    }
    if (formData.tomaMedicacion && !formData.detalleMedicacion?.trim()) {
      newErrors.detalleMedicacion = "Por favor indicá qué medicación tomás actualmente";
    }
    if (formData.tieneRestricciones && !formData.detalleRestricciones?.trim()) {
      newErrors.detalleRestricciones =
        "Por favor indicá cuál es la restricción para realizar actividad física";
    }
    if (
      formData.objetivos.includes("otro") &&
      !formData.objetivoOtro?.trim()
    ) {
      newErrors.objetivoOtro = "Por favor especificá cuál es tu otro objetivo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await actualizarDatosPerfil(formData);
      if (res.success) {
        setSuccessMessage(
          "¡Tu perfil, ficha de salud, contacto de emergencia y objetivos fueron guardados correctamente!"
        );
      } else {
        setErrorMessage(res.error || "Ocurrió un error al guardar los cambios");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Error inesperado al conectar con el servidor";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Mensajes de estado globales */}
      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          ✓ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400">
          ✕ {errorMessage}
        </div>
      )}

      {/* =====================================================================
          1. DATOS PERSONALES Y DE CONTACTO
          ===================================================================== */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-5">
        <div className="border-b border-border pb-4">
          <h2 className="text-lg font-bold text-content flex items-center gap-2">
            <span>👤</span>
            <span>Datos Personales y de Contacto</span>
          </h2>
          <p className="text-xs text-content-muted mt-0.5">
            Mantené actualizada tu información de contacto para recibir notificaciones y avisos del gimnasio.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            error={errors.nombre}
            placeholder="Tu nombre"
            required
          />

          <Input
            label="Apellido"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
            error={errors.apellido}
            placeholder="Tu apellido"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Correo Electrónico"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="tu.email@ejemplo.com"
            required
          />

          <Input
            label="Teléfono / WhatsApp"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            error={errors.telefono}
            placeholder="+54 9 11 1234-5678"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Dirección"
            name="direccion"
            value={formData.direccion || ""}
            onChange={handleChange}
            placeholder="Calle, número, ciudad"
          />

          <Input
            label="Fecha de Nacimiento"
            type="date"
            name="birthDate"
            value={formData.birthDate || ""}
            onChange={handleChange}
          />
        </div>

        {/* Campo DNI informativo / bloqueado */}
        <div className="rounded-xl border border-border bg-surface-hover/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-semibold text-content-muted uppercase">
              DNI / Documento
            </span>
            <p className="font-mono font-bold text-content text-sm mt-0.5">
              {initialData.dni}
            </p>
          </div>
          <span className="text-[11px] text-content-muted italic">
            Para modificar el DNI comunicate con la administración
          </span>
        </div>
      </div>

      {/* =====================================================================
          2. INFORMACIÓN DE SALUD (ANAMNESIS)
          ===================================================================== */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-5">
        <div className="border-b border-border pb-4">
          <h2 className="text-lg font-bold text-content flex items-center gap-2">
            <span>🩺</span>
            <span>Información de Salud</span>
          </h2>
          <p className="text-xs text-content-muted mt-0.5">
            Esta información ayuda a los entrenadores a adaptar tus ejercicios y cuidar tu seguridad durante el entrenamiento.
          </p>
        </div>

        <div className="space-y-4">
          {/* Pregunta 1: Lesión o condición médica */}
          <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-sm font-semibold text-content">
                ¿Posee alguna lesión o condición médica?
              </span>
              <div className="inline-flex rounded-lg border border-border bg-surface p-1 shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => handleToggleBoolean("tieneLesion", true)}
                  className={`px-3.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    formData.tieneLesion
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-content-muted hover:text-content"
                  }`}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleBoolean("tieneLesion", false)}
                  className={`px-3.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    !formData.tieneLesion
                      ? "bg-surface-hover text-content shadow-xs"
                      : "text-content-muted hover:text-content"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {formData.tieneLesion && (
              <div className="pt-1">
                <Input
                  label="¿Cuál?"
                  name="detalleLesion"
                  value={formData.detalleLesion || ""}
                  onChange={handleChange}
                  error={errors.detalleLesion}
                  placeholder="Ej: Hernia lumbar L5-S1, tendinitis de hombro derecho, asma..."
                />
              </div>
            )}
          </div>

          {/* Pregunta 2: Medicación actual */}
          <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-sm font-semibold text-content">
                ¿Toma medicación actualmente?
              </span>
              <div className="inline-flex rounded-lg border border-border bg-surface p-1 shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => handleToggleBoolean("tomaMedicacion", true)}
                  className={`px-3.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    formData.tomaMedicacion
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-content-muted hover:text-content"
                  }`}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleBoolean("tomaMedicacion", false)}
                  className={`px-3.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    !formData.tomaMedicacion
                      ? "bg-surface-hover text-content shadow-xs"
                      : "text-content-muted hover:text-content"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {formData.tomaMedicacion && (
              <div className="pt-1">
                <Input
                  label="¿Cuál?"
                  name="detalleMedicacion"
                  value={formData.detalleMedicacion || ""}
                  onChange={handleChange}
                  error={errors.detalleMedicacion}
                  placeholder="Indique la medicación que toma actualmente..."
                />
              </div>
            )}
          </div>

          {/* Pregunta 3: Restricciones para actividad física */}
          <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-sm font-semibold text-content">
                ¿Posee restricciones para realizar actividad física?
              </span>
              <div className="inline-flex rounded-lg border border-border bg-surface p-1 shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => handleToggleBoolean("tieneRestricciones", true)}
                  className={`px-3.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    formData.tieneRestricciones
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-content-muted hover:text-content"
                  }`}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleToggleBoolean("tieneRestricciones", false)
                  }
                  className={`px-3.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    !formData.tieneRestricciones
                      ? "bg-surface-hover text-content shadow-xs"
                      : "text-content-muted hover:text-content"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {formData.tieneRestricciones && (
              <div className="pt-1">
                <Input
                  label="¿Cuál?"
                  name="detalleRestricciones"
                  value={formData.detalleRestricciones || ""}
                  onChange={handleChange}
                  error={errors.detalleRestricciones}
                  placeholder="Ej: Evitar impacto vertical, no realizar carga axial pesada..."
                />
              </div>
            )}
          </div>

          {/* Pregunta 4: Autorización médica */}
          <div className="rounded-xl border border-border bg-background/50 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-sm font-semibold text-content">
                ¿Ha sido autorizado por un médico para realizar ejercicio físico?
              </span>
              <div className="inline-flex rounded-lg border border-border bg-surface p-1 shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() =>
                    handleToggleBoolean("autorizadoPorMedico", true)
                  }
                  className={`px-3.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    formData.autorizadoPorMedico
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-content-muted hover:text-content"
                  }`}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleToggleBoolean("autorizadoPorMedico", false)
                  }
                  className={`px-3.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    !formData.autorizadoPorMedico
                      ? "bg-surface-hover text-content shadow-xs"
                      : "text-content-muted hover:text-content"
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          {/* Observaciones relevantes */}
          <div className="space-y-1.5 pt-1">
            <label
              htmlFor="observacionesSalud"
              className="block text-xs font-semibold uppercase tracking-wider text-content-muted"
            >
              Observaciones relevantes
            </label>
            <textarea
              id="observacionesSalud"
              name="observacionesSalud"
              rows={3}
              value={formData.observacionesSalud || ""}
              onChange={handleChange}
              placeholder="Cualquier otra información médica, cirugías previas o comentarios relevantes para tu entrenador..."
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-content placeholder:text-content-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. DATOS DE EMERGENCIA
          ===================================================================== */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-5">
        <div className="border-b border-border pb-4">
          <h2 className="text-lg font-bold text-content flex items-center gap-2">
            <span>🚨</span>
            <span>Datos de Emergencia</span>
          </h2>
          <p className="text-xs text-content-muted mt-0.5">
            Persona de confianza a quien podamos contactar rápidamente ante cualquier eventualidad en el gimnasio.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Contacto de Emergencia"
            name="emergenciaContacto"
            value={formData.emergenciaContacto || ""}
            onChange={handleChange}
            placeholder="Nombre y apellido"
          />

          <Input
            label="Parentesco"
            name="emergenciaParentesco"
            value={formData.emergenciaParentesco || ""}
            onChange={handleChange}
            placeholder="Ej: Madre, Pareja, Hermano/a"
          />

          <Input
            label="Teléfono"
            name="emergenciaTelefono"
            value={formData.emergenciaTelefono || ""}
            onChange={handleChange}
            placeholder="Ej: +54 9 11 4444-5555"
          />
        </div>
      </div>

      {/* =====================================================================
          4. OBJETIVOS DE ENTRENAMIENTO (SELECCIÓN MÚLTIPLE)
          ===================================================================== */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-5">
        <div className="border-b border-border pb-4">
          <h2 className="text-lg font-bold text-content flex items-center gap-2">
            <span>🎯</span>
            <span>Objetivos</span>
          </h2>
          <p className="text-xs text-content-muted mt-0.5">
            Seleccioná uno o más objetivos para que tu entrenador oriente tu planificación semanal.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {OBJETIVOS_OPCIONES.map((item) => {
            const isSelected = formData.objetivos.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleToggleObjetivo(item.id)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary shadow-2xs"
                    : "border-border bg-background/50 text-content hover:bg-surface-hover"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-transparent"
                  }`}
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>

        {formData.objetivos.includes("otro") && (
          <div className="pt-1">
            <Input
              label="Otro objetivo (especificar)"
              name="objetivoOtro"
              value={formData.objetivoOtro || ""}
              onChange={handleChange}
              error={errors.objetivoOtro}
              placeholder="Describí tu objetivo específico..."
            />
          </div>
        )}
      </div>

      {/* Botón Guardar Global */}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          className="px-6 py-2.5"
        >
          Guardar Todos los Cambios
        </Button>
      </div>
    </form>
  );
}
