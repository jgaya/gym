"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { PlanesTable } from "./PlanesTable";
import { PlanFormModal } from "./PlanFormModal";
import { PlanItem, getPlanes, GetPlanesResult } from "./actions";

interface PlanesClientProps {
  initialData: GetPlanesResult;
}

export function PlanesClient({ initialData }: PlanesClientProps) {
  const [data, setData] = useState<GetPlanesResult>(initialData);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(initialData.currentPage);
  const [pageSize] = useState(10);
  const [isPending, startTransition] = useTransition();

  // Modal ABM
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(() => {
    startTransition(async () => {
      const res = await getPlanes({
        page,
        pageSize,
        search: debouncedSearch,
        status: statusFilter,
      });
      setData(res);
    });
  }, [page, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setSelectedPlan(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: PlanItem) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Controles: Búsqueda, Filtros y Botón de Nuevo Plan */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o descripción de plan..."
            className="sm:max-w-xs md:max-w-sm"
          />

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
          Nuevo Plan
        </Button>
      </div>

      {/* Tabla de Planes */}
      <PlanesTable
        planes={data.planes}
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

      {/* Modal ABM (Crear / Editar) */}
      <PlanFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        plan={selectedPlan}
        onSuccess={fetchData}
      />
    </div>
  );
}
