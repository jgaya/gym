"use client";

import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  registrarMedidaIndividual,
  actualizarMedidaIndividual,
  crearTipoMedidaPersonalizada,
} from "./actions";
import { type MedidaItem, type MetricaDef } from "./types";

interface MedidaIndividualModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricasDisponibles: MetricaDef[];
  medidaAEditar?: MedidaItem | null;
  tipoPreseleccionado?: string;
  onSuccess: (nuevoTipoKey?: string) => void;
}

const ICONOS_SUGERIDOS = ["📏", "⚖️", "💪", "🦵", "🦶", "📐", "🫁", "🏋️", "📉", "🎯", "🏷️"];
const COLORES_SUGERIDOS = [
  "#3b82f6", // Azul
  "#10b981", // Esmeralda
  "#f59e0b", // Ámbar
  "#ec4899", // Rosa
  "#8b5cf6", // Violeta
  "#06b6d4", // Cian
  "#f97316", // Naranja
  "#14b8a6", // Verde azulado
  "#84cc16", // Lima
];

export function MedidaIndividualModal({
  isOpen,
  onClose,
  metricasDisponibles,
  medidaAEditar,
  tipoPreseleccionado,
  onSuccess,
}: MedidaIndividualModalProps) {
  // Pestaña en el modal: "registrar" o "crear_tipo"
  const [modoCrearTipo, setModoCrearTipo] = useState(false);

  // Campos para registrar/editar una medición
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>(() => {
    if (medidaAEditar) return medidaAEditar.tipo;
    if (tipoPreseleccionado) return tipoPreseleccionado;
    return metricasDisponibles[0]?.key || "peso";
  });

  const [valor, setValor] = useState<string>(() => {
    if (medidaAEditar) return String(medidaAEditar.valor);
    return "";
  });

  const [fecha, setFecha] = useState<string>(() => {
    if (medidaAEditar?.fecha) return medidaAEditar.fecha.split("T")[0];
    return new Date().toISOString().split("T")[0];
  });

  const [notas, setNotas] = useState<string>(medidaAEditar?.notas || "");

  // Campos para crear un nuevo tipo de medida personalizado
  const [nuevoNombreTipo, setNuevoNombreTipo] = useState("");
  const [nuevaUnidadTipo, setNuevaUnidadTipo] = useState("cm");
  const [nuevoIconoTipo, setNuevoIconoTipo] = useState("📏");
  const [nuevoColorTipo, setNuevoColorTipo] = useState("#8b5cf6");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Resetear estados al abrir/cambiar props
  React.useEffect(() => {
    if (medidaAEditar) {
      setTipoSeleccionado(medidaAEditar.tipo);
      setValor(String(medidaAEditar.valor));
      setFecha(medidaAEditar.fecha.split("T")[0]);
      setNotas(medidaAEditar.notas || "");
      setModoCrearTipo(false);
    } else {
      setTipoSeleccionado(tipoPreseleccionado || metricasDisponibles[0]?.key || "peso");
      setValor("");
      setFecha(new Date().toISOString().split("T")[0]);
      setNotas("");
      setModoCrearTipo(false);
    }
    setErrorMsg(null);
  }, [medidaAEditar, tipoPreseleccionado, isOpen, metricasDisponibles]);

  const metricaActual =
    metricasDisponibles.find((m) => m.key === tipoSeleccionado) || metricasDisponibles[0];

  // Enviar formulario de registro de valor
  const handleGuardarMedida = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const valNum = parseFloat(valor);
    if (isNaN(valNum) || valNum <= 0) {
      setErrorMsg("Ingresá un valor numérico válido mayor a 0");
      return;
    }

    startTransition(async () => {
      try {
        if (medidaAEditar) {
          const res = await actualizarMedidaIndividual(medidaAEditar.id, {
            tipo: tipoSeleccionado,
            nombre: metricaActual?.label,
            unidad: metricaActual?.unidad,
            valor: valNum,
            fecha: `${fecha}T12:00:00.000Z`,
            notas: notas.trim() || null,
          });

          if (res.success) {
            onSuccess(tipoSeleccionado);
            onClose();
          } else {
            setErrorMsg(res.error || "No se pudo actualizar la medida");
          }
        } else {
          const res = await registrarMedidaIndividual({
            tipo: tipoSeleccionado,
            nombre: metricaActual?.label,
            unidad: metricaActual?.unidad,
            valor: valNum,
            fecha: `${fecha}T12:00:00.000Z`,
            notas: notas.trim() || null,
          });

          if (res.success) {
            onSuccess(tipoSeleccionado);
            onClose();
          } else {
            setErrorMsg(res.error || "No se pudo registrar la medida");
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error inesperado";
        setErrorMsg(msg);
      }
    });
  };

  // Enviar formulario para crear un nuevo tipo de medida
  const handleCrearNuevoTipo = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nuevoNombreTipo.trim()) {
      setErrorMsg("El nombre de la nueva medida es obligatorio");
      return;
    }

    startTransition(async () => {
      try {
        const res = await crearTipoMedidaPersonalizada({
          nombre: nuevoNombreTipo.trim(),
          unidad: nuevaUnidadTipo.trim() || "cm",
          icono: nuevoIconoTipo,
          color: nuevoColorTipo,
        });

        if (res.success && res.tipoMedida) {
          // Seleccionar automáticamente la recién creada y volver al modo de carga
          setTipoSeleccionado(res.tipoMedida.key);
          setModoCrearTipo(false);
          setNuevoNombreTipo("");
          onSuccess(res.tipoMedida.key);
        } else {
          setErrorMsg(res.error || "No se pudo crear la nueva medida");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error al crear la medida";
        setErrorMsg(msg);
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        modoCrearTipo
          ? "Definir Nueva Medida Personalizada"
          : medidaAEditar
            ? "Editar Registro de Medida"
            : "Registrar Nueva Medición"
      }
      description={
        modoCrearTipo
          ? "Podés agregar cualquier perímetro o parámetro corporal que quieras controlar (ej: Glúteos, Antebrazo Izq, Pliegue, etc.)"
          : "Cargá el valor medido para la zona o parámetro seleccionado."
      }
      maxWidth="lg"
    >
      {errorMsg && (
        <div className="mb-4 p-3 text-xs rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 font-medium">
          ⚠️ {errorMsg}
        </div>
      )}

      {modoCrearTipo ? (
        /* Formulario para Crear un Nuevo Tipo de Medida */
        <form onSubmit={handleCrearNuevoTipo} className="space-y-4">
          <div>
            <label htmlFor="nuevo-nombre-tipo" className="block text-xs font-bold uppercase tracking-wider text-content mb-1">
              Nombre de la Medida *
            </label>
            <input
              id="nuevo-nombre-tipo"
              type="text"
              required
              placeholder="Ej: Glúteos, Cuádriceps Superior, Gemelo Izquierdo..."
              value={nuevoNombreTipo}
              onChange={(e) => setNuevoNombreTipo(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-content placeholder:text-content-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="nueva-unidad-tipo" className="block text-xs font-bold uppercase tracking-wider text-content mb-1">
                Unidad
              </label>
              <select
                id="nueva-unidad-tipo"
                value={nuevaUnidadTipo}
                onChange={(e) => setNuevaUnidadTipo(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="cm">cm (Centímetros)</option>
                <option value="kg">kg (Kilogramos)</option>
                <option value="%">% (Porcentaje)</option>
                <option value="mm">mm (Milímetros)</option>
                <option value="puntos">pts (Puntos / Escala)</option>
              </select>
            </div>

            <div>
              <label htmlFor="nuevo-icono-tipo" className="block text-xs font-bold uppercase tracking-wider text-content mb-1">
                Ícono
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {ICONOS_SUGERIDOS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setNuevoIconoTipo(ic)}
                    className={`h-7 w-7 rounded-lg text-sm flex items-center justify-center border transition-all cursor-pointer ${
                      nuevoIconoTipo === ic
                        ? "border-primary bg-primary/20 scale-110"
                        : "border-border bg-surface hover:bg-surface-hover"
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-content mb-1.5">
              Color Distintivo para Gráficos
            </label>
            <div className="flex items-center gap-2">
              {COLORES_SUGERIDOS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setNuevoColorTipo(col)}
                  style={{ backgroundColor: col }}
                  className={`h-6 w-6 rounded-full transition-transform cursor-pointer ${
                    nuevoColorTipo === col ? "ring-2 ring-content ring-offset-2 scale-110" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModoCrearTipo(false)}
              disabled={isPending}
            >
              ← Volver a Carga
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isPending}>
              {isPending ? "Guardando..." : "Crear Medida"}
            </Button>
          </div>
        </form>
      ) : (
        /* Formulario para Registrar una Medición Individual */
        <form onSubmit={handleGuardarMedida} className="space-y-5">
          {/* Selector de Medida con botón para crear nueva */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="selector-tipo-medida" className="block text-xs font-bold uppercase tracking-wider text-content">
                ¿Qué medida querés registrar? *
              </label>
              {!medidaAEditar && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setModoCrearTipo(true);
                  }}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>+</span>
                  <span>Crear nueva medida</span>
                </button>
              )}
            </div>

            <div className="relative">
              <select
                id="selector-tipo-medida"
                value={tipoSeleccionado}
                disabled={Boolean(medidaAEditar)}
                onChange={(e) => setTipoSeleccionado(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-70"
              >
                <optgroup label="Medidas Preestablecidas">
                  {metricasDisponibles
                    .filter((m) => !m.esPersonalizada)
                    .map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.icono} {m.label} ({m.unidad})
                      </option>
                    ))}
                </optgroup>
                {metricasDisponibles.some((m) => m.esPersonalizada) && (
                  <optgroup label="Tus Medidas Personalizadas">
                    {metricasDisponibles
                      .filter((m) => m.esPersonalizada)
                      .map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.icono} {m.label} ({m.unidad})
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          {/* Valor a registrar */}
          <div className="bg-surface-hover/30 border border-border p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="valor-medida-individual" className="block text-xs font-bold uppercase tracking-wider text-content">
                Valor medido ({metricaActual?.unidad}) *
              </label>
              <span className="text-xs font-black text-primary px-2 py-0.5 rounded bg-primary/10">
                {metricaActual?.icono} {metricaActual?.label}
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                id="valor-medida-individual"
                type="number"
                step="0.1"
                min="0"
                autoFocus
                required
                placeholder={`Ej: ${metricaActual?.key === "peso" ? "78.5" : "84.0"}`}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xl font-black text-content placeholder:text-content-muted/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary pr-14"
              />
              <span className="absolute right-4 text-sm font-bold text-content-muted pointer-events-none">
                {metricaActual?.unidad}
              </span>
            </div>
          </div>

          {/* Fecha de la medición */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border p-3.5 rounded-xl">
            <div>
              <label htmlFor="fecha-medida-individual" className="block text-xs font-bold uppercase tracking-wider text-content">
                Fecha del Control
              </label>
              <p className="text-[11px] text-content-muted">
                Día en que realizaste la medición
              </p>
            </div>
            <input
              id="fecha-medida-individual"
              type="date"
              value={fecha}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-content focus:border-primary focus:outline-none shadow-2xs"
            />
          </div>

          {/* Notas opcionales */}
          <div>
            <label htmlFor="notas-medida-individual" className="block text-xs font-bold uppercase tracking-wider text-content-muted mb-1">
              Notas u Observaciones (Opcional)
            </label>
            <textarea
              id="notas-medida-individual"
              rows={2}
              placeholder="Ej: En ayunas, antes de desayunar..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-content placeholder:text-content-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending
                ? "Guardando..."
                : medidaAEditar
                  ? "Actualizar Medición"
                  : `Guardar ${metricaActual?.label || "Medición"}`}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

