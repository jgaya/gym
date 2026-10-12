"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface FontStep {
  value: number; // porcentaje (75, 90, 100, 125, 150)
  label: string;
  tag: string;
}

const FONT_STEPS: FontStep[] = [
  { value: 75, label: "75%", tag: "Compacto" },
  { value: 90, label: "90%", tag: "Reducido" },
  { value: 100, label: "100%", tag: "Estándar (Actual)" },
  { value: 125, label: "125%", tag: "Aumentado" },
  { value: 150, label: "150%", tag: "Grande" },
];

const STORAGE_KEY = "gym-font-size";

export function PreferenciasVisuales() {
  const [stepIndex, setStepIndex] = useState<number>(2); // 2 = 100% (el medio)
  const [mounted, setMounted] = useState(false);

  // Cargar tamaño guardado al montar en el cliente
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const numeric = parseInt(stored, 10);
        const foundIndex = FONT_STEPS.findIndex((s) => s.value === numeric);
        if (foundIndex !== -1) {
          setStepIndex(foundIndex);
          document.documentElement.style.fontSize = `${FONT_STEPS[foundIndex].value}%`;
          return;
        }
      }
      // Si no hay o no coincide, asegurar 100%
      document.documentElement.style.fontSize = "100%";
    } catch {
      // Ignorar errores en modo privado/incógnito
    }
  }, []);

  const applyFontSize = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(FONT_STEPS.length - 1, index));
    setStepIndex(clampedIndex);
    const chosenStep = FONT_STEPS[clampedIndex];

    try {
      document.documentElement.style.fontSize = `${chosenStep.value}%`;
      localStorage.setItem(STORAGE_KEY, `${chosenStep.value}%`);
    } catch {
      // Fallback si localStorage falla
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyFontSize(Number(e.target.value));
  };

  const handleReset = () => {
    applyFontSize(2); // Volver al centro: 100%
  };

  const currentStep = FONT_STEPS[stepIndex];

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
              onClick={handleReset}
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
            value={mounted ? stepIndex : 2}
            onChange={handleSliderChange}
            aria-label="Escala de tamaño de fuente"
            className="w-full h-2.5 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {/* Marcas de posición (75%, 90%, 100%, 125%, 150%) */}
          <div className="flex justify-between items-center mt-3 pt-1">
            {FONT_STEPS.map((step, idx) => {
              const isSelected = idx === stepIndex;
              const isDefault = step.value === 100;

              return (
                <button
                  key={step.value}
                  type="button"
                  onClick={() => applyFontSize(idx)}
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

