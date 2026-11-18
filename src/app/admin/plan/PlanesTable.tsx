"use client";

import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  ActionsMenu,
  EditIcon,
  TrashIcon,
  PowerIcon,
} from "@/components/ui/ActionsMenu";
import { PlanItem, eliminarPlan, toggleEstadoPlan } from "./actions";

interface PlanesTableProps {
  planes: PlanItem[];
  isLoading?: boolean;
  onEdit: (plan: PlanItem) => void;
  onRefresh: () => void;
}

export function PlanesTable({
  planes,
  isLoading = false,
  onEdit,
  onRefresh,
}: PlanesTableProps) {
  const [planToDelete, setPlanToDelete] = useState<PlanItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  const handleToggleEstado = async (id: number) => {
    setActionLoadingId(id);
    try {
      const res = await toggleEstadoPlan(id);
      if (res.success) {
        onRefresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    setIsDeleting(true);
    setDeleteWarning(null);
    try {
      const res = await eliminarPlan(planToDelete.id);
      if (res.success) {
        if (res.warning) {
          alert(res.warning);
        }
        setPlanToDelete(null);
        onRefresh();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPrecio = (precio: number | null) => {
    if (precio === null || precio === undefined) return "Sin arancel fijado";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(precio);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan</TableHead>
            <TableHead>Precio Mensual</TableHead>
            <TableHead>Socios Inscriptos</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-content-muted">
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Cargando planes de membresía...
                </div>
              </td>
            </tr>
          ) : planes.length === 0 ? (
            <TableEmpty
              colSpan={5}
              message="No se encontraron planes de entrenamiento"
            />
          ) : (
            planes.map((p) => (
              <TableRow key={p.id}>
                {/* Nombre, frecuencia y descripción */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-content text-base">
                        {p.nombre}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-surface-hover px-2 py-0.5 text-xs font-semibold text-content border border-border">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {p.diasPorSemana} {p.diasPorSemana === 1 ? "día/sem" : "días/sem"}
                      </span>
                    </div>
                    {p.descripcion && (
                      <span className="text-xs text-content-muted max-w-sm truncate">
                        {p.descripcion}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Precio */}
                <TableCell className="font-mono text-sm font-semibold text-content">
                  {formatPrecio(p.precio)}
                </TableCell>

                {/* Miembros */}
                <TableCell>
                  <span className="text-xs font-medium text-content-muted">
                    {p.totalUsuarios > 0 ? (
                      <Badge variant="primary">
                        {p.totalUsuarios} {p.totalUsuarios === 1 ? "usuario" : "usuarios"}
                      </Badge>
                    ) : (
                      <span className="italic text-content-muted/70">Sin miembros</span>
                    )}
                  </span>
                </TableCell>

                {/* Estado interactivo */}
                <TableCell>
                  <button
                    type="button"
                    onClick={() => handleToggleEstado(p.id)}
                    disabled={actionLoadingId === p.id}
                    title="Click para cambiar estado"
                    className="cursor-pointer focus:outline-none"
                  >
                    {p.isActive ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Badge variant="danger">Inactivo</Badge>
                    )}
                  </button>
                </TableCell>

                {/* Acciones */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <ActionsMenu
                      buttonTitle={`Acciones para ${p.nombre}`}
                      items={[
                        {
                          label: "Editar Plan",
                          icon: <EditIcon />,
                          onClick: () => onEdit(p),
                        },
                        {
                          label: p.isActive ? "Desactivar Plan" : "Activar Plan",
                          icon: <PowerIcon />,
                          onClick: () => handleToggleEstado(p.id),
                          variant: p.isActive ? "warning" : "success",
                        },
                        {
                          label: "Eliminar Plan",
                          icon: <TrashIcon />,
                          onClick: () => setPlanToDelete(p),
                          variant: "danger",
                        },
                      ]}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Modal de confirmación */}
      <Modal
        isOpen={Boolean(planToDelete)}
        onClose={() => setPlanToDelete(null)}
        title="Confirmar baja del plan"
        description="Si el plan posee miembros asignados, se desactivará automáticamente para proteger las membresías existentes."
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPlanToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Confirmar
            </Button>
          </>
        }
      >
        {planToDelete && (
          <div className="p-3 rounded-lg bg-surface-hover/70 border border-border text-sm space-y-1">
            <p className="font-semibold text-content">{planToDelete.nombre}</p>
            <p className="text-xs text-content-muted">
              Frecuencia: {planToDelete.diasPorSemana} días/semana • Miembros: {planToDelete.totalUsuarios}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
