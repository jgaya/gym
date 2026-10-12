"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { UsuariosTable } from "./UsuariosTable";
import { UsuarioFormModal } from "./UsuarioFormModal";
import {
  UsuarioItem,
  getUsuarios,
  GetUsuariosResult,
} from "./actions";

interface PlanOption {
  id: number;
  nombre: string;
  diasPorSemana: number;
}

interface UsuariosClientProps {
  initialData: GetUsuariosResult;
  planes: PlanOption[];
}

export function UsuariosClient({ initialData, planes }: UsuariosClientProps) {
  const [data, setData] = useState<GetUsuariosResult>(initialData);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(initialData.currentPage);
  const [pageSize] = useState(10);
  const [isPending, startTransition] = useTransition();

  // Modal de Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioItem | null>(null);

  // Debounce para la búsqueda (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Volver a la primera página al buscar
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Cargar datos al cambiar filtros o página
  const fetchData = useCallback(() => {
    startTransition(async () => {
      const res = await getUsuarios({
        page,
        pageSize,
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
      });
      setData(res);
    });
  }, [page, pageSize, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (usuario: UsuarioItem) => {
    setSelectedUser(usuario);
    setIsModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Controles: Búsqueda, Filtros y Botón de Acción */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, email, DNI o teléfono..."
            className="sm:max-w-xs md:max-w-sm"
          />

          <div className="flex items-center gap-2">
            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-36 text-xs"
            >
              <option value="ALL">Todos los roles</option>
              <option value="USER">Miembros</option>
              <option value="ADMIN">Admins</option>
              <option value="SUPERADMIN">Super Admin</option>
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
          Nuevo Miembro
        </Button>
      </div>

      {/* Tabla de Usuarios */}
      <UsuariosTable
        usuarios={data.usuarios}
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
      <UsuarioFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        usuario={selectedUser}
        planes={planes}
        onSuccess={fetchData}
      />
    </div>
  );
}
