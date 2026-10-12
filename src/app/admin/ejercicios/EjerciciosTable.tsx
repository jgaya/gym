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
  EyeIcon,
} from "@/components/ui/ActionsMenu";
import { EjercicioItem, eliminarEjercicio, toggleEstadoEjercicio } from "./actions";

interface EjerciciosTableProps {
  ejercicios: EjercicioItem[];
  isLoading?: boolean;
  onEdit: (ejercicio: EjercicioItem) => void;
  onRefresh: () => void;
}

export function EjerciciosTable({
  ejercicios,
  isLoading = false,
  onEdit,
  onRefresh,
}: EjerciciosTableProps) {
  const [ejercicioToView, setEjercicioToView] = useState<EjercicioItem | null>(null);
  const [ejercicioToDelete, setEjercicioToDelete] = useState<EjercicioItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const handleToggleEstado = async (id: number) => {
    setActionLoadingId(id);
    try {
      const res = await toggleEstadoEjercicio(id);
      if (res.success) {
        onRefresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!ejercicioToDelete) return;
    setIsDeleting(true);
    try {
      const res = await eliminarEjercicio(ejercicioToDelete.id);
      if (res.success) {
        setEjercicioToDelete(null);
        onRefresh();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getGrupoMuscularBadge = (grupo: string | null) => {
    if (!grupo) {
      return <Badge variant="default">General</Badge>;
    }
    return <Badge variant="primary">{grupo}</Badge>;
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ejercicio</TableHead>
            <TableHead>Grupo Muscular</TableHead>
            <TableHead>Multimedia</TableHead>
            <TableHead>Rutinas Asociadas</TableHead>
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
                  Cargando catálogo de ejercicios...
                </div>
              </td>
            </tr>
          ) : ejercicios.length === 0 ? (
            <TableEmpty
              colSpan={6}
              message="No se encontraron ejercicios en el catálogo"
            />
          ) : (
            ejercicios.map((ej) => (
              <TableRow key={ej.id}>
                {/* Nombre y descripción */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-base font-bold text-content border border-border">
                      💪
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-content text-sm">
                        {ej.nombre}
                      </span>
                      {ej.descripcion && (
                        <p
                          onClick={() => setEjercicioToView(ej)}
                          className="text-xs text-content-muted max-w-sm line-clamp-2 leading-relaxed mt-0.5 cursor-pointer hover:text-primary transition-colors"
                          title="Hacé click para ver la técnica completa"
                        >
                          {ej.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Grupo Muscular */}
                <TableCell>{getGrupoMuscularBadge(ej.grupoMuscular)}</TableCell>

                {/* Multimedia */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {ej.imagenUrl ? (
                      <a
                        href={ej.imagenUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                        title="Ver imagen / GIF"
                      >
                        🖼️ Ver
                      </a>
                    ) : null}

                    {ej.videoUrl ? (
                      <a
                        href={ej.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                        title="Ver video demostrativo"
                      >
                        🎬 Video
                      </a>
                    ) : null}

                    {!ej.imagenUrl && !ej.videoUrl && (
                      <span className="text-xs text-content-muted/60 italic">Sin recursos</span>
                    )}
                  </div>
                </TableCell>

                {/* Rutinas asociadas */}
                <TableCell>
                  {ej.totalRutinas > 0 ? (
                    <Badge variant="default">
                      {ej.totalRutinas} {ej.totalRutinas === 1 ? "rutina" : "rutinas"}
                    </Badge>
                  ) : (
                    <span className="text-xs text-content-muted/60 italic">No asignado</span>
                  )}
                </TableCell>

                {/* Estado interactivo */}
                <TableCell>
                  <button
                    type="button"
                    onClick={() => handleToggleEstado(ej.id)}
                    disabled={actionLoadingId === ej.id}
                    title="Click para alternar estado"
                    className="cursor-pointer focus:outline-none"
                  >
                    {ej.isActive ? (
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
                      buttonTitle={`Acciones para ${ej.nombre}`}
                      items={[
                        ej.descripcion
                          ? {
                              label: "Ver Técnica Detallada",
                              icon: <EyeIcon />,
                              onClick: () => setEjercicioToView(ej),
                            }
                          : null,
                        {
                          label: "Editar Ejercicio",
                          icon: <EditIcon />,
                          onClick: () => onEdit(ej),
                        },
                        {
                          label: ej.isActive ? "Desactivar Ejercicio" : "Activar Ejercicio",
                          icon: <PowerIcon />,
                          onClick: () => handleToggleEstado(ej.id),
                          variant: ej.isActive ? "warning" : "success",
                        },
                        {
                          label: "Dar de Baja",
                          icon: <TrashIcon />,
                          onClick: () => setEjercicioToDelete(ej),
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

      {/* Modal de confirmación de baja */}
      <Modal
        isOpen={Boolean(ejercicioToDelete)}
        onClose={() => setEjercicioToDelete(null)}
        title="Confirmar baja del ejercicio"
        description="El ejercicio se dará de baja del catálogo activo. El historial de pesos y progresos anteriores se mantendrán protegidos."
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEjercicioToDelete(null)}
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
        {ejercicioToDelete && (
          <div className="p-3 rounded-lg bg-surface-hover/70 border border-border text-sm space-y-1">
            <p className="font-semibold text-content">{ejercicioToDelete.nombre}</p>
            <p className="text-xs text-content-muted">
              Grupo: {ejercicioToDelete.grupoMuscular || "General"} • En {ejercicioToDelete.totalRutinas} rutinas
            </p>
          </div>
        )}
      </Modal>

      {/* Modal de Técnica Detallada e Instrucciones */}
      <Modal
        isOpen={Boolean(ejercicioToView)}
        onClose={() => setEjercicioToView(null)}
        title={ejercicioToView?.nombre || "Instrucciones de Ejecución"}
        description={`Grupo Muscular: ${ejercicioToView?.grupoMuscular || "General"}`}
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div>
              {ejercicioToView?.videoUrl ? (
                <a
                  href={ejercicioToView.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-surface-hover transition-colors"
                >
                  🎬 Ver Video Demostrativo
                </a>
              ) : null}
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEjercicioToView(null)}
            >
              Cerrar
            </Button>
          </div>
        }
      >
        {ejercicioToView && (
          <div className="space-y-4">
            {ejercicioToView.imagenUrl && (
              <div className="overflow-hidden rounded-xl border border-border max-h-56 bg-surface-hover/30 flex items-center justify-center p-2">
                <img
                  src={ejercicioToView.imagenUrl}
                  alt={ejercicioToView.nombre}
                  className="max-h-52 w-auto object-contain rounded-lg"
                />
              </div>
            )}

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Técnica, Pasos y Advertencias de Seguridad
              </span>
              <div className="p-4 rounded-xl bg-surface-hover/50 border border-border text-sm text-content leading-relaxed whitespace-pre-line font-sans">
                {ejercicioToView.descripcion || "Este ejercicio no tiene instrucciones registradas todavía."}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
