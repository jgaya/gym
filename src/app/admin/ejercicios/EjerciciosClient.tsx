"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { EjerciciosTable } from "./EjerciciosTable";
import { EjercicioFormModal } from "./EjercicioFormModal";
import {
  EjercicioItem,
  getEjercicios,
  GetEjerciciosResult,
} from "./actions";
import { GRUPOS_MUSCULARES } from "./constants";

interface EjerciciosClientProps {
  initialData: GetEjerciciosResult;
}

export function EjerciciosClient({ initialData }: EjerciciosClientProps) {
  const [data, setData] = useState<GetEjerciciosResult>(initialData);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [grupoFilter, setGrupoFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(initialData.currentPage);
  const [pageSize] = useState(10);
  const [isPending, startTransition] = useTransition();

  // Modal ABM
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEjercicio, setSelectedEjercicio] = useState<EjercicioItem | null>(null);

  // Debounce para búsqueda (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(() => {
    startTransition(async () => {
      const res = await getEjercicios({
        page,
        pageSize,
        search: debouncedSearch,
        grupoMuscular: grupoFilter,
        status: statusFilter,
      });
      setData(res);
    });
  }, [page, pageSize, debouncedSearch, grupoFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setSelectedEjercicio(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ej: EjercicioItem) => {
    setSelectedEjercicio(ej);
    setIsModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Controles: Búsqueda, Filtros y Nuevo Ejercicio */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por ejercicio, músculo o técnica..."
            className="sm:max-w-xs md:max-w-sm"
          />

          <div className="flex items-center gap-2">
            <Select
              value={grupoFilter}
              onChange={(e) => {
                setGrupoFilter(e.target.value);
                setPage(1);
              }}
              className="w-40 text-xs"
            >
              <option value="ALL">Todos los grupos</option>
              {GRUPOS_MUSCULARES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
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
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </Select>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={handleOpenCreate}
          className="shrink-0"
        >
          <svg
            className="h-4 w-4 mr-1.5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Ejercicio
        </Button>
      </div>

      {/* Tabla de Ejercicios */}
      <EjerciciosTable
        ejercicios={data.ejercicios}
        isLoading={isPending}
        onEdit={handleOpenEdit}
        onRefresh={fetchData}
      />

      {/* Paginación */}
      <Pagination
        currentPage={data.currentPage}
        totalPages={data.totalPages}
        totalItems={data.totalItems}
        pageSize={data.pageSize}
        onPageChange={handlePageChange}
      />

      {/* Modal ABM (Crear / Modificar) */}
      <EjercicioFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ejercicio={selectedEjercicio}
        onSuccess={fetchData}
      />
    </div>
  );
}
