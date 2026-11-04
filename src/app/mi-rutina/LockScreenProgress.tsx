"use client";

import React, { useEffect, useRef, useState } from "react";

interface LockScreenProgressProps {
  completados: number;
  total: number;
  rutinaNombre: string;
  diaNumero: number;
}

export function LockScreenProgress({
  completados,
  total,
  rutinaNombre,
  diaNumero,
}: LockScreenProgressProps) {
  const [isActive, setIsActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Genera un audio silencioso en loop con Web Audio API exportado como WAV data URI
  // para mantener activo el reproductor del sistema operativo en segundo plano y pantalla de bloqueo.
  useEffect(() => {
    // Generar un buffer WAV silencioso de 1 segundo en base64
    const sampleRate = 8000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const numSamples = sampleRate; // 1 segundo
    const dataSize = numSamples * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // Escribir cabecera RIFF WAV
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);
    // data queda en 0 (silencio total)

    const blob = new Blob([buffer], { type: "audio/wav" });
    const audioUrl = URL.createObjectURL(blob);

    const audio = new Audio(audioUrl);
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    return () => {
      audio.pause();
      URL.revokeObjectURL(audioUrl);
    };
  }, []);

  // Actualizar MediaSession cuando cambie el progreso o el estado
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (total <= 0) {
      navigator.mediaSession.metadata = null;
      return;
    }

    const porcentaje = Math.round((completados / total) * 100);
    const faltantes = Math.max(0, total - completados);

    // Crear o actualizar la metadata de reproducción que muestra iOS y Android en la pantalla de bloqueo
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${porcentaje}% completado (${completados} de ${total})`,
      artist: `Día ${diaNumero} • ${rutinaNombre}`,
      album: faltantes === 0 ? "🎉 ¡Rutina completada!" : `Faltan ${faltantes} ${faltantes === 1 ? "ejercicio" : "ejercicios"}`,
      artwork: [
        {
          src: "/logoGym.jpg",
          sizes: "512x512",
          type: "image/jpeg",
        },
      ],
    });

    // Configurar posición de la barra de reproducción (Timeline de 0 a 100)
    if ("setPositionState" in navigator.mediaSession) {
      try {
        navigator.mediaSession.setPositionState({
          duration: total,
          playbackRate: 1,
          position: completados,
        });
      } catch (e) {
        console.warn("No se pudo actualizar positionState en mediaSession:", e);
      }
    }

    // Configurar handlers de reproducción para permitir pausar o reanudar desde los controles de bloqueo
    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current?.play().then(() => setIsActive(true)).catch(() => {});
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
      setIsActive(false);
    });
  }, [completados, total, rutinaNombre, diaNumero]);

  const toggleLockScreenMode = async () => {
    if (!audioRef.current) return;

    if (isActive) {
      audioRef.current.pause();
      setIsActive(false);
    } else {
      try {
        await audioRef.current.play();
        setIsActive(true);

        // Actualizar positionState inmediato al iniciar
        if ("mediaSession" in navigator && "setPositionState" in navigator.mediaSession) {
          try {
            navigator.mediaSession.setPositionState({
              duration: total,
              playbackRate: 1,
              position: completados,
            });
          } catch {}
        }
      } catch (err) {
        console.warn("No se pudo reproducir el audio de segundo plano:", err);
      }
    }
  };

  const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleLockScreenMode}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
          isActive
            ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20"
            : "bg-surface border-border text-content hover:bg-surface-hover hover:border-primary/40"
        }`}
        title={
          isActive
            ? "Modo Pantalla de Bloqueo activo. Al bloquear el teléfono verás el progreso de la rutina."
            : "Activar modo pantalla de bloqueo para ver el progreso de la rutina como reproductor de música."
        }
      >
        <span className="relative flex h-2.5 w-2.5">
          {isActive ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </>
          ) : (
            <span className="inline-flex rounded-full h-2.5 w-2.5 bg-content-muted/40" />
          )}
        </span>
        <span>
          {isActive ? "📱 Bloqueo: Activo" : "📱 Ver en Bloqueo"}
        </span>
        <span className="font-mono text-[11px] font-black opacity-80">
          {porcentaje}%
        </span>
      </button>
    </div>
  );
}

