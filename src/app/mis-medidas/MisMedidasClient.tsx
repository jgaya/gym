"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MedidaIndividualModal } from "./MedidaIndividualModal";
import { MedidasGraficoEvolucion } from "./MedidasGraficoEvolucion";
import { eliminarMedida, getMisMedidas, getTiposMetricas } from "./actions";
import { type MedidaItem, type MetricaDef } from "./types";

interface MisMedidasClientProps {
  initialMedidas: MedidaItem[];
  initialMetricas: MetricaDef[];
  nombreUsuario: string;
}

export function MisMedidasClient({
  initialMedidas,
  initialMetricas,
  nombreUsuario,
}: MisMedidasClientProps) {
  const [medidas, setMedidas] = useState<MedidaItem[]>(initialMedidas);
  const [metricas, setMetricas] = useState<MetricaDef[]>(initialMetricas);
  const [selectedMetricaKey, setSelectedMetricaKey] = useState<string>("peso");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [medidaAEditar, setMedidaAEditar] = useState<MedidaItem | null>(null);
  const [tipoParaRegistrar, setTipoParaRegistrar] = useState<string>("peso");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filtroTabla, setFiltroTabla] = useState<string>("todos");
  const [isPending, startTransition] = useTransition();

  const reloadData = async (nuevoTipoKey?: string) => {
    const [nuevasMedidas, nuevasMetricas] = await Promise.all([
      getMisMedidas(),
      getTiposMetricas(),
    ]);
    setMedidas(nuevasMedidas);
    setMetricas(nuevasMetricas);

    if (nuevoTipoKey) {
      setSelectedMetricaKey(nuevoTipoKey);
    }
  };

  const handleOpenCrear = (tipoKey?: string) => {
    setMedidaAEditar(null);
    setTipoParaRegistrar(tipoKey || selectedMetricaKey);
    setIsModalOpen(true);
  };

  const handleOpenEditar = (medida: MedidaItem) => {
    setMedidaAEditar(medida);
    setTipoParaRegistrar(medida.tipo);
    setIsModalOpen(true);
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar este registro de medida?")) {
      return;
    }

    setDeletingId(id);
    startTransition(async () => {
      try {
        const res = await eliminarMedida(id);
        if (res.success) {
          await reloadData();
        } else {
          alert(res.error || "No se pudo eliminar el registro");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error inesperado";
        alert(msg);
      } finally {
        setDeletingId(null);
      }
    });
  };

  // Medidas filtradas para la tabla
  const medidasFiltradas = medidas
    .filter((m) => (filtroTabla === "todos" ? true : m.tipo === filtroTabla))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const formatFecha = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Barra de Bienvenida y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span>Área de Miembros</span>
            <span className="text-content-muted">•</span>
            <span>Progreso y Medidas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content mt-1">
            Mis Medidas Corporales
          </h1>
          <p className="text-sm text-content-muted mt-1 max-w-2xl">
            Cargá tus medidas de forma individual (solo el peso, solo la cintura o la que quieras) o creá nuevas medidas personalizadas a tu gusto.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => handleOpenCrear()}
            className="shadow-sm"
          >
            <span>+</span>
            <span>Cargar Medición</span>
          </Button>
        </div>
      </div>

      {/* Tarjetas de Acceso Rápido para Carga de 1-Clic */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-content-muted">
            Acceso Rápido por Zona
          </span>
          <span className="text-xs text-content-muted">
            Podés cargar solo la medida que te interese hoy
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {metricas.slice(0, 6).map((m) => {
            const ultimoRegistro = [...medidas]
              .filter((item) => item.tipo === m.key)
              .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];

            return (
              <button
                key={m.key}
                type="button"
                onClick={() => handleOpenCrear(m.key)}
                className="group flex flex-col justify-between p-3 rounded-xl border border-border bg-surface hover:border-primary/50 hover:bg-surface-hover/60 transition-all text-left shadow-2xs cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{m.icono}</span>
                  <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    + Cargar
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-xs font-bold text-content block truncate">
                    {m.label}
                  </span>
                  <span className="text-[11px] font-black text-content-muted mt-0.5 block">
                    {ultimoRegistro ? (
                      <span className="text-content font-bold">
                        {ultimoRegistro.valor} {m.unidad}
                      </span>
                    ) : (
                      "Sin datos"
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gráfico de Evolución Temporal */}
      <MedidasGraficoEvolucion
        medidas={medidas}
        metricasDisponibles={metricas}
        selectedMetricaKey={selectedMetricaKey}
        onSelectMetricaKey={setSelectedMetricaKey}
        onCrearNuevaMedidaClick={() => handleOpenCrear()}
      />

      {/* Historial Detallado de Controles */}
      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h3 className="text-base font-bold text-content flex items-center gap-2">
              <span>📋</span>
              <span>Historial de Mediciones</span>
            </h3>
            <p className="text-xs text-content-muted mt-0.5">
              Listado de todos tus controles registrados
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="filtro-medida-tabla" className="text-xs font-bold text-content-muted">
              Filtrar:
            </label>
            <select
              id="filtro-medida-tabla"
              value={filtroTabla}
              onChange={(e) => setFiltroTabla(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-content focus:border-primary focus:outline-none"
            >
              <option value="todos">Todas las medidas ({medidas.length})</option>
              {metricas.map((m) => {
                const count = medidas.filter((item) => item.tipo === m.key).length;
                return (
                  <option key={m.key} value={m.key}>
                    {m.icono} {m.label} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {medidasFiltradas.length === 0 ? (
          <div className="py-12 text-center text-sm text-content-muted">
            <span className="text-4xl block mb-2">⚖️</span>
            {medidas.length === 0
              ? "No tenés mediciones registradas todavía. Presioná en '+ Cargar Medición' para registrar la primera."
              : "No hay registros con el filtro seleccionado."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-hover/30 text-content-muted font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Medida / Zona</th>
                  <th className="py-3 px-3">Valor</th>
                  <th className="py-3 px-3">Notas</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {medidasFiltradas.map((item) => {
                  const metrica = metricas.find((m) => m.key === item.tipo);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-hover/40 transition-colors"
                    >
                      <td className="py-3 px-3 font-bold text-content whitespace-nowrap">
                        {formatFecha(item.fecha)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-content whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <span>{metrica?.icono || "📏"}</span>
                          <span>{item.nombre}</span>
                          {metrica?.esPersonalizada && (
                            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold">
                              Custom
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-black text-primary text-sm whitespace-nowrap">
                        {item.valor} <span className="text-xs font-semibold text-content-muted">{item.unidad}</span>
                      </td>
                      <td className="py-3 px-3 text-content-muted max-w-[240px] truncate" title={item.notas || ""}>
                        {item.notas || "-"}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditar(item)}
                            className="p-1.5 rounded-md text-content-muted hover:text-content hover:bg-surface-hover transition-colors cursor-pointer"
                            title="Editar registro"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminar(item.id)}
                            disabled={deletingId === item.id}
                            className="p-1.5 rounded-md text-content-muted hover:text-red-500 hover:bg-surface-hover transition-colors disabled:opacity-50 cursor-pointer"
                            title="Eliminar registro"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Registrar Medición Individual o Crear Nueva Medida */}
      <MedidaIndividualModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        metricasDisponibles={metricas}
        medidaAEditar={medidaAEditar}
        tipoPreseleccionado={tipoParaRegistrar}
        onSuccess={reloadData}
      />
    </div>
  );
}
