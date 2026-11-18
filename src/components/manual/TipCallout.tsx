import React from "react";

export type TipVariant = "tip" | "info" | "warning" | "success";

interface TipCalloutProps {
  variant?: TipVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function TipCallout({
  variant = "tip",
  title,
  children,
  className = "",
}: TipCalloutProps) {
  const configs: Record<
    TipVariant,
    { border: string; bg: string; text: string; icon: string; defaultTitle: string }
  > = {
    tip: {
      border: "border-primary/30",
      bg: "bg-primary/5",
      text: "text-primary",
      icon: "💡",
      defaultTitle: "Consejo Práctico",
    },
    info: {
      border: "border-sky-500/30",
      bg: "bg-sky-500/5",
      text: "text-sky-600 dark:text-sky-400",
      icon: "ℹ️",
      defaultTitle: "Información Importante",
    },
    warning: {
      border: "border-amber-500/30",
      bg: "bg-amber-500/5",
      text: "text-amber-600 dark:text-amber-400",
      icon: "⚠️",
      defaultTitle: "Atención",
    },
    success: {
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/5",
      text: "text-emerald-600 dark:text-emerald-400",
      icon: "✅",
      defaultTitle: "Mejor Práctica",
    },
  };

  const config = configs[variant];

  return (
    <div
      className={`rounded-xl border ${config.border} ${config.bg} p-4 text-xs sm:text-sm my-3 ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-base select-none shrink-0" aria-hidden="true">
          {config.icon}
        </span>
        <div className="space-y-1 flex-1">
          <p className={`font-bold ${config.text}`}>
            {title || config.defaultTitle}
          </p>
          <div className="text-content leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}
