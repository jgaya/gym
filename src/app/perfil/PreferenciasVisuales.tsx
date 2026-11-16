"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FONT_STEPS, DEFAULT_FONT_STEP_INDEX } from "@/lib/fontSize";
import { useFontSize } from "@/lib/useFontSize";

export function PreferenciasVisuales() {
  const { stepIndex, currentStep, mounted, setFontSizeIndex, resetFontSize } =
    useFontSize();

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFontSizeIndex(Number(e.target.value));
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-content">
            Preferencias de la Aplicación
          </h2>
          <p className="text-xs text-content-muted mt-0.5">
            Personalizá la escala tipográfica para adaptar la lectura a tu comodidad visual.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={currentStep.value === 100 ? "default" : "primary"}>
            Escala: {currentStep.label} ({currentStep.tag})
          </Badge>
          {currentStep.value !== 100 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFontSize}
              className="text-xs"
            >
              Restablecer
            </Button>
          )}
        </div>
      </div>

      {/* Control del Slider */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between text-xs font-semibold text-content">
          <span>Tamaño de Fuente Global</span>
          <span className="text-primary font-bold">{currentStep.label}</span>
        </div>

        {/* Input Range Slider */}
        <div className="relative px-2">
          <input
            type="range"
            min={0}
            max={FONT_STEPS.length - 1}
            step={1}
            value={mounted ? stepIndex : DEFAULT_FONT_STEP_INDEX}
            onChange={handleSliderChange}
            aria-label="Escala de tamaño de fuente"
            className="w-full h-2.5 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {/* Marcas de posición (90%, 100%, 105%, 110%, 120%, 150%) */}
          <div className="flex justify-between items-center mt-3 pt-1">
            {FONT_STEPS.map((step, idx) => {
              const isSelected = idx === stepIndex;
              const isDefault = step.value === 100;

              return (
                <button
                  key={step.value}
                  type="button"
                  onClick={() => setFontSizeIndex(idx)}
                  className={`flex flex-col items-center transition-all cursor-pointer group ${isSelected ? "text-primary scale-105" : "text-content-muted hover:text-content"
                    }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full mb-1 transition-colors ${isSelected
                      ? "bg-primary ring-2 ring-primary/30"
                      : isDefault
                        ? "bg-content-muted"
                        : "bg-border group-hover:bg-content-muted"
                      }`}
                  />
                  <span
                    className={`text-xs font-bold ${isSelected ? "text-primary" : "text-content-muted"
                      }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[10px] hidden sm:inline text-content-muted/80">
                    {step.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Muestra de Vista Previa */}
        <div className="rounded-xl border border-border bg-surface-hover/40 p-4 mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-content-muted">
            <span>Vista previa del texto</span>
            <span className="text-[11px] text-content-muted">Se aplica en toda la plataforma</span>
          </div>
          <p className="text-base font-semibold text-content">
            Press de Banca Plano — 4 series de 8 a 10 repeticiones
          </p>
          <p className="text-xs text-content-muted">
            El tamaño seleccionado se guarda en tu navegador y se mantendrá activo en todas las pantallas y visitas futuras.
          </p>
        </div>
      </div>
    </div>
  );
}

