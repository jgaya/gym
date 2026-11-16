"use client";

import React, { useState, useEffect, useRef } from "react";
import { FONT_STEPS } from "@/lib/fontSize";
import { useFontSize } from "@/lib/useFontSize";

interface FontSizeSelectorProps {
  className?: string;
}

export function FontSizeSelector({ className = "" }: FontSizeSelectorProps) {
  const { stepIndex, currentStep, mounted, setFontSizeIndex } = useFontSize();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const activeLabel = mounted ? currentStep.label : "100%";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Tamaño de fuente (${activeLabel})`}
        title={`Tamaño de fuente: ${activeLabel}`}
        className="relative inline-flex items-center justify-center gap-1 rounded-lg p-2 text-content-muted transition-colors hover:bg-surface-hover hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M4 20h6" />
          <path d="M7 20V6" />
          <path d="M3 8V6h8v2" />
          <path d="M14 14h6" />
          <path d="M17 14v6" />
          <path d="M14 16v-2" />
          <path d="M20 16v-2" />
        </svg>
        {mounted && currentStep.value !== 100 && (
          <span className="text-[10px] font-bold text-primary leading-none">
            {currentStep.label}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Seleccionar tamaño de fuente"
          className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-surface p-1.5 shadow-lg z-50"
        >
          <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-content-muted border-b border-border mb-1">
            Tamaño de fuente
          </div>
          {FONT_STEPS.map((step, idx) => {
            const isSelected = mounted ? idx === stepIndex : step.value === 100;
            return (
              <button
                key={step.value}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => {
                  setFontSizeIndex(idx);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-content hover:bg-surface-hover"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-9 font-semibold">{step.label}</span>
                  <span className="text-[11px] text-content-muted font-normal">
                    {step.tag}
                  </span>
                </span>
                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5 text-primary shrink-0"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
