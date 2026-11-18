"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Role } from "@lib/generated/prisma/enums";
import { ManualSocio } from "@/components/manual/ManualSocio";
import { ManualEntrenador } from "@/components/manual/ManualEntrenador";
import { ManualAdmin } from "@/components/manual/ManualAdmin";

type ManualTab = "SOCIO" | "ENTRENADOR" | "ADMIN";

interface ManualClientProps {
  userRole?: Role | null;
  userName?: string;
}

interface TocItem {
  id: string;
  label: string;
  icon: string;
}

const TOC_BY_TAB: Record<ManualTab, TocItem[]> = {
  SOCIO: [
    { id: "perfil", label: "Mi Perfil & Ficha Médica", icon: "👤" },
    { id: "rutina", label: "Mi Rutina & Pesos en Sala", icon: "🏋️" },
    { id: "calendario", label: "Calendario & Asistencias", icon: "📅" },
    { id: "medidas", label: "Mis Medidas Corporales", icon: "📏" },
    { id: "visuales", label: "Ajuste Visual & Fuentes", icon: "👁️" },
  ],
  ENTRENADOR: [
    { id: "ejercicios", label: "Catálogo de Ejercicios", icon: "💪" },
    { id: "rutinas", label: "Diseño & Superseries", icon: "📋" },
    { id: "alumnos", label: "Padrón & Asignación", icon: "👥" },
  ],
  ADMIN: [
    { id: "sucursales", label: "Gestión de Sucursales", icon: "🏢" },
    { id: "planes", label: "Planes & Plantillas", icon: "🎯" },
    { id: "cobranzas", label: "Control de Cobranzas", icon: "💳" },
    { id: "kiosco", label: "Kiosco & Mostrador", icon: "🥤" },
    { id: "economia", label: "Gastos & Margen Neto", icon: "📊" },
  ],
};

export function ManualClient({ userRole, userName }: ManualClientProps) {
  // Determinar rol inicial y permisos
  const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPERADMIN;
  const isTrainer = userRole === Role.ENTRENADOR;

  // Los admins pueden ver todo (ADMIN, ENTRENADOR, SOCIO)
  // Los entrenadores pueden ver ENTRENADOR y SOCIO
  // Los socios ven SOCIO
  const defaultTab: ManualTab = isAdmin
    ? "ADMIN"
    : isTrainer
      ? "ENTRENADOR"
      : "SOCIO";

  const [activeTab, setActiveTab] = useState<ManualTab>(defaultTab);
  const [searchQuery, setSearchQuery] = useState("");

  const allowedTabs: ManualTab[] = useMemo(() => {
    if (isAdmin) return ["ADMIN", "ENTRENADOR", "SOCIO"];
    if (isTrainer) return ["ENTRENADOR", "SOCIO"];
    return ["SOCIO"];
  }, [isAdmin, isTrainer]);

  const currentToc = TOC_BY_TAB[activeTab];

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Barra superior de bienvenida y acciones */}
      <div className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-16 z-30 transition-colors">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
              ?
            </span>
            <div>
              <span className="text-xs font-bold text-content block leading-tight">
                Centro de Ayuda y Manuales
              </span>
              <span className="text-[10px] text-content-muted">
                {userName ? `Sesión iniciada como ${userName}` : "Meraki Gym"}
              </span>
            </div>
          </div>

          {/* Selector de pestañas por rol */}
          <div className="flex items-center gap-1.5 bg-surface-hover/80 p-1 rounded-xl border border-border">
            {allowedTabs.includes("ADMIN") && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("ADMIN");
                  setSearchQuery("");
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "ADMIN"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-content-muted hover:text-content"
                }`}
              >
                💼 Admin
              </button>
            )}

            {allowedTabs.includes("ENTRENADOR") && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("ENTRENADOR");
                  setSearchQuery("");
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "ENTRENADOR"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-content-muted hover:text-content"
                }`}
              >
                📋 Entrenador
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveTab("SOCIO");
                setSearchQuery("");
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "SOCIO"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-content-muted hover:text-content"
              }`}
            >
              🏋️ Socio
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              aria-label="Imprimir o guardar en PDF"
              title="Imprimir esta guía o guardarla en PDF"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-content hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <svg
                className="h-3.5 w-3.5 text-content-muted"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              <span>Imprimir / PDF</span>
            </button>

            <Link
              href="/"
              className="rounded-lg bg-surface border border-border px-3 py-1.5 text-xs font-semibold text-content hover:bg-surface-hover transition-colors"
            >
              ← Volver al Inicio
            </Link>
          </div>
        </div>
      </div>

      {/* Contenedor principal con Barra lateral y Contenido */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* BARRA LATERAL (Índice temático) */}
          <aside className="hidden md:block md:col-span-1 space-y-4">
            <div className="sticky top-32 space-y-4">
              <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs space-y-3">
                <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider block border-b border-border pb-2">
                  Índice del Manual ({activeTab})
                </span>

                <nav className="space-y-1" aria-label="Navegación de secciones">
                  {currentToc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-content-muted hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </a>
                  ))}
                </nav>
              </div>

              {/* Tarjeta de soporte o ayuda */}
              <div className="rounded-2xl border border-border bg-surface-hover/30 p-4 text-xs space-y-2">
                <span className="font-bold text-content block">¿Tenés dudas adicionales?</span>
                <p className="text-content-muted leading-relaxed">
                  Consultá con el staff en recepción o comunicate por los canales oficiales de tu sede.
                </p>
              </div>
            </div>
          </aside>

          {/* CONTENIDO PRINCIPAL DEL MANUAL */}
          <main className="col-span-1 md:col-span-3">
            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
              {activeTab === "SOCIO" && <ManualSocio />}
              {activeTab === "ENTRENADOR" && <ManualEntrenador />}
              {activeTab === "ADMIN" && <ManualAdmin />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
