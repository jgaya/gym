"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface TimerFlotanteProps {
  initialSeconds?: number;
}

export function TimerFlotante({ initialSeconds = 60 }: TimerFlotanteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [minutosInput, setMinutosInput] = useState<number>(Math.floor(initialSeconds / 60));
  const [segundosInput, setSegundosInput] = useState<number>(initialSeconds % 60);

  const [tiempoRestante, setTiempoRestante] = useState<number>(initialSeconds);
  const [tiempoTotal, setTiempoTotal] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Reproducir sonido al terminar usando Web Audio API nativo
  const playAlarmSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = audioContextRef.current && audioContextRef.current.state !== "closed"
        ? audioContextRef.current
        : new AudioCtx();
      audioContextRef.current = ctx;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Secuencia de 3 beeps rítmicos y claros de alerta
      const beeps = [0, 0.25, 0.5];
      beeps.forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now + delay); // Nota La5 (880Hz)
        osc.frequency.exponentialRampToValueAtTime(1320, now + delay + 0.15); // Subida a Mi6

        gain.gain.setValueAtTime(0.001, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.4, now + delay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.2);
      });
    } catch (e) {
      console.warn("No se pudo reproducir el sonido del timer:", e);
    }
  };

  // Despertar/habilitar AudioContext con una interacción del usuario (para desbloquear autoplay policy de iOS/Chrome)
  const initAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
    } catch {}
  };

  // Manejo del intervalo de cuenta regresiva
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && tiempoRestante > 0) {
      interval = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setHasFinished(true);
            playAlarmSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, tiempoRestante]);

  // Formatear mm:ss
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    initAudio();
    const total = Math.max(1, minutosInput * 60 + segundosInput);
    setTiempoTotal(total);
    setTiempoRestante(total);
    setHasFinished(false);
    setIsRunning(true);
  };

  const handlePauseResume = () => {
    initAudio();
    if (hasFinished) {
      handleStart();
      return;
    }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setHasFinished(false);
    const total = Math.max(1, minutosInput * 60 + segundosInput);
    setTiempoRestante(total);
  };

  const handlePreset = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    setMinutosInput(m);
    setSegundosInput(s);
    setTiempoTotal(seconds);
    setTiempoRestante(seconds);
    setHasFinished(false);
    setIsRunning(false);
  };

  // Porcentaje completado para barra de progreso
  const progressPercent = tiempoTotal > 0
    ? Math.max(0, Math.min(100, ((tiempoTotal - tiempoRestante) / tiempoTotal) * 100))
    : 0;

  return (
    <>
      {/* Botón Flotante (FAB) fijo en la esquina inferior derecha */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => {
            initAudio();
            setIsOpen(true);
          }}
          className={`group relative flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 cursor-pointer active:scale-95 ${
            isRunning
              ? "h-14 px-4 bg-primary text-primary-foreground ring-4 ring-primary/30 animate-pulse"
              : hasFinished
                ? "h-14 px-4 bg-emerald-500 text-white ring-4 ring-emerald-500/30 animate-bounce"
                : "h-14 w-14 bg-primary text-primary-foreground hover:bg-primary-hover hover:scale-105"
          }`}
          title="Abrir Cronómetro / Timer de descanso"
          aria-label="Abrir Cronómetro / Timer de descanso"
        >
          {/* Icono de Cronómetro / Reloj */}
          <svg
            className={`h-7 w-7 transition-transform ${isRunning ? "animate-spin-slow" : "group-hover:rotate-12"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2v2m-6.364 1.636l1.414 1.414m11.314-1.414l-1.414 1.414"
            />
          </svg>

          {/* Si está corriendo o finalizó, mostrar cuenta restante al lado del icono en el botón flotante */}
          {isRunning && (
            <span className="ml-2 font-mono font-black text-sm tracking-tight">
              {formatTime(tiempoRestante)}
            </span>
          )}

          {hasFinished && (
            <span className="ml-2 font-black text-xs uppercase tracking-wider">
              ¡Tiempo!
            </span>
          )}
        </button>
      </div>

      {/* Modal del Timer de Descanso */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Cronómetro / Timer de Descanso"
        description="Configurá los minutos y segundos para tu descanso entre series."
        maxWidth="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Minimizar
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                Reiniciar
              </Button>
              {isRunning ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePauseResume}
                >
                  Pausar
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStart}
                >
                  {tiempoRestante === 0 || hasFinished ? "Iniciar de Nuevo" : "Iniciar Cuenta Regresiva"}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-6 py-1">
          {/* Visualización Principal del Display (Reloj Digital) */}
          <div
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all ${
              hasFinished
                ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/20 shadow-inner"
                : isRunning
                  ? "border-primary/50 bg-primary/5 dark:bg-primary/10 shadow-inner"
                  : "border-border bg-surface-hover/40"
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-widest text-content-muted mb-1">
              {hasFinished ? "¡Tiempo cumplido! Dale a la siguiente serie 💪" : isRunning ? "Descanso en curso..." : "Listo para iniciar"}
            </span>

            <div
              className={`font-mono text-5xl sm:text-6xl font-black tracking-tight transition-colors ${
                hasFinished
                  ? "text-emerald-600 dark:text-emerald-400 animate-pulse"
                  : isRunning
                    ? "text-primary"
                    : "text-content"
              }`}
            >
              {formatTime(tiempoRestante)}
            </div>

            {/* Barra de progreso de cuenta regresiva */}
            <div className="w-full bg-border/60 h-2 rounded-full mt-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  hasFinished ? "bg-emerald-500" : "bg-primary"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Selectores Rápidos de Descanso Común */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-content-muted">
              Tiempos Rápidos de Descanso:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 45, 60, 90, 120, 180, 240, 300].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => handlePreset(sec)}
                  className={`rounded-xl border py-2 px-1 text-xs font-bold transition-all cursor-pointer ${
                    minutosInput * 60 + segundosInput === sec
                      ? "border-primary bg-primary/10 text-primary shadow-2xs"
                      : "border-border bg-surface hover:bg-surface-hover text-content"
                  }`}
                >
                  {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Ajuste Manual: Minutos y Segundos */}
          <div className="space-y-2 border-t border-border pt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-content-muted">
              Personalizar Tiempo:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-content-muted mb-1">
                  Minutos
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const val = Math.max(0, minutosInput - 1);
                      setMinutosInput(val);
                      if (!isRunning) {
                        setTiempoTotal(val * 60 + segundosInput);
                        setTiempoRestante(val * 60 + segundosInput);
                      }
                    }}
                    className="h-10 w-10 flex items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-hover font-bold text-lg text-content"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutosInput}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                      setMinutosInput(val);
                      if (!isRunning) {
                        setTiempoTotal(val * 60 + segundosInput);
                        setTiempoRestante(val * 60 + segundosInput);
                      }
                    }}
                    className="h-10 w-full rounded-lg border border-border bg-surface text-center font-mono font-bold text-base text-content focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = Math.min(59, minutosInput + 1);
                      setMinutosInput(val);
                      if (!isRunning) {
                        setTiempoTotal(val * 60 + segundosInput);
                        setTiempoRestante(val * 60 + segundosInput);
                      }
                    }}
                    className="h-10 w-10 flex items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-hover font-bold text-lg text-content"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-content-muted mb-1">
                  Segundos
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const val = Math.max(0, segundosInput - 5);
                      setSegundosInput(val);
                      if (!isRunning) {
                        setTiempoTotal(minutosInput * 60 + val);
                        setTiempoRestante(minutosInput * 60 + val);
                      }
                    }}
                    className="h-10 w-10 flex items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-hover font-bold text-lg text-content"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="5"
                    value={segundosInput}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                      setSegundosInput(val);
                      if (!isRunning) {
                        setTiempoTotal(minutosInput * 60 + val);
                        setTiempoRestante(minutosInput * 60 + val);
                      }
                    }}
                    className="h-10 w-full rounded-lg border border-border bg-surface text-center font-mono font-bold text-base text-content focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = Math.min(59, segundosInput + 5);
                      setSegundosInput(val);
                      if (!isRunning) {
                        setTiempoTotal(minutosInput * 60 + val);
                        setTiempoRestante(minutosInput * 60 + val);
                      }
                    }}
                    className="h-10 w-10 flex items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-hover font-bold text-lg text-content"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
