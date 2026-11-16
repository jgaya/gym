"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  SucursalItem,
  SucursalFormData,
  crearSucursal,
  actualizarSucursal,
} from "./actions";

interface SucursalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  sucursal?: SucursalItem | null;
  onSuccess: () => void;
}

export function SucursalFormModal({
  isOpen,
  onClose,
  sucursal,
  onSuccess,
}: SucursalFormModalProps) {
  const isEditing = Boolean(sucursal);

  const [formData, setFormData] = useState<SucursalFormData>({
    barrio: "",
    direccion: "",
    telefono: "",
    horarios: "",
    imagen: "",
    urlInstagram: "",
    urlTiktok: "",
    tieneKiosco: true,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (sucursal) {
      setFormData({
        barrio: sucursal.barrio || "",
        direccion: sucursal.direccion || "",
        telefono: sucursal.telefono || "",
        horarios: sucursal.horarios || "",
        imagen: sucursal.imagen || "",
        urlInstagram: sucursal.urlInstagram || "",
        urlTiktok: sucursal.urlTiktok || "",
        tieneKiosco: sucursal.tieneKiosco ?? true,
        isActive: sucursal.isActive ?? true,
      });
    } else {
      setFormData({
        barrio: "",
        direccion: "",
        telefono: "",
        horarios: "Lun a Vie: 07:00 a 21:00",
        imagen: "/hero-gym.jpg",
        urlInstagram: "https://www.instagram.com/merakicentrodeentrenamiento/",
        urlTiktok: "https://www.tiktok.com/@merakisport.tandil",
        tieneKiosco: true,
        isActive: true,
      });
    }
    setErrors({});
    setGeneralError(null);
  }, [sucursal, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
    if (!formData.barrio.trim()) {
      newErrors.barrio = "El barrio es obligatorio";
    }
    if (!formData.direccion.trim()) {
      newErrors.direccion = "La dirección es obligatoria";
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es obligatorio";
    }
    if (!formData.horarios.trim()) {
      newErrors.horarios = "Los horarios son obligatorios";
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
      if (isEditing && sucursal) {
        result = await actualizarSucursal(sucursal.id, formData);
      } else {
        result = await crearSucursal(formData);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setGeneralError(result.error || "Ocurrió un error al guardar la sucursal");
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
          ? `Modificar Sucursal: ${sucursal?.barrio}`
          : "Crear Nueva Sucursal"
      }
      description="Completá los datos de ubicación, contacto, redes sociales y horarios de la sede."
      maxWidth="lg"
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
            {isEditing ? "Guardar Cambios" : "Crear Sucursal"}
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
            label="Barrio / Nombre de Sede"
            name="barrio"
            value={formData.barrio}
            onChange={handleChange}
            error={errors.barrio}
            placeholder="Ej: El Tropezon / Villa Italia / Gardey"
            required
          />

          <Input
            label="Dirección"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            error={errors.direccion}
            placeholder="Ej: Av. Lunghi 2176"
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
            placeholder="Ej: +54 9 249 412-3451"
            required
          />

          <Input
            label="URL o Ruta de Imagen"
            name="imagen"
            value={formData.imagen || ""}
            onChange={handleChange}
            placeholder="Ej: /hero-gym.jpg o https://..."
          />
        </div>

        <div className="w-full space-y-1.5">
          <label
            htmlFor="horarios"
            className="block text-xs font-semibold uppercase tracking-wider text-content"
          >
            Horarios de Atención *
          </label>
          <textarea
            id="horarios"
            name="horarios"
            rows={2}
            value={formData.horarios}
            onChange={handleChange}
            placeholder="Ej: Lun a Vie: 06:30 a 11:30 | 14:30 a 21:00"
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-content placeholder:text-content-muted transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary hover:border-content-muted/50"
          />
          {errors.horarios && (
            <p className="text-xs font-medium text-red-500">{errors.horarios}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="URL Instagram"
            name="urlInstagram"
            value={formData.urlInstagram || ""}
            onChange={handleChange}
            placeholder="https://www.instagram.com/..."
          />

          <Input
            label="URL TikTok"
            name="urlTiktok"
            value={formData.urlTiktok || ""}
            onChange={handleChange}
            placeholder="https://www.tiktok.com/@..."
          />
        </div>

        <div className="pt-2 space-y-2.5">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="tieneKioscoSucursal"
              name="tieneKiosco"
              checked={formData.tieneKiosco}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tieneKiosco: e.target.checked }))
              }
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <label
              htmlFor="tieneKioscoSucursal"
              className="text-sm font-medium text-content cursor-pointer"
            >
              🥤 Habilitar Kiosco / Ventas rápidas en mostrador para esta sucursal
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveSucursal"
              name="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <label
              htmlFor="isActiveSucursal"
              className="text-sm font-medium text-content cursor-pointer"
            >
              Sucursal activa para asignación de usuarios y visualización pública
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
