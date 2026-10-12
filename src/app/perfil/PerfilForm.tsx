"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { actualizarDatosPerfil, PerfilFormData } from "./actions";

interface PerfilFormProps {
  initialData: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    dni: string;
    direccion: string | null;
    birthDate: Date | null;
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!formData.apellido.trim()) newErrors.apellido = "El apellido es obligatorio";
    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Formato de correo inválido";
    }
    if (!formData.telefono.trim()) newErrors.telefono = "El teléfono / WhatsApp es obligatorio";

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
        setSuccessMessage("¡Tus datos personales fueron actualizados correctamente!");
      } else {
        setErrorMessage(res.error || "Ocurrió un error al guardar los cambios");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado al conectar con el servidor";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-lg font-bold text-content">
          Datos Personales y de Contacto
        </h2>
        <p className="text-xs text-content-muted mt-0.5">
          Mantené actualizada tu información de contacto para recibir notificaciones y avisos del gimnasio.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {successMessage && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            ✓ {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
            ✕ {errorMessage}
          </div>
        )}

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
        <div className="rounded-xl border border-border bg-surface-hover/30 p-3 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-content-muted uppercase">DNI / Documento</span>
            <p className="font-mono font-bold text-content text-sm mt-0.5">{initialData.dni}</p>
          </div>
          <span className="text-[11px] text-content-muted italic">
            Para modificar el DNI comunicate con la administración
          </span>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  );
}

