"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface EjercicioInfoModalData {
  id: number;
  nombre: string;
  descripcion: string | null;
  grupoMuscular: string | null;
  imagenUrl: string | null;
  videoUrl: string | null;
}

interface EjercicioDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  ejercicio: EjercicioInfoModalData | null;
}

/**
 * Extrae el ID del video de YouTube a partir de varios formatos de URL
 * (youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/..., youtube.com/shorts/...)
 * y genera una URL de embed con autoplay y loop continuo.
 */
export function getYouTubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const trimmed = url.trim();
    let videoId: string | null = null;

    // Formato youtu.be/<id>
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch && shortMatch[1]) {
      videoId = shortMatch[1];
    }

    // Formato youtube.com/watch?v=<id>
    if (!videoId) {
      const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      if (watchMatch && watchMatch[1]) {
        videoId = watchMatch[1];
      }
    }

    // Formato youtube.com/embed/<id>
    if (!videoId) {
      const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch && embedMatch[1]) {
        videoId = embedMatch[1];
      }
    }

    // Formato youtube.com/shorts/<id>
    if (!videoId) {
      const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch && shortsMatch[1]) {
        videoId = shortsMatch[1];
      }
    }

    if (!videoId) return null;

    // Autoplay + Loop en YouTube:
    // - autoplay=1: Inicia automáticamente al abrir el modal
    // - mute=1: Obligatorio para que los navegadores modernos permitan autoplay sin interacción previa
    // - loop=1 y playlist=<videoId>: YouTube requiere el parámetro playlist con el mismo ID para repetir en bucle videos individuales
    // - playsinline=1: Permite reproducción en línea en navegadores móviles (iOS/Android) sin forzar pantalla completa
    // - controls=1: Mantiene los controles visibles para que el usuario pueda subir el volumen o pausar si lo desea
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1&controls=1&rel=0`;
  } catch {
    return null;
  }
}

export function EjercicioDetalleModal({
  isOpen,
  onClose,
  ejercicio,
}: EjercicioDetalleModalProps) {
  if (!ejercicio) return null;

  const ytEmbedUrl = getYouTubeEmbedUrl(ejercicio.videoUrl);
  const isDirectVideo =
    ejercicio.videoUrl &&
    (ejercicio.videoUrl.endsWith(".mp4") ||
      ejercicio.videoUrl.endsWith(".webm") ||
      ejercicio.videoUrl.endsWith(".ogg"));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ejercicio.nombre}
      description={
        ejercicio.grupoMuscular
          ? `Grupo Muscular: ${ejercicio.grupoMuscular}`
          : "Guía de entrenamiento y ejecución"
      }
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {ejercicio.videoUrl ? (
              <a
                href={ejercicio.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition-colors"
              >
                🎬 Ver video en pestaña nueva
              </a>
            ) : null}
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            Entendido / Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-5 py-1">
        {/* BLOQUE 1: Imagen / Referencia Visual */}
        {ejercicio.imagenUrl && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface-hover/30 p-3 space-y-2">
            <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider block">
              🖼️ Referencia Visual
            </span>
            <div className="flex items-center justify-center max-h-64 overflow-hidden rounded-lg bg-surface">
              <img
                src={ejercicio.imagenUrl}
                alt={ejercicio.nombre}
                className="max-h-60 w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        )}

        {/* BLOQUE 2: Video Demostrativo (Embed YouTube con Autoplay & Loop continuo, o HTML5 directo) */}
        {ejercicio.videoUrl && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface-hover/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider block">
                🎬 Video Demostrativo
              </span>
              {ytEmbedUrl && (
                <span className="text-[10px] text-primary/80 font-semibold bg-primary/10 px-2 py-0.5 rounded-full">
                  Bucle Continuo 🔄
                </span>
              )}
            </div>

            {ytEmbedUrl ? (
              /* Contenedor responsivo 16:9 adaptable a Mobile y Desktop */
              <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-video shadow-md border border-border/40">
                <iframe
                  src={ytEmbedUrl}
                  title={`Video demostrativo de ${ejercicio.nombre}`}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : isDirectVideo ? (
              <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-video shadow-md border border-border/40">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  className="absolute inset-0 h-full w-full object-contain bg-black"
                  src={ejercicio.videoUrl}
                >
                  Tu navegador no soporta reproducción de video HTML5.
                </video>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 rounded-lg bg-surface border border-border">
                <p className="text-xs text-content-muted">
                  Video externo disponible para consultar
                </p>
                <a
                  href={ejercicio.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-colors"
                >
                  🎬 Abrir Video Externo
                </a>
              </div>
            )}
          </div>
        )}

        {/* BLOQUE 3: Explicación y Guía de Técnica en Texto */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary block">
            📋 Técnica, Pasos y Pautas de Ejecución
          </span>
          <div className="p-4 rounded-xl bg-surface-hover/50 border border-border text-sm text-content leading-relaxed whitespace-pre-line font-sans">
            {ejercicio.descripcion ||
              "Este ejercicio no posee una descripción detallada registrada aún."}
          </div>
        </div>
      </div>
    </Modal>
  );
}

