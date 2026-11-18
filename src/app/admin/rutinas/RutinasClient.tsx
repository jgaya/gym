"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { PlanRutinaTemplatesTable } from "./PlanRutinaTemplatesTable";
import {
  PlanRutinaTemplateItem,
  getPlanRutinaTemplates,
} from "./actions";

interface PlanOption {
  id: number;
  nombre: string;
  diasPorSemana: number;
}

interface RutinasClientProps {
  initialTemplates: PlanRutinaTemplateItem[];
  planes: PlanOption[];
}

export function RutinasClient({
  initialTemplates,
  planes,
}: RutinasClientProps) {
  // Estado para el listado de Rutinas
  const [templates, setTemplates] = useState<PlanRutinaTemplateItem[]>(initialTemplates);
  const [templateSearch, setTemplateSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [templatePlanFilter, setTemplatePlanFilter] = useState<number | "ALL">("ALL");
  const [isPendingTemplates, startTransitionTemplates] = useTransition();

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(templateSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [templateSearch]);

  // Carga de rutinas filtradas
  const fetchTemplatesData = useCallback(() => {
    startTransitionTemplates(async () => {
      const res = await getPlanRutinaTemplates({
        planId: templatePlanFilter === "ALL" ? undefined : Number(templatePlanFilter),
        search: debouncedSearch,
      });
      setTemplates(res);
    });
  }, [templatePlanFilter, debouncedSearch]);

  useEffect(() => {
    fetchTemplatesData();
  }, [fetchTemplatesData]);

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Botón de Nueva Rutina */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar
            value={templateSearch}
            onChange={setTemplateSearch}
            placeholder="Buscar rutinas por nombre o descripción..."
            className="sm:max-w-xs md:max-w-sm"
          />

          <Select
            value={templatePlanFilter}
            onChange={(e) =>
              setTemplatePlanFilter(
                e.target.value === "ALL" ? "ALL" : Number(e.target.value)
              )
            }
            className="w-52 text-xs"
          >
            <option value="ALL">Todos los planes</option>
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.diasPorSemana} días por semana)
              </option>
            ))}
          </Select>
        </div>

        <Link
          href="/admin/rutinas/nueva"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary-hover transition-colors shrink-0 cursor-pointer"
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
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nueva Rutina
        </Link>
      </div>

      {/* Tabla Unificada de Rutinas */}
      <PlanRutinaTemplatesTable
        templates={templates}
        isLoading={isPendingTemplates}
        onRefresh={fetchTemplatesData}
      />
    </div>
  );
}
