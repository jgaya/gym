"use client";

import React, { useState } from "react";

export interface Hotspot {
  number: number;
  label: string;
  description: string;
  position?: { top?: string; bottom?: string; left?: string; right?: string };
}

interface ScreenshotCardProps {
  title: string;
  caption?: string;
  hotspots?: Hotspot[];
  children?: React.ReactNode;
  imageSrc?: string;
  device?: "desktop" | "mobile";
  className?: string;
}

export function ScreenshotCard({
  title,
  caption,
  hotspots = [],
  children,
  imageSrc,
  device = "desktop",
  className = "",
}: ScreenshotCardProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);

  return (
    <>
      <div
        className={`rounded-2xl border border-border bg-surface shadow-sm overflow-hidden my-5 ${className}`}
      >
        {/* Barra superior de ventana o dispositivo */}
        <div className="flex items-center justify-between border-b border-border bg-surface-hover/80 px-4 py-2.5">
          <div className="flex items-center gap-2">
            {device === "desktop" ? (
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 inline-block" />
              </div>
            ) : (
              <span className="text-[10px] font-bold text-content-muted tracking-widest uppercase">
                VISTA MÓVIL
              </span>
            )}
            <span className="text-xs font-semibold text-content-muted truncate ml-1">
              {title}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            aria-label="Ampliar captura"
            title="Ampliar captura a pantalla completa"
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-md transition-colors cursor-pointer"
          >
            <svg
              className="h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            <span>Ampliar</span>
          </button>
        </div>

        {/* Contenido Visual / Mockup */}
        <div className="relative bg-background/50 p-3 sm:p-5 overflow-x-auto">
          {imageSrc ? (
            <div className="relative flex justify-center">
              <img
                src={imageSrc}
                alt={title}
                className="rounded-xl border border-border max-w-full h-auto object-cover shadow-sm"
              />
            </div>
          ) : (
            <div className="relative rounded-xl border border-border bg-surface p-4 text-xs">
              {children}
            </div>
          )}

          {/* Hotspots si están definidos con posiciones */}
          {hotspots
            .filter((h) => h.position)
            .map((h) => (
              <button
                key={h.number}
                type="button"
                onClick={() =>
                  setActiveHotspot(activeHotspot === h.number ? null : h.number)
                }
                style={{
                  top: h.position?.top,
                  bottom: h.position?.bottom,
                  left: h.position?.left,
                  right: h.position?.right,
                }}
                title={`${h.number}. ${h.label}`}
                className={`absolute z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-black text-xs shadow-md ring-2 ring-background transition-transform cursor-pointer ${
                  activeHotspot === h.number
                    ? "bg-amber-500 text-white scale-125"
                    : "bg-primary text-primary-foreground hover:scale-110"
                }`}
              >
                {h.number}
              </button>
            ))}
        </div>

        {/* Leyendas y Hotspots explicativos debajo */}
        {(caption || hotspots.length > 0) && (
          <div className="border-t border-border bg-surface-hover/30 p-3.5 space-y-2">
            {caption && (
              <p className="text-xs text-content-muted leading-relaxed italic">
                {caption}
              </p>
            )}

            {hotspots.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {hotspots.map((h) => (
                  <div
                    key={h.number}
                    className={`flex items-start gap-2 rounded-lg p-2 transition-colors ${
                      activeHotspot === h.number
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-surface border border-border/60"
                    }`}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[11px]">
                      {h.number}
                    </span>
                    <div className="text-xs">
                      <span className="font-bold text-content mr-1">
                        {h.label}:
                      </span>
                      <span className="text-content-muted">{h.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Zoom / Lightbox */}
      {isZoomed && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-opacity"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-5xl w-full rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-content">{title}</h3>
                {caption && (
                  <p className="text-xs text-content-muted mt-0.5">{caption}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="rounded-lg p-2 text-content-muted hover:text-content hover:bg-surface-hover cursor-pointer"
                aria-label="Cerrar vista ampliada"
              >
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="overflow-x-auto bg-background/50 rounded-xl p-3 border border-border">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={title}
                  className="w-full h-auto rounded-lg shadow-sm"
                />
              ) : (
                <div className="p-2 text-sm">{children}</div>
              )}
            </div>

            {hotspots.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-border">
                {hotspots.map((h) => (
                  <div
                    key={h.number}
                    className="flex items-start gap-2 rounded-lg bg-surface border border-border p-2.5 text-xs"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-[11px]">
                      {h.number}
                    </span>
                    <div>
                      <span className="font-bold text-content">{h.label}</span>
                      <p className="text-content-muted mt-0.5">{h.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
