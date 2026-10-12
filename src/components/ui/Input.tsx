import React, { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-content"
          >
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-content placeholder:text-content-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:bg-surface-hover ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-border hover:border-content-muted/50"
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-content-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
