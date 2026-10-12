import React from "react";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "primary";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  children,
  className = "",
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-surface-hover text-content-muted border border-border",
    primary: "bg-primary/10 text-primary border border-primary/20",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
