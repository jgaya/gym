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
import {
  PlanRutinaTemplateItem,
  toggleEstadoPlanRutinaTemplate,
  eliminarPlanRutinaTemplate,
} from "./actions";

interface PlanRutinaTemplatesTableProps {
  templates: PlanRutinaTemplateItem[];
  isLoading?: boolean;
  onEdit: (template: PlanRutinaTemplateItem) => void;
  onRefresh: () => void;
}

export function PlanRutinaTemplatesTable({
  templates,
  isLoading = false,
  onEdit,
  onRefresh,
}: PlanRutinaTemplatesTableProps) {
  const [templateToDelete, setTemplateToDelete] = useState<PlanRutinaTemplateItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const handleToggleEstado = async (id: number) => {
    setActionLoadingId(id);
    try {
      const res = await toggleEstadoPlanRutinaTemplate(id);
      if (res.success) {
        onRefresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
      const res = await eliminarPlanRutinaTemplate(templateToDelete.id);
      if (res.success) {
        setTemplateToDelete(null);
        onRefresh();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plantilla Multi-Día</TableHead>
            <TableHead>Plan Asociado</TableHead>
            <TableHead>Estructura de Días y Rutinas</TableHead>
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
                  Cargando plantillas de planes...
                </div>
              </td>
            </tr>
          ) : templates.length === 0 ? (
            <TableEmpty
              colSpan={5}
              message="No se encontraron plantillas de entrenamiento para planes. Podés crear una para 2, 3 o 5 días."
            />
          ) : (
            templates.map((tpl) => (
              <TableRow key={tpl.id}>
                {/* Nombre y descripción */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-content text-base">
                      {tpl.nombre}
                    </span>
                    {tpl.descripcion && (
                      <span className="text-xs text-content-muted max-w-sm line-clamp-2">
                        {tpl.descripcion}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Plan asociado */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-content text-sm">
                      {tpl.plan.nombre}
                    </span>
                    <Badge variant="primary" className="w-fit">
                      {tpl.plan.diasPorSemana} días por semana
                    </Badge>
                  </div>
                </TableCell>

                {/* Días y Rutinas */}
                <TableCell>
                  <div className="flex flex-col gap-1.5 max-w-md">
                    <div className="flex flex-wrap gap-1.5">
                      {tpl.dias.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-hover/50 px-2.5 py-1 text-xs"
                        >
                          <span className="flex h-4 w-4 items-center justify-center rounded bg-primary/20 text-[10px] font-black text-primary">
                            {d.diaNumero}
                          </span>
                          <span className="font-semibold text-content">
                            {d.nombreDia || `Día ${d.diaNumero}`}:
                          </span>
                          <span className="text-content-muted">
                            {d.rutina.nombre}
                          </span>
                          <span className="text-[10px] text-content-muted/70">
                            ({d.rutina.totalEjercicios} ej.)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TableCell>

                {/* Estado */}
                <TableCell>
                  <button
                    type="button"
                    onClick={() => handleToggleEstado(tpl.id)}
                    disabled={actionLoadingId === tpl.id}
                    title="Click para alternar estado"
                    className="cursor-pointer focus:outline-none"
                  >
                    {tpl.isActive ? (
                      <Badge variant="success">Activa</Badge>
                    ) : (
                      <Badge variant="danger">Inactiva</Badge>
                    )}
                  </button>
                </TableCell>

                {/* Acciones */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <ActionsMenu
                      buttonTitle={`Acciones para ${tpl.nombre}`}
                      items={[
                        {
                          label: "Editar Plantilla",
                          icon: <EditIcon />,
                          onClick: () => onEdit(tpl),
                        },
                        {
                          label: tpl.isActive ? "Desactivar Plantilla" : "Activar Plantilla",
                          icon: <PowerIcon />,
                          onClick: () => handleToggleEstado(tpl.id),
                          variant: tpl.isActive ? "warning" : "success",
                        },
                        {
                          label: "Eliminar Plantilla",
                          icon: <TrashIcon />,
                          onClick: () => setTemplateToDelete(tpl),
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

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={Boolean(templateToDelete)}
        onClose={() => setTemplateToDelete(null)}
        title="Confirmar eliminación de plantilla"
        description="Esta plantilla dejará de estar disponible para asignar a nuevos socios. Las asignaciones existentes no se verán afectadas."
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTemplateToDelete(null)}
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
              Confirmar Eliminación
            </Button>
          </>
        }
      >
        {templateToDelete && (
          <div className="p-3 rounded-lg bg-surface-hover/70 border border-border text-sm space-y-1">
            <p className="font-semibold text-content">{templateToDelete.nombre}</p>
            <p className="text-xs text-content-muted">
              Plan: {templateToDelete.plan.nombre} ({templateToDelete.totalDias} días)
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}

