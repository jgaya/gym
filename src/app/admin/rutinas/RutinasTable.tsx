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
  CopyIcon,
  TrashIcon,
  PowerIcon,
} from "@/components/ui/ActionsMenu";
import { RutinaItem, eliminarRutina, toggleEstadoRutina } from "./actions";

interface RutinasTableProps {
  rutinas: RutinaItem[];
  isLoading?: boolean;
  onEdit: (rutina: RutinaItem) => void;
  onDuplicate: (rutina: RutinaItem) => void;
  onRefresh: () => void;
}

export function RutinasTable({
  rutinas,
  isLoading = false,
  onEdit,
  onDuplicate,
  onRefresh,
}: RutinasTableProps) {
  const [rutinaToDelete, setRutinaToDelete] = useState<RutinaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const handleToggleEstado = async (id: number) => {
    setActionLoadingId(id);
    try {
      const res = await toggleEstadoRutina(id);
      if (res.success) {
        onRefresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!rutinaToDelete) return;
    setIsDeleting(true);
    try {
      const res = await eliminarRutina(rutinaToDelete.id);
      if (res.success) {
        setRutinaToDelete(null);
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
            <TableHead>Rutina</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Ejercicios ({rutinas.length})</TableHead>
            <TableHead>Miembros</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-content-muted">
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Cargando catálogo de rutinas...
                </div>
              </td>
            </tr>
          ) : rutinas.length === 0 ? (
            <TableEmpty
              colSpan={6}
              message="No se encontraron rutinas registradas"
            />
          ) : (
            rutinas.map((r) => (
              <TableRow key={r.id}>
                {/* Nombre y descripción */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-content text-base">
                      {r.nombre}
                    </span>
                    {r.descripcion && (
                      <span className="text-xs text-content-muted max-w-sm truncate">
                        {r.descripcion}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Tipo (Template o Normal) */}
                <TableCell>
                  {r.esTemplate ? (
                    <Badge variant="primary">Plantilla Base</Badge>
                  ) : (
                    <Badge variant="default">Rutina Regular</Badge>
                  )}
                </TableCell>

                {/* Ejercicios incluidos */}
                <TableCell>
                  <div className="flex flex-col gap-1 max-w-md">
                    <span className="text-xs font-bold text-content">
                      {r.totalEjercicios} {r.totalEjercicios === 1 ? "ejercicio" : "ejercicios"}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {r.ejercicios.slice(0, 3).map((re) => (
                        <span
                          key={re.id}
                          className="inline-flex items-center gap-1 text-[11px] bg-surface-hover px-2 py-0.5 rounded text-content border border-border/60"
                        >
                          <span>{re.ejercicio.nombre} ({re.series}x{re.repeticiones})</span>
                          {re.grupoNumero && (
                            <span className="font-bold text-primary text-[9px] bg-primary/10 px-1 rounded">
                              G{re.grupoNumero}
                            </span>
                          )}
                        </span>
                      ))}
                      {r.ejercicios.length > 3 && (
                        <span className="inline-flex items-center text-[10px] text-content-muted font-semibold px-1 py-0.5">
                          +{r.ejercicios.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Miembros que la realizan */}
                <TableCell>
                  <span className="text-xs font-medium text-content-muted">
                    {r.totalUsuarios > 0 ? (
                      <Badge variant="default">
                        {r.totalUsuarios} {r.totalUsuarios === 1 ? "miembro" : "miembros"}
                      </Badge>
                    ) : (
                      <span className="italic text-content-muted/60">Sin asignar</span>
                    )}
                  </span>
                </TableCell>

                {/* Estado interactivo */}
                <TableCell>
                  <button
                    type="button"
                    onClick={() => handleToggleEstado(r.id)}
                    disabled={actionLoadingId === r.id}
                    title="Click para alternar estado"
                    className="cursor-pointer focus:outline-none"
                  >
                    {r.isActive ? (
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
                      buttonTitle={`Acciones para ${r.nombre}`}
                      items={[
                        {
                          label: "Editar Rutina",
                          icon: <EditIcon />,
                          onClick: () => onEdit(r),
                        },
                        {
                          label: "Duplicar Plantilla",
                          icon: <CopyIcon />,
                          onClick: () => onDuplicate(r),
                        },
                        {
                          label: r.isActive ? "Desactivar Rutina" : "Activar Rutina",
                          icon: <PowerIcon />,
                          onClick: () => handleToggleEstado(r.id),
                          variant: r.isActive ? "warning" : "success",
                        },
                        {
                          label: "Dar de Baja",
                          icon: <TrashIcon />,
                          onClick: () => setRutinaToDelete(r),
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
        isOpen={Boolean(rutinaToDelete)}
        onClose={() => setRutinaToDelete(null)}
        title="Confirmar baja de rutina"
        description="La rutina dejará de estar disponible para nuevas asignaciones. Los historiales previos de los alumnos se conservarán."
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRutinaToDelete(null)}
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
              Confirmar Baja
            </Button>
          </>
        }
      >
        {rutinaToDelete && (
          <div className="p-3 rounded-lg bg-surface-hover/70 border border-border text-sm space-y-1">
            <p className="font-semibold text-content">{rutinaToDelete.nombre}</p>
            <p className="text-xs text-content-muted">
              {rutinaToDelete.totalEjercicios} ejercicios • {rutinaToDelete.totalUsuarios} usuarios activos
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
