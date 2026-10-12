"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  target?: string;
  variant?: "default" | "danger" | "warning" | "success";
  disabled?: boolean;
  title?: string;
}

export interface ActionsMenuProps {
  items: (ActionMenuItem | null | undefined | false)[];
  align?: "left" | "right";
  buttonTitle?: string;
  className?: string;
}

export function ActionsMenu({
  items,
  align = "right",
  buttonTitle = "Acciones",
  className = "",
}: ActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }>({});

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Filtrar items nulos o falsy
  const validItems = items.filter(Boolean) as ActionMenuItem[];

  // Confirmar montaje en cliente para SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calcular coordenadas fijas respecto al viewport
  const calculateCoords = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Si hay menos de 220px abajo y más espacio arriba, abrir hacia arriba
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    const minMargin = 8;
    const viewportWidth = window.innerWidth;

    if (align === "right") {
      const rightCoord = viewportWidth - rect.right;
      setMenuCoords({
        top: openUp ? undefined : rect.bottom + 6,
        bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
        right: Math.max(minMargin, rightCoord),
        left: undefined,
      });
    } else {
      setMenuCoords({
        top: openUp ? undefined : rect.bottom + 6,
        bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
        left: Math.max(minMargin, rect.left),
        right: undefined,
      });
    }
  };

  // Manejar click fuera, scroll y tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    // Si se hace scroll en cualquier contenedor o en la ventana, cerrar el menú para no flotar desanclado
    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true); // true captura scroll en contenedores internos
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      calculateCoords();
    }
    setIsOpen((prev) => !prev);
  };

  if (validItems.length === 0) return null;

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {/* Botón de 3 puntos verticales */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={buttonTitle}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-content-muted hover:text-content hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer ${
          isOpen ? "bg-surface-hover text-content" : ""
        }`}
      >
        <span className="sr-only">{buttonTitle}</span>
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {/* Menú renderizado en React Portal (fuera del contenedor con overflow) */}
      {isOpen &&
        mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-orientation="vertical"
            style={{
              position: "fixed",
              top: menuCoords.top !== undefined ? `${menuCoords.top}px` : undefined,
              bottom:
                menuCoords.bottom !== undefined ? `${menuCoords.bottom}px` : undefined,
              right:
                menuCoords.right !== undefined ? `${menuCoords.right}px` : undefined,
              left:
                menuCoords.left !== undefined ? `${menuCoords.left}px` : undefined,
              zIndex: 9999,
            }}
            className="min-w-[175px] rounded-xl border border-border bg-surface p-1 shadow-2xl ring-1 ring-black/10 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-xs"
          >
            <div className="flex flex-col gap-0.5">
              {validItems.map((item, index) => {
                const baseItemClass =
                  "flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left cursor-pointer disabled:opacity-50 disabled:pointer-events-none";

                let variantClass = "text-content hover:bg-surface-hover";
                if (item.variant === "danger") {
                  variantClass =
                    "text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300";
                } else if (item.variant === "warning") {
                  variantClass =
                    "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300";
                } else if (item.variant === "success") {
                  variantClass =
                    "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300";
                }

                const content = (
                  <>
                    {item.icon && (
                      <span className="shrink-0 text-current opacity-80">
                        {item.icon}
                      </span>
                    )}
                    <span className="truncate">{item.label}</span>
                  </>
                );

                if (item.href) {
                  return (
                    <a
                      key={index}
                      href={item.href}
                      target={item.target}
                      rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                      title={item.title}
                      onClick={() => setIsOpen(false)}
                      className={`${baseItemClass} ${variantClass}`}
                      role="menuitem"
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <button
                    key={index}
                    type="button"
                    disabled={item.disabled}
                    title={item.title}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      if (item.onClick) item.onClick();
                    }}
                    className={`${baseItemClass} ${variantClass}`}
                    role="menuitem"
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Iconos Reutilizables para Acciones de Tabla
// -----------------------------------------------------------------------------

export function EditIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function TrashIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function PowerIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}

export function EyeIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function CopyIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function DumbbellIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1a2 2 0 0 0-2.83 0l-1.34 1.34a2 2 0 0 1-2.83 0L3.5 13.84a2 2 0 0 1 0-2.83L4.84 9.66a2 2 0 0 0 0-2.83L3.84 5.83a2 2 0 0 1 0-2.83l.83-.83a2 2 0 0 1 2.83 0l1 1a2 2 0 0 0 2.83 0l1.34-1.34a2 2 0 0 1 2.83 0L20.5 10.16a2 2 0 0 1 0 2.83l-1.34 1.34a2 2 0 0 0 0 2.83l1 1a2 2 0 0 1 0 2.84l-.83.83z" />
    </svg>
  );
}

export function WhatsAppIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.59 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.44 19.65L5.27 16.61L5.07 16.3C4.24 14.98 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67ZM9.11 7.39C8.94 7.39 8.71 7.46 8.52 7.67C8.32 7.89 7.77 8.41 7.77 9.47C7.77 10.53 8.54 11.55 8.65 11.7C8.76 11.85 10.15 14.07 12.33 14.94C14.14 15.66 14.51 15.52 14.92 15.48C15.33 15.44 16.24 14.94 16.43 14.41C16.62 13.88 16.62 13.43 16.56 13.33C16.5 13.23 16.35 13.17 16.12 13.06C15.89 12.95 14.77 12.4 14.56 12.32C14.35 12.24 14.2 12.2 14.05 12.43C13.9 12.66 13.47 13.17 13.34 13.32C13.21 13.47 13.08 13.49 12.85 13.38C12.62 13.27 11.88 13.03 11.01 12.25C10.33 11.64 9.87 10.89 9.74 10.66C9.61 10.43 9.73 10.31 9.84 10.2C9.94 10.1 10.06 9.94 10.17 9.81C10.28 9.68 10.32 9.58 10.39 9.43C10.46 9.28 10.42 9.15 10.36 9.03C10.3 8.91 9.87 7.82 9.69 7.37C9.51 6.93 9.33 6.99 9.19 6.98C9.06 6.97 8.91 6.97 8.76 6.97L9.11 7.39Z" />
    </svg>
  );
}

/**
 * Función utilitaria para generar links directos a WhatsApp limpios
 */
export function getWhatsAppUrl(telefono: string, mensaje?: string): string {
  let cleaned = telefono.replace(/\D/g, "");
  // Si es un número argentino estándar de 10 dígitos (ej: 1155550000)
  if (cleaned.length === 10) {
    cleaned = `549${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = `549${cleaned.slice(1)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith("54") && !cleaned.startsWith("549")) {
    // Si viene como 5411... le insertamos el 9 para WhatsApp móvil de Argentina
    cleaned = `549${cleaned.slice(2)}`;
  }

  const url = new URL(`https://wa.me/${cleaned}`);
  if (mensaje) {
    url.searchParams.set("text", mensaje);
  }
  return url.toString();
}
