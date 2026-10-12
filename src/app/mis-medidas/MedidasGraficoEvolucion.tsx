"use client";

import React, { useState } from "react";
import { type MedidaItem, type MetricaDef } from "./types";

interface MedidasGraficoEvolucionProps {
  medidas: MedidaItem[];
  metricasDisponibles: MetricaDef[];
  selectedMetricaKey: string;
  onSelectMetricaKey: (key: string) => void;
  onCrearNuevaMedidaClick: () => void;
}

export function MedidasGraficoEvolucion({
  medidas,
  metricasDisponibles,
  selectedMetricaKey,
  onSelectMetricaKey,
  onCrearNuevaMedidaClick,
}: MedidasGraficoEvolucionProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    valor: number;
    fecha: string;
    notas: string | null;
  } | null>(null);

  const metricaActual: MetricaDef =
    metricasDisponibles.find((m) => m.key === selectedMetricaKey) ||
    metricasDisponibles[0];

  // Filtrar registros que pertenezcan a la métrica seleccionada
  const dataPuntos = medidas
    .filter((m) => m.tipo === metricaActual?.key && typeof m.valor === "number" && m.valor > 0)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .map((m) => ({
      id: m.id,
      fecha: m.fecha,
      valor: m.valor,
      notas: m.notas,
    }));

  // Estadísticas
  const valores = dataPuntos.map((d) => d.valor);
  const valorInicial = valores.length > 0 ? valores[0] : null;
  const valorActual = valores.length > 0 ? valores[valores.length - 1] : null;
  const valorMin = valores.length > 0 ? Math.min(...valores) : null;
  const valorMax = valores.length > 0 ? Math.max(...valores) : null;
  const delta = valorActual !== null && valorInicial !== null ? valorActual - valorInicial : 0;
  const deltaPorcentaje =
    valorInicial && valorInicial > 0 ? ((delta / valorInicial) * 100).toFixed(1) : null;

  // Dimensiones del SVG
  const chartWidth = 680;
  const chartHeight = 240;
  const paddingX = 45;
  const paddingTop = 30;
  const paddingBottom = 45;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const minEscala =
    valorMin !== null ? Math.max(0, Math.floor(valorMin - 2)) : 0;
  const maxEscala =
    valorMax !== null ? Math.ceil(valorMax + 2) : 100;
  const range = maxEscala - minEscala || 1;

  const points = dataPuntos.map((d, i) => {
    const x =
      dataPuntos.length === 1
        ? chartWidth / 2
        : paddingX + (i / (dataPuntos.length - 1)) * innerWidth;
    const y = paddingTop + innerHeight - ((d.valor - minEscala) / range) * innerHeight;
    return {
      x,
      y,
      valor: d.valor,
      fecha: d.fecha,
      notas: d.notas,
    };
  });

  const pathD =
    points.length === 1
      ? `M ${points[0].x} ${points[0].y}`
      : points.reduce(
          (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
          ""
        );

  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${paddingTop + innerHeight} L ${points[0].x.toFixed(1)} ${paddingTop + innerHeight} Z`
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
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  React.useEffect(() => {
    checkScrollability();
    const el = scrollContainerRef.current;
    if (!el) return;

    window.addEventListener("resize", checkScrollability);
    return () => window.removeEventListener("resize", checkScrollability);
  }, [metricasDisponibles]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = 240;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Selector de métricas estilo Tabs/Pills */}
      <div className="space-y-4">
        {/* Encabezado: Evolución a la izquierda, Resumen y Botón Nueva Medida a la derecha */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-content flex items-center gap-2">
              <span>{metricaActual?.icono}</span>
              <span>Evolución: {metricaActual?.label}</span>
              {metricaActual?.esPersonalizada && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                  Personalizada
                </span>
              )}
            </h3>
            <p className="text-xs text-content-muted mt-0.5">
              {metricaActual?.descripcion}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
            {/* Tarjeta de Resumen Rápido */}
            {valorActual !== null && (
              <div className="flex items-center gap-3 bg-surface-hover/50 px-3.5 py-1.5 rounded-xl border border-border">
                <div>
                  <span className="text-[10px] uppercase font-bold text-content-muted block">
                    Último Valor
                  </span>
                  <span className="text-sm font-black text-content">
                    {valorActual} {metricaActual?.unidad}
                  </span>
                </div>
                {dataPuntos.length > 1 && (
                  <div className="pl-3 border-l border-border text-right">
                    <span className="text-[10px] uppercase font-bold text-content-muted block">
                      Progreso
                    </span>
                    <span
                      className={`text-xs font-black ${
                        delta > 0
                          ? "text-emerald-500"
                          : delta < 0
                            ? "text-blue-500"
                            : "text-content-muted"
                      }`}
                    >
                      {delta > 0 ? "+" : ""}
                      {delta.toFixed(1)} {metricaActual?.unidad} ({deltaPorcentaje}%)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Botón para crear nueva medida personalizada movido arriba a la derecha */}
            <button
              type="button"
              onClick={onCrearNuevaMedidaClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-primary border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
              title="Crear una nueva medida que no esté en la lista preestablecida"
            >
              <span className="text-sm leading-none">+</span>
              <span>Nueva Medida</span>
            </button>
          </div>
        </div>

        {/* Carrusel de pestañas con flechas de scroll izquierda/derecha */}
        <div className="relative flex items-center group/carousel">
          {/* Flecha Izquierda */}
          <button
            type="button"
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            aria-label="Ver medidas anteriores"
            className={`shrink-0 z-10 h-8 w-8 rounded-full border border-border bg-surface shadow-md flex items-center justify-center text-xs font-bold transition-all cursor-pointer mr-1.5 ${
              canScrollLeft
                ? "text-content hover:bg-surface-hover hover:border-primary/50 opacity-100"
                : "opacity-30 cursor-not-allowed text-content-muted"
            }`}
          >
            ‹
          </button>

          {/* Contenedor desplazable */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollability}
            className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 scroll-smooth"
          >
            {metricasDisponibles.map((m) => {
              const hasData = medidas.some((item) => item.tipo === m.key);
              const isSelected = m.key === selectedMetricaKey;

              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => onSelectMetricaKey(m.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : hasData
                        ? "bg-surface-hover border border-border text-content hover:border-primary/40"
                        : "bg-surface text-content-muted/60 border border-transparent hover:bg-surface-hover"
                  }`}
                >
                  <span>{m.icono}</span>
                  <span>{m.label}</span>
                  {hasData && !isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Flecha Derecha */}
          <button
            type="button"
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            aria-label="Ver más medidas"
            className={`shrink-0 z-10 h-8 w-8 rounded-full border border-border bg-surface shadow-md flex items-center justify-center text-xs font-bold transition-all cursor-pointer ml-1.5 ${
              canScrollRight
                ? "text-content hover:bg-surface-hover hover:border-primary/50 opacity-100 animate-pulse"
                : "opacity-30 cursor-not-allowed text-content-muted"
            }`}
          >
            ›
          </button>
        </div>
      </div>

      {/* Gráfico SVG Interactivo */}
      {dataPuntos.length === 0 ? (
        <div className="h-56 rounded-xl border border-dashed border-border bg-surface-hover/20 flex flex-col items-center justify-center p-6 text-center space-y-2">
          <span className="text-3xl">{metricaActual?.icono || "📉"}</span>
          <p className="text-sm font-semibold text-content">
            Aún no hay mediciones registradas para {metricaActual?.label}
          </p>
          <p className="text-xs text-content-muted max-w-sm">
            Hacé clic en <strong>&quot;+ Cargar Medición&quot;</strong> para ingresar tu primer valor de {metricaActual?.label.toLowerCase()} y ver su gráfico de progreso.
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="w-full overflow-hidden rounded-xl bg-background/50 border border-border p-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id={`gradient-${metricaActual?.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metricaActual?.color || "#3b82f6"} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={metricaActual?.color || "#3b82f6"} stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Líneas horizontales de fondo (Grid) */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = paddingTop + innerHeight * (1 - ratio);
                const valorRef = (minEscala + range * ratio).toFixed(1);
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
                      x={paddingX - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      className="fill-content-muted text-[10px] font-mono"
                    >
                      {valorRef}
                    </text>
                  </g>
                );
              })}

              {/* Relleno degradado del área */}
              {areaD && <path d={areaD} fill={`url(#gradient-${metricaActual?.key})`} />}

              {/* Línea principal de tendencia */}
              {points.length > 1 && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={metricaActual?.color || "#3b82f6"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Puntos y nodos interactivos */}
              {points.map((p, idx) => {
                const isHovered = hoveredPoint?.fecha === p.fecha;
                return (
                  <g key={idx}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? "7" : "4.5"}
                      fill="var(--background, #090d16)"
                      stroke={metricaActual?.color || "#3b82f6"}
                      strokeWidth={isHovered ? "3.5" : "2.5"}
                      className="transition-all cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(p)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {/* Fecha en eje X */}
                    <text
                      x={p.x}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      className="fill-content-muted text-[10px] font-medium"
                    >
                      {formatFecha(p.fecha)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Tooltip flotante al hacer hover */}
          {hoveredPoint && (
            <div
              className="absolute z-20 pointer-events-none rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-xl transition-all font-medium text-center -translate-x-1/2 -translate-y-full"
              style={{
                left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                top: `${(hoveredPoint.y / chartHeight) * 100}%`,
              }}
            >
              <div className="text-[10px] text-content-muted uppercase font-bold">
                {formatFechaCompleta(hoveredPoint.fecha)}
              </div>
              <div className="text-sm font-black text-content mt-0.5">
                {hoveredPoint.valor} {metricaActual?.unidad}
              </div>
              {hoveredPoint.notas && (
                <div className="text-[10px] text-content-muted italic mt-1 border-t border-border/50 pt-1 max-w-[160px] truncate">
                  &ldquo;{hoveredPoint.notas}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Estadísticas clave del periodo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
            <div className="p-2.5 rounded-xl bg-surface-hover/30 border border-border/50">
              <span className="text-[10px] uppercase font-bold text-content-muted block">
                Mínimo Registrado
              </span>
              <span className="text-base font-black text-content">
                {valorMin} {metricaActual?.unidad}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-hover/30 border border-border/50">
              <span className="text-[10px] uppercase font-bold text-content-muted block">
                Máximo Registrado
              </span>
              <span className="text-base font-black text-content">
                {valorMax} {metricaActual?.unidad}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-hover/30 border border-border/50">
              <span className="text-[10px] uppercase font-bold text-content-muted block">
                Primer Registro
              </span>
              <span className="text-base font-black text-content">
                {valorInicial} {metricaActual?.unidad}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-hover/30 border border-border/50">
              <span className="text-[10px] uppercase font-bold text-content-muted block">
                Total Controles
              </span>
              <span className="text-base font-black text-content">
                {dataPuntos.length} medición{dataPuntos.length !== 1 ? "es" : ""}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
