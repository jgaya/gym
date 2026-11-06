"use client";

import React, { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // default true until checked in client
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Registrar Service Worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "test") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] Service Worker registrado con éxito:", registration.scope);
          })
          .catch((error) => {
            console.warn("[PWA] Error al registrar Service Worker:", error);
          });
      });
    }

    // 2. Verificar si ya está instalada / modo standalone
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      return; // No mostrar banners si ya está instalada
    }

    // 3. Revisar si el usuario ya descartó el banner previamente
    const dismissedUntil = localStorage.getItem("meraki-pwa-dismissed");
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      setIsDismissed(true);
    } else {
      setIsDismissed(false);
    }

    // 4. Detectar iOS (Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 5. Escuchar evento de instalación nativo (Android, Chrome, Edge, Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Recordar el descarte por 7 días
    localStorage.setItem("meraki-pwa-dismissed", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };

  // Si ya está instalada, descartada, o no es instalable (ni iOS), no mostrar el banner flotante
  if (isStandalone || isDismissed || (!isInstallable && !isIos)) {
    return (
      <>
        {/* Modal de ayuda para iOS si se abre */}
        {showIosGuide && (
          <IosInstructionsModal onClose={() => setShowIosGuide(false)} />
        )}
      </>
    );
  }

  return (
    <>
      {/* Banner flotante de instalación (responsive, discreto en la parte inferior) */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-sm rounded-2xl border border-border bg-surface p-4 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-5">
        <div className="flex items-start gap-3">
          <img
            src="/icons/icon-192x192.png"
            alt="App Meraki"
            className="h-12 w-12 rounded-xl object-cover border border-border shadow-xs shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-content leading-tight">
              Instalar App Meraki
            </h4>
            <p className="text-xs text-content-muted mt-1 leading-snug">
              Acceso directo desde tu pantalla de inicio, más rápido y sin barras de navegador.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
              >
                <span>Instalar</span>
                <span>📲</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-content-muted hover:text-content hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Ahora no
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Cerrar aviso de instalación"
            className="text-content-muted hover:text-content p-1 rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Modal de instrucciones para iPhone / iPad */}
      {showIosGuide && <IosInstructionsModal onClose={() => setShowIosGuide(false)} />}
    </>
  );
}

function IosInstructionsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl text-left space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/icons/apple-touch-icon.png"
              alt="Meraki"
              className="h-10 w-10 rounded-xl object-cover border border-border"
            />
            <div>
              <h3 className="text-base font-bold text-content">Instalar en Apple iOS</h3>
              <p className="text-xs text-content-muted">iPhone / iPad con Safari</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="rounded-lg p-1 text-content-muted hover:text-content hover:bg-surface-hover transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 pt-2 text-sm text-content">
          <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-surface-hover/50 p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              1
            </span>
            <p className="text-xs sm:text-sm">
              Tocá el botón <strong>Compartir</strong> en la barra inferior de Safari:{" "}
              <span className="inline-block px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-xs">
                ⎋
              </span>
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-surface-hover/50 p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              2
            </span>
            <p className="text-xs sm:text-sm">
              Deslizá hacia abajo y seleccioná la opción:{" "}
              <strong className="block text-primary mt-0.5">
                ➕ Agregar a inicio (Add to Home Screen)
              </strong>
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-surface-hover/50 p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              3
            </span>
            <p className="text-xs sm:text-sm">
              Confirmá presionando <strong>Agregar</strong> arriba a la derecha. ¡Listo! Ya tendrás el ícono de la app en tu pantalla.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

