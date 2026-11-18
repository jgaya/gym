"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  duplicarRutinaCompleta,
} from "./actions";

interface PlanRutinaTemplatesTableProps {
  templates: PlanRutinaTemplateItem[];
  isLoading?: boolean;
  onEdit?: (template: PlanRutinaTemplateItem) => void;
  onRefresh: () => void;
}

export function PlanRutinaTemplatesTable({
  templates,
  isLoading = false,
  onEdit,
  onRefresh,
}: PlanRutinaTemplatesTableProps) {
  const router = useRouter();
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

  const handleDuplicar = async (id: number) => {
    setActionLoadingId(id);
    try {
      const res = await duplicarRutinaCompleta(id);
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

  const handleEdit = (tpl: PlanRutinaTemplateItem) => {
    if (onEdit) {
      onEdit(tpl);
    } else {
      router.push(`/admin/rutinas/${tpl.id}`);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rutina de Entrenamiento</TableHead>
            <TableHead>Plan / Frecuencia</TableHead>
            <TableHead>Estructura de Días y Ejercicios</TableHead>
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
                  Cargando rutinas...
                </div>
              </td>
            </tr>
          ) : templates.length === 0 ? (
            <TableEmpty
              colSpan={5}
              message="No se encontraron rutinas de entrenamiento cargadas. Podés crear una nueva rutina multi-día en un solo clic."
            />
          ) : (
            templates.map((tpl) => (
              <TableRow key={tpl.id}>
                {/* Nombre y descripción */}
                <TableCell>
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => handleEdit(tpl)}
                      className="font-semibold text-content text-base text-left hover:text-primary transition-colors cursor-pointer"
                    >
                      {tpl.nombre}
                    </button>
                    {tpl.descripcion && (
                      <span className="text-xs text-content-muted max-w-sm line-clamp-2 mt-0.5">
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
                            {d.rutina.nombre.replace(`${tpl.nombre} — `, "")}
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
                          label: "Editar Rutina",
                          icon: <EditIcon />,
                          onClick: () => handleEdit(tpl),
                        },
                        {
                          label: "Duplicar Rutina",
                          icon: (
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
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          ),
                          onClick: () => handleDuplicar(tpl.id),
                        },
                        {
                          label: tpl.isActive ? "Desactivar Rutina" : "Activar Rutina",
                          icon: <PowerIcon />,
                          onClick: () => handleToggleEstado(tpl.id),
                          variant: tpl.isActive ? "warning" : "success",
                        },
                        {
                          label: "Eliminar Rutina",
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
        title="Confirmar eliminación de rutina"
        description="Esta rutina dejará de estar disponible para asignar a nuevos socios. Las asignaciones de entrenamiento existentes no se verán afectadas."
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
              disabled={isDeleting}
            >
              Eliminar Rutina
            </Button>
          </>
        }
      >
        <div className="py-2 text-sm text-content-muted">
          ¿Estás seguro de que deseás eliminar la rutina{" "}
          <strong className="text-content font-bold">{templateToDelete?.nombre}</strong>?
        </div>
      </Modal>
    </>
  );
}

