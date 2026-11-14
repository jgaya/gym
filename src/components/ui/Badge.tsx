import React from "react";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "primary" | "info";

export interface BadgeProps {
  variant?: BadgeVariant;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  pulse = false,
  children,
  className = "",
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-surface-hover text-content-muted border border-border",
    primary: "bg-primary/10 text-primary border border-primary/25 shadow-2xs",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
    info: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: "bg-content-muted",
    primary: "bg-primary",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold font-mono tracking-tight ${variantStyles[variant]} ${className}`}
    >
      {pulse && (
        <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}
