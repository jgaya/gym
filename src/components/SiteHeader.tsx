"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { SessionUser } from "@/lib/auth";
import { cerrarSesion } from "@/app/login/actions";

interface NavLink {
  href: string;
  label: string;
}

interface SiteHeaderProps {
  currentUser?: SessionUser | null;
}

export function SiteHeader({ currentUser }: SiteHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

  const isHome = pathname === "/";

  // Menús base según el rol del usuario
  let rawNavLinks: NavLink[] = [];

  if (currentUser?.role === "ADMIN" || currentUser?.role === "SUPERADMIN") {
    // Menú para Administradores y SuperAdmins
    rawNavLinks = [
      { href: "/", label: "Inicio" },
      { href: "/admin/rutinas", label: "Rutinas" },
      { href: "/admin/ejercicios", label: "Ejercicios" },
      { href: "/admin/usuarios", label: "Usuarios" },
      { href: "/admin/plan", label: "Planes" },
      { href: "/admin/economia", label: "Economía" },
    ];
  } else if (currentUser?.role === "USER") {
    // Menú exclusivo para Usuarios Comunes (Atletas / Miembros)
    rawNavLinks = [
      { href: "/", label: "Inicio" },
      { href: "/mi-rutina", label: "Mi Rutina" },
      { href: "/mis-medidas", label: "Mis Medidas" },
      { href: "/perfil", label: "Mi Perfil" },
    ];
  } else {
    // Menú para visitantes no logueados
    rawNavLinks = [
      { href: "/", label: "Inicio" },
    ];
  }

  // Si estamos en la página de Inicio ("/"), ocultar el link "Inicio" del menú
  const navLinks = isHome ? rawNavLinks.filter((l) => l.href !== "/") : rawNavLinks;

  // Función para determinar si una ruta está activa
  const checkIsActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Cerrar menú móvil al presionar Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        hamburgerButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        hamburgerButtonRef.current &&
        !hamburgerButtonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  // Evitar scroll del body cuando el menú móvil está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Marca / Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-content transition-opacity hover:opacity-90"
        >
          <img
            src="/logoGym.jpg"
            alt="Meraki Centro de Entrenamiento"
            style={{ boxShadow: "var(--logo-shadow)" }}
            className="h-9 w-9 rounded-lg object-cover logo-img-shadow border border-border"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          <span className="flex flex-col leading-tight">
            <span className="text-base font-extrabold tracking-wider uppercase text-content">
              Meraki Centro de Entrenamiento
            </span>
            <span className="text-[10px] font-medium text-content-muted tracking-widest uppercase">
              Fitness & Training
            </span>
          </span>
        </Link>

        {/* Navegación Desktop según Rol */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
          {navLinks.map((link) => {
            const isActive = checkIsActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-2xs font-bold"
                    : "text-content-muted hover:bg-surface-hover hover:text-content"
                }`}
              >
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute bottom-0.5 left-3.5 right-3.5 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Acciones de la derecha (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {currentUser ? (
            <div className="flex items-center gap-3 pl-2 border-l border-border">
              <Link
                href={currentUser.role === "USER" ? "/perfil" : "/admin/usuarios"}
                className="flex items-center gap-2 text-left group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {currentUser.nombre.charAt(0)}
                  {currentUser.apellido.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-content group-hover:text-primary transition-colors">
                    {currentUser.nombre}
                  </span>
                  <span className="text-[10px] font-medium text-content-muted">
                    {currentUser.role === "USER"
                      ? "Miembro"
                      : currentUser.role === "ADMIN"
                        ? "Admin"
                        : "SuperAdmin"}
                  </span>
                </div>
              </Link>

              <form action={cerrarSesion}>
                <button
                  type="submit"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                  className="rounded-lg p-2 text-content-muted hover:text-red-500 hover:bg-surface-hover transition-colors cursor-pointer text-xs"
                >
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover shadow-xs"
            >
              Ingresar
            </Link>
          )}
        </div>

        {/* Botón de Menú Hamburguesa (VISIBLE ÚNICAMENTE EN MOBILE) */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />

          <button
            ref={hamburgerButtonRef}
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMobileMenuOpen ? "Cerrar menú principal" : "Abrir menú principal"}
            className="inline-flex items-center justify-center rounded-lg p-2 text-content-muted transition-colors hover:bg-surface-hover hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <div className="relative flex h-5 w-5 flex-col items-center justify-center">
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-in-out ${isMobileMenuOpen ? "translate-y-1.5 rotate-45" : "-translate-y-1"
                  }`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition-all duration-200 ease-in-out ${isMobileMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-in-out ${isMobileMenuOpen ? "-translate-y-1.5 -rotate-45" : "translate-y-1"
                  }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Menú Móvil Desplegable (SOLO EN MODO MOBILE) */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation"
          ref={mobileMenuRef}
          className="fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col bg-surface/98 backdrop-blur-lg border-b border-border p-6 shadow-xl md:hidden animate-in fade-in slide-in-from-top-4 duration-200 overflow-y-auto"
        >
          {/* Info del usuario logueado en mobile */}
          {currentUser ? (
            <div className="mb-4 pb-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {currentUser.nombre.charAt(0)}
                  {currentUser.apellido.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-content text-sm">
                    {currentUser.nombre} {currentUser.apellido}
                  </span>
                  <span className="text-xs text-content-muted">
                    {currentUser.role === "USER"
                      ? "Miembro del Gimnasio"
                      : currentUser.role === "ADMIN"
                        ? "Administrador"
                        : "Super Administrador"}
                  </span>
                </div>
              </div>

              <form action={cerrarSesion}>
                <button
                  type="submit"
                  className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-500/10 px-2.5 py-1 rounded-md"
                >
                  Salir
                </button>
              </form>
            </div>
          ) : (
            <div className="mb-4 pb-4 border-b border-border">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm"
              >
                Ingresar a Mi Cuenta
              </Link>
            </div>
          )}

          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">
            Navegación {currentUser?.role === "USER" ? "Miembro" : currentUser ? "Admin" : ""}
          </div>
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = checkIsActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary font-bold border border-primary/20"
                      : "text-content hover:bg-surface-hover"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isActive && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                    <span>{link.label}</span>
                  </span>
                  <span className={isActive ? "text-primary text-xs font-bold" : "text-content-muted text-xs"}>
                    {isActive ? "Activo" : "→"}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
            <span className="text-sm font-medium text-content-muted">Aspecto visual</span>
            <ThemeToggle showLabel />
          </div>
        </div>
      )}
    </header>
  );
}
