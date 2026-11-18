import React from "react";

export interface StepItem {
  number: number;
  title: string;
  description: React.ReactNode;
  example?: string;
  badge?: string;
}

interface StepGuideProps {
  steps: StepItem[];
  className?: string;
}

export function StepGuide({ steps, className = "" }: StepGuideProps) {
  return (
    <div className={`space-y-4 my-4 ${className}`}>
      {steps.map((step) => (
        <div
          key={step.number}
          className="flex items-start gap-3.5 rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/40 hover:shadow-xs"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-xs shadow-xs">
            {step.number}
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-content">{step.title}</h4>
              {step.badge && (
                <span className="rounded-md bg-surface-hover border border-border px-2 py-0.5 text-[10px] font-semibold text-content-muted">
                  {step.badge}
                </span>
              )}
            </div>
            <div className="text-xs sm:text-sm text-content-muted leading-relaxed">
              {step.description}
            </div>
            {step.example && (
              <div className="mt-2 rounded-lg bg-surface-hover/70 border border-border/80 px-3 py-2 text-xs font-mono text-content">
                <span className="text-[10px] font-bold text-primary uppercase block tracking-wider font-sans mb-0.5">
                  Ejemplo práctico:
                </span>
                {step.example}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
