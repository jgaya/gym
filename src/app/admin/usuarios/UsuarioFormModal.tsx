"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Role } from "@lib/generated/prisma/enums";
import {
  UsuarioItem,
  UsuarioFormData,
  crearUsuario,
  actualizarUsuario,
} from "./actions";

interface PlanOption {
  id: number;
  nombre: string;
  diasPorSemana: number;
}

interface UsuarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario?: UsuarioItem | null;
  planes: PlanOption[];
  onSuccess: () => void;
}

export function UsuarioFormModal({
  isOpen,
  onClose,
  usuario,
  planes,
  onSuccess,
}: UsuarioFormModalProps) {
  const isEditing = Boolean(usuario);

  const [formData, setFormData] = useState<UsuarioFormData>({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    dni: "",
    direccion: "",
    birthDate: "",
    role: Role.USER,
    password: "",
    planId: null,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Inicializar formulario con datos de edición o defaults
  useEffect(() => {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre || "",
        apellido: usuario.apellido || "",
        email: usuario.email || "",
        telefono: usuario.telefono || "",
        dni: usuario.dni || "",
        direccion: usuario.direccion || "",
        birthDate: usuario.birthDate
          ? new Date(usuario.birthDate).toISOString().split("T")[0]
          : "",
        role: usuario.role || Role.USER,
        password: "",
        planId: usuario.planId || null,
        isActive: usuario.isActive ?? true,
      });
    } else {
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        dni: "",
        direccion: "",
        birthDate: "",
        role: Role.USER,
        password: "",
        planId: null,
        isActive: true,
      });
    }
    setErrors({});
    setGeneralError(null);
  }, [usuario, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "planId") {
      setFormData((prev) => ({
        ...prev,
        planId: value ? Number(value) : null,
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
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!formData.apellido.trim()) newErrors.apellido = "El apellido es obligatorio";
    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Formato de correo electrónico inválido";
    }
    if (!formData.dni.trim()) newErrors.dni = "El DNI es obligatorio";
    if (!formData.telefono.trim()) newErrors.telefono = "El teléfono / WhatsApp es obligatorio";

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
      if (isEditing && usuario) {
        result = await actualizarUsuario(usuario.id, formData);
      } else {
        result = await crearUsuario(formData);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setGeneralError(result.error || "Ocurrió un error al procesar el formulario");
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
      title={isEditing ? `Modificar Miembro: ${usuario?.nombre} ${usuario?.apellido}` : "Alta de Nuevo Miembro"}
      description="Completá la información del usuario del gimnasio."
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
            {isEditing ? "Guardar Cambios" : "Crear Usuario"}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            error={errors.nombre}
            placeholder="Ej: Juan"
            required
          />

          <Input
            label="Apellido"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
            error={errors.apellido}
            placeholder="Ej: Pérez"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="juan.perez@ejemplo.com"
            required
          />

          <Input
            label="DNI"
            name="dni"
            value={formData.dni}
            onChange={handleChange}
            error={errors.dni}
            placeholder="Ej: 38450123"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Teléfono / WhatsApp"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            error={errors.telefono}
            placeholder="Ej: +54 9 11 1234-5678"
            required
          />

          <Input
            label="Fecha de Nacimiento"
            type="date"
            name="birthDate"
            value={formData.birthDate || ""}
            onChange={handleChange}
          />
        </div>

        <Input
          label="Dirección"
          name="direccion"
          value={formData.direccion || ""}
          onChange={handleChange}
          placeholder="Ej: Av. Santa Fe 1234, CABA"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Rol de Usuario"
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            <option value={Role.USER}>Usuario (Miembro del Gym)</option>
            <option value={Role.ADMIN}>Administrador</option>
            <option value={Role.SUPERADMIN}>Super Administrador</option>
          </Select>

          <Select
            label="Plan de Entrenamiento"
            name="planId"
            value={formData.planId ?? ""}
            onChange={handleChange}
          >
            <option value="">Sin plan asignado</option>
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.diasPorSemana} días/sem)
              </option>
            ))}
          </Select>
        </div>

        {(formData.role === Role.ADMIN || formData.role === Role.SUPERADMIN) && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
              <span>🔐</span>
              <span>Seguridad de Acceso Administrativo</span>
            </div>
            <Input
              label="Contraseña"
              type="password"
              name="password"
              value={formData.password || ""}
              onChange={handleChange}
              placeholder={isEditing ? "Dejar vacío para no modificar la contraseña actual" : "admin123 (por defecto)"}
              helperText={
                isEditing
                  ? "Solo completá este campo si deseás cambiar la contraseña del administrador."
                  : "Contraseña para ingresar al panel. Si la dejás vacía, será 'admin123'."
              }
            />
          </div>
        )}

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
            Miembro activo en el gimnasio
          </label>
        </div>
      </form>
    </Modal>
  );
}
