"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { SucursalesTable } from "./SucursalesTable";
import { SucursalFormModal } from "./SucursalFormModal";
import { SucursalItem, getSucursales, GetSucursalesResult } from "./actions";

interface SucursalesClientProps {
  initialData: GetSucursalesResult;
}

export function SucursalesClient({ initialData }: SucursalesClientProps) {
  const [data, setData] = useState<GetSucursalesResult>(initialData);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(initialData.currentPage);
  const [pageSize] = useState(10);
  const [isPending, startTransition] = useTransition();

  // Modal ABM
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSucursal, setSelectedSucursal] = useState<SucursalItem | null>(
    null
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(() => {
    startTransition(async () => {
      const res = await getSucursales({
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
    setSelectedSucursal(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sucursal: SucursalItem) => {
    setSelectedSucursal(sucursal);
    setIsModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Controles */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por barrio, dirección, teléfono u horarios..."
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
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nueva Sucursal
        </Button>
      </div>

      {/* Tabla de Sucursales */}
      <SucursalesTable
        sucursales={data.sucursales}
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

      {/* Modal ABM */}
      <SucursalFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sucursal={selectedSucursal}
        onSuccess={fetchData}
      />
    </div>
  );
}
