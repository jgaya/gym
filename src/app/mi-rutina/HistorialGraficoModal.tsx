"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getHistorialEjercicio, HistorialRegistroItem } from "./actions";

interface HistorialGraficoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ejercicio: {
    id: number;
    nombre: string;
  } | null;
  pesoActual: number;
}

export function HistorialGraficoModal({
  isOpen,
  onClose,
  ejercicio,
  pesoActual,
}: HistorialGraficoModalProps) {
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState<HistorialRegistroItem[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<HistorialRegistroItem | null>(null);

  useEffect(() => {
    if (isOpen && ejercicio) {
      setLoading(true);
      setHoveredPoint(null);
      getHistorialEjercicio(ejercicio.id)
        .then((data) => {
          setHistorial(data);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setHistorial([]);
    }
  }, [isOpen, ejercicio]);

  if (!ejercicio) return null;

  // Cálculos estadísticos
  const pesos = historial.map((h) => h.peso);
  const pesoInicial = pesos.length > 0 ? pesos[0] : pesoActual;
  const pesoMax = pesos.length > 0 ? Math.max(...pesos) : pesoActual;
  const pesoUltimo = pesos.length > 0 ? pesos[pesos.length - 1] : pesoActual;
  const delta = pesoUltimo - pesoInicial;
  const deltaPorcentaje = pesoInicial > 0 ? ((delta / pesoInicial) * 100).toFixed(1) : null;

  // Coordenadas para el gráfico SVG
  const chartWidth = 520;
  const chartHeight = 180;
  const paddingX = 35;
  const paddingTop = 25;
  const paddingBottom = 35;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const minVal = pesos.length > 0 ? Math.max(0, Math.floor(Math.min(...pesos) - 5)) : 0;
  const maxVal = pesos.length > 0 ? Math.ceil(Math.max(...pesos) + 5) : 50;
  const range = maxVal - minVal || 1;

  const points = historial.map((h, i) => {
    const x =
      historial.length === 1
        ? chartWidth / 2
        : paddingX + (i / (historial.length - 1)) * innerWidth;
    const y = paddingTop + innerHeight - ((h.peso - minVal) / range) * innerHeight;
    return { x, y, item: h };
  });

  const pathD =
    points.length === 1
      ? `M ${points[0].x} ${points[0].y}`
      : points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");

  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + innerHeight} L ${points[0].x} ${paddingTop + innerHeight} Z`
      : "";

  const formatFecha = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatFechaCompleta = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Evolución de Carga: ${ejercicio.nombre}`}
      description="Historial temporal y gráfico de sobrecarga progresiva en este ejercicio."
      maxWidth="2xl"
      footer={
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className="space-y-5">
        {loading ? (
          <div className="py-12 text-center text-content-muted">
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Cargando registros históricos...
            </div>
          </div>
        ) : historial.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-hover/20 p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h4 className="font-bold text-content text-base">Aún no hay registros de este ejercicio</h4>
            <p className="text-xs text-content-muted max-w-sm mx-auto">
              Cada vez que marques este ejercicio como completado o registres tu peso actual, se creará un punto en el gráfico para que veas tu curva de superación.
            </p>
          </div>
        ) : (
          <>
            {/* Tarjetas KPI de Métricas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
                <span className="text-[10px] uppercase font-bold text-content-muted tracking-wider block">
                  Carga Inicial
                </span>
                <span className="text-lg font-black text-content">
                  {pesoInicial} <span className="text-xs font-normal text-content-muted">kg</span>
                </span>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
                <span className="text-[10px] uppercase font-bold text-content-muted tracking-wider block">
                  Récord (PR)
                </span>
                <span className="text-lg font-black text-primary">
                  {pesoMax} <span className="text-xs font-normal text-content-muted">kg</span>
                </span>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
                <span className="text-[10px] uppercase font-bold text-content-muted tracking-wider block">
                  Carga Actual
                </span>
                <span className="text-lg font-black text-content">
                  {pesoUltimo} <span className="text-xs font-normal text-content-muted">kg</span>
                </span>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
                <span className="text-[10px] uppercase font-bold text-content-muted tracking-wider block">
                  Progreso Total
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-lg font-black ${delta > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : delta < 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-content-muted"
                      }`}
                  >
                    {delta > 0 ? `+${delta}` : delta} kg
                  </span>
                  {deltaPorcentaje && delta > 0 && (
                    <Badge variant="success" className="text-[9px] px-1 py-0">
                      +{deltaPorcentaje}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Gráfico SVG de Evolución */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-content">
                  Curva de Progresión de Peso (kg)
                </span>
                <span className="text-[11px] text-content-muted">
                  {historial.length} {historial.length === 1 ? "registro" : "registros"}
                </span>
              </div>

              <div className="relative w-full overflow-hidden rounded-lg bg-surface-hover/30 pt-2 pb-1">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-48 select-none"
                >
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary, #16a34a)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--color-primary, #16a34a)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Líneas de cuadrícula horizontal */}
                  {[minVal, Math.round((minVal + maxVal) / 2), maxVal].map((val, idx) => {
                    const y = paddingTop + innerHeight - ((val - minVal) / range) * innerHeight;
                    return (
                      <g key={idx}>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={chartWidth - paddingX}
                          y2={y}
                          stroke="currentColor"
                          strokeOpacity="0.1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={paddingX - 6}
                          y={y + 3}
                          textAnchor="end"
                          fontSize="9"
                          fill="currentColor"
                          opacity="0.5"
                          fontWeight="600"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Área degradada debajo de la curva */}
                  {areaD && <path d={areaD} fill="url(#areaGradient)" />}

                  {/* Línea principal del gráfico */}
                  {points.length > 1 && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="var(--color-primary, #16a34a)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Puntos de datos */}
                  {points.map((p, idx) => (
                    <g
                      key={idx}
                      className="cursor-pointer transition-transform hover:scale-125"
                      onMouseEnter={() => setHoveredPoint(p.item)}
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="5"
                        fill="var(--color-primary, #16a34a)"
                        stroke="var(--color-surface, #ffffff)"
                        strokeWidth="2"
                      />
                      {/* Etiqueta de fecha en el eje X */}
                      <text
                        x={p.x}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        fontSize="9"
                        fill="currentColor"
                        opacity="0.6"
                        fontWeight="600"
                      >
                        {formatFecha(p.item.fecha)}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Tooltip de punto inspeccionado */}
                {hoveredPoint && (
                  <div className="absolute top-2 right-3 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs shadow-md">
                    <span className="font-extrabold text-primary">{hoveredPoint.peso} kg</span>
                    <span className="text-content-muted ml-1.5 text-[10px]">
                      {formatFecha(hoveredPoint.fecha)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Listado de Sesiones Registradas */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-content">
                Detalle Cronológico de Entrenamientos
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {historial
                  .slice()
                  .reverse()
                  .map((item, idx, arr) => {
                    const anterior = arr[idx + 1];
                    const diff = anterior ? item.peso - anterior.peso : null;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-surface-hover/20 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                            ✓
                          </span>
                          <span className="font-medium text-content">
                            {formatFechaCompleta(item.fecha)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {diff !== null && diff !== 0 && (
                            <span
                              className={`text-[11px] font-bold ${diff > 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                                }`}
                            >
                              {diff > 0 ? `+${diff}` : diff} kg
                            </span>
                          )}
                          <span className="font-black text-content bg-surface border border-border px-2 py-0.5 rounded text-xs">
                            {item.peso} kg
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

