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
 */
function getYouTubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const trimmed = url.trim();

    // Formato youtu.be/<id>
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch && shortMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${shortMatch[1]}`;
    }

    // Formato youtube.com/watch?v=<id>
    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${watchMatch[1]}`;
    }

    // Formato youtube.com/embed/<id>
    const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch && embedMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${embedMatch[1]}`;
    }

    // Formato youtube.com/shorts/<id>
    const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch && shortsMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${shortsMatch[1]}`;
    }

    return null;
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
      maxWidth="lg"
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

        {/* BLOQUE 2: Video Demostrativo (Embed YouTube o HTML5 directo bajo la imagen) */}
        {ejercicio.videoUrl && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface-hover/30 p-3 space-y-2">
            <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider block">
              🎬 Video Demostrativo
            </span>

            {ytEmbedUrl ? (
              <div className="relative w-full overflow-hidden rounded-lg bg-black aspect-video shadow-sm">
                <iframe
                  src={ytEmbedUrl}
                  title={`Video demostrativo de ${ejercicio.nombre}`}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : isDirectVideo ? (
              <div className="relative w-full overflow-hidden rounded-lg bg-black shadow-sm">
                <video
                  controls
                  playsInline
                  className="max-h-72 w-full rounded-lg bg-black"
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

