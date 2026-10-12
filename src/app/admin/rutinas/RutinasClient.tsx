"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { RutinasTable } from "./RutinasTable";
import { RutinaFormModal } from "./RutinaFormModal";
import { PlanRutinaTemplatesTable } from "./PlanRutinaTemplatesTable";
import { PlanRutinaTemplateModal } from "./PlanRutinaTemplateModal";
import {
  RutinaItem,
  getRutinas,
  GetRutinasResult,
  PlanRutinaTemplateItem,
  getPlanRutinaTemplates,
  getRutinasSelector,
} from "./actions";

interface EjercicioSelectorItem {
  id: number;
  nombre: string;
  grupoMuscular: string | null;
}

interface PlanOption {
  id: number;
  nombre: string;
  diasPorSemana: number;
}

interface RutinaSelectorItem {
  id: number;
  nombre: string;
  esTemplate: boolean;
  totalEjercicios: number;
}

interface RutinasClientProps {
  initialData: GetRutinasResult;
  ejerciciosDisponibles: EjercicioSelectorItem[];
  initialTemplates: PlanRutinaTemplateItem[];
  planes: PlanOption[];
  rutinasSelector: RutinaSelectorItem[];
}

export function RutinasClient({
  initialData,
  ejerciciosDisponibles,
  initialTemplates,
  planes,
  rutinasSelector: initialRutinasSelector,
}: RutinasClientProps) {
  // Tab activo: "templates" (Plantillas de Planes Multi-Día) o "rutinas" (Catálogo Diario)
  const [activeTab, setActiveTab] = useState<"templates" | "rutinas">("templates");

  // Estado para Catálogo Diario
  const [data, setData] = useState<GetRutinasResult>(initialData);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(initialData.currentPage);
  const [pageSize] = useState(10);
  const [isPendingRutinas, startTransitionRutinas] = useTransition();

  // Modal ABM Rutina Diaria
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRutina, setSelectedRutina] = useState<RutinaItem | null>(null);

  // Estado para Plantillas de Planes
  const [templates, setTemplates] = useState<PlanRutinaTemplateItem[]>(initialTemplates);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templatePlanFilter, setTemplatePlanFilter] = useState<number | "ALL">("ALL");
  const [isPendingTemplates, startTransitionTemplates] = useTransition();

  // Selector de rutinas actualizado dinámicamente
  const [rutinasSelector, setRutinasSelector] = useState<RutinaSelectorItem[]>(initialRutinasSelector);

  // Modal ABM Plantilla Multi-Día
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PlanRutinaTemplateItem | null>(null);

  // Debounce para búsqueda en catálogo diario
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Carga de rutinas diarias
  const fetchRutinasData = useCallback(() => {
    startTransitionRutinas(async () => {
      const res = await getRutinas({
        page,
        pageSize,
        search: debouncedSearch,
        templateFilter,
        status: statusFilter,
      });
      setData(res);

      // También actualizar selector de rutinas para plantillas
      const selectorRes = await getRutinasSelector();
      setRutinasSelector(selectorRes);
    });
  }, [page, pageSize, debouncedSearch, templateFilter, statusFilter]);

  useEffect(() => {
    fetchRutinasData();
  }, [fetchRutinasData]);

  // Carga de plantillas de planes
  const fetchTemplatesData = useCallback(() => {
    startTransitionTemplates(async () => {
      const res = await getPlanRutinaTemplates({
        planId: templatePlanFilter === "ALL" ? undefined : Number(templatePlanFilter),
        search: templateSearch,
      });
      setTemplates(res);
    });
  }, [templatePlanFilter, templateSearch]);

  useEffect(() => {
    fetchTemplatesData();
  }, [fetchTemplatesData]);

  // Handlers para Rutinas Diarias
  const handleOpenCreateRutina = () => {
    setSelectedRutina(null);
    setIsModalOpen(true);
  };

  const handleOpenEditRutina = (rutina: RutinaItem) => {
    setSelectedRutina(rutina);
    setIsModalOpen(true);
  };

  const handleDuplicateRutina = (rutina: RutinaItem) => {
    const duplicada: RutinaItem = {
      ...rutina,
      id: 0,
      nombre: `Copia de ${rutina.nombre}`,
      esTemplate: false,
    };
    setSelectedRutina(duplicada);
    setIsModalOpen(true);
  };

  // Handlers para Plantillas de Planes
  const handleOpenCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (tpl: PlanRutinaTemplateItem) => {
    setSelectedTemplate(tpl);
    setIsTemplateModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Selector de Pestañas / Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("templates")}
          className={`flex items-center gap-2 border-b-2 py-3 px-5 text-sm font-semibold transition-all ${activeTab === "templates"
              ? "border-primary text-primary"
              : "border-transparent text-content-muted hover:border-border hover:text-content"
            }`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          Plantillas por Plan (Multi-Día)
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === "templates"
                ? "bg-primary/20 text-primary"
                : "bg-surface-hover text-content-muted"
              }`}
          >
            {templates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rutinas")}
          className={`flex items-center gap-2 border-b-2 py-3 px-5 text-sm font-semibold transition-all ${activeTab === "rutinas"
              ? "border-primary text-primary"
              : "border-transparent text-content-muted hover:border-border hover:text-content"
            }`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          Catálogo de Rutinas Diarias
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === "rutinas"
                ? "bg-primary/20 text-primary"
                : "bg-surface-hover text-content-muted"
              }`}
          >
            {data.totalItems}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PLANTILLAS POR PLAN (MULTI-DÍA) */}
      {/* ========================================================================= */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <SearchBar
                value={templateSearch}
                onChange={setTemplateSearch}
                placeholder="Buscar plantillas por nombre o descripción..."
                className="sm:max-w-xs md:max-w-sm"
              />

              <Select
                value={templatePlanFilter}
                onChange={(e) =>
                  setTemplatePlanFilter(
                    e.target.value === "ALL" ? "ALL" : Number(e.target.value)
                  )
                }
                className="w-48 text-xs"
              >
                <option value="ALL">Todos los planes</option>
                {planes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.diasPorSemana} días)
                  </option>
                ))}
              </Select>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleOpenCreateTemplate}
              className="shrink-0"
            >
              <svg
                className="h-4 w-4 mr-1.5"
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
              Nueva Plantilla de Plan
            </Button>
          </div>

          <PlanRutinaTemplatesTable
            templates={templates}
            isLoading={isPendingTemplates}
            onEdit={handleOpenEditTemplate}
            onRefresh={fetchTemplatesData}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CATÁLOGO DE RUTINAS DIARIAS */}
      {/* ========================================================================= */}
      {activeTab === "rutinas" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Buscar por nombre o descripción de rutina..."
                className="sm:max-w-xs md:max-w-sm"
              />

              <div className="flex items-center gap-2">
                <Select
                  value={templateFilter}
                  onChange={(e) => {
                    setTemplateFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-40 text-xs"
                >
                  <option value="ALL">Todas las rutinas</option>
                  <option value="TEMPLATES">Solo Plantillas</option>
                  <option value="NORMAL">Solo Rutinas Regulares</option>
                </Select>

                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-36 text-xs"
                >
                  <option value="ALL">Todos los estados</option>
                  <option value="active">Activas</option>
                  <option value="inactive">Inactivas</option>
                </Select>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleOpenCreateRutina}
              className="shrink-0"
            >
              <svg
                className="h-4 w-4 mr-1.5"
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
              Nueva Rutina Diaria
            </Button>
          </div>

          <RutinasTable
            rutinas={data.rutinas}
            isLoading={isPendingRutinas}
            onEdit={handleOpenEditRutina}
            onDuplicate={handleDuplicateRutina}
            onRefresh={fetchRutinasData}
          />

          <Pagination
            currentPage={data.currentPage}
            totalPages={data.totalPages}
            totalItems={data.totalItems}
            pageSize={data.pageSize}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Modal ABM Rutina Diaria */}
      <RutinaFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rutina={
          selectedRutina && selectedRutina.id > 0
            ? selectedRutina
            : selectedRutina
              ? { ...selectedRutina, id: 0 }
              : null
        }
        ejerciciosDisponibles={ejerciciosDisponibles}
        onSuccess={() => {
          fetchRutinasData();
        }}
      />

      {/* Modal ABM Plantilla Multi-Día */}
      <PlanRutinaTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        template={selectedTemplate}
        planes={planes}
        rutinas={rutinasSelector}
        onSuccess={() => {
          fetchTemplatesData();
        }}
      />
    </div>
  );
}

