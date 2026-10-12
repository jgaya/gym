"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { autenticarPorDni } from "./actions";
import { Role } from "@lib/generated/prisma/enums";

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl = "" }: LoginFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"dni" | "password">("dni");
  const [adminInfo, setAdminInfo] = useState<{ nombre: string; role: Role } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const dniInputRef = useRef<HTMLInputElement>(null);

  // Enfocar el input de password cuando se requiera contraseña
  useEffect(() => {
    if (step === "password" && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [step]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!dni.trim()) {
      setError("Por favor ingresá tu número de DNI");
      dniInputRef.current?.focus();
      return;
    }

    if (step === "password" && !password.trim()) {
      setError("Por favor ingresá tu contraseña");
      passwordInputRef.current?.focus();
      return;
    }

    startTransition(async () => {
      try {
        const resultado = await autenticarPorDni({
          dni,
          password: step === "password" ? password : undefined,
          callbackUrl,
        });

        if (!resultado.success) {
          if (resultado.requiresPassword) {
            // El usuario es ADMIN o SUPERADMIN y requiere contraseña
            setStep("password");
            setAdminInfo({
              nombre: resultado.nombre || "Administrador",
              role: resultado.role || Role.ADMIN,
            });
            if (resultado.error) {
              setError(resultado.error);
            }
          } else {
            setError(resultado.error || "Error al verificar tus credenciales");
          }
          return;
        }

        // Redirigir según el rol o callbackUrl
        if (resultado.redirectUrl) {
          router.push(resultado.redirectUrl);
          router.refresh();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Ocurrió un error inesperado al intentar iniciar sesión";
        setError(message);
      }
    });
  };

  const handleVolverADni = () => {
    setStep("dni");
    setPassword("");
    setError(null);
    setAdminInfo(null);
    setTimeout(() => {
      dniInputRef.current?.focus();
    }, 50);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400 animate-in fade-in duration-200">
          ⚠️ {error}
        </div>
      )}

      {step === "dni" ? (
        <>
          <Input
            ref={dniInputRef}
            label="Número de DNI"
            name="dni"
            type="text"
            inputMode="numeric"
            value={dni}
            onChange={(e) => {
              setDni(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Ej: 30000003"
            helperText="Ingresá tu número de documento para acceder a tu rutina."
            required
            autoFocus
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full text-base py-3"
            isLoading={isPending}
          >
            Ingresar
          </Button>
        </>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Notificación de credenciales administrativas (solo visible para admin/superadmin) */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <span>{adminInfo?.role === Role.SUPERADMIN ? "⚡" : "🛡️"}</span>
              <span>
                Cuenta de {adminInfo?.role === Role.SUPERADMIN ? "SuperAdmin" : "Administrador"}
              </span>
            </div>
            <p className="text-[11px] opacity-90">
              Hola, <span className="font-semibold">{adminInfo?.nombre}</span>. Ingresá tu contraseña para desbloquear el panel de control.
            </p>
          </div>

          <div className="rounded-lg bg-surface-hover/50 p-2.5 text-xs text-content-muted flex items-center justify-between border border-border">
            <span>
              DNI: <strong className="text-content font-mono">{dni}</strong>
            </span>
            <button
              type="button"
              onClick={handleVolverADni}
              className="text-xs text-primary hover:underline font-medium cursor-pointer"
            >
              Cambiar
            </button>
          </div>

          <Input
            ref={passwordInputRef}
            label="Contraseña"
            name="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="••••••••"
            required
            autoFocus
          />

          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isPending}
            >
              Iniciar Sesión
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleVolverADni}
              disabled={isPending}
              className="w-full text-xs text-content-muted"
            >
              ← Volver al ingreso por DNI
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
