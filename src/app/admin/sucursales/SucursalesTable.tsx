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
  WhatsAppIcon,
  getWhatsAppUrl,
} from "@/components/ui/ActionsMenu";
import {
  SucursalItem,
  eliminarSucursal,
  toggleEstadoSucursal,
  toggleKioscoSucursal,
} from "./actions";

interface SucursalesTableProps {
  sucursales: SucursalItem[];
  isLoading?: boolean;
  onEdit: (sucursal: SucursalItem) => void;
  onRefresh: () => void;
}

export function SucursalesTable({
  sucursales,
  isLoading = false,
  onEdit,
  onRefresh,
}: SucursalesTableProps) {
  const [sucursalToDelete, setSucursalToDelete] = useState<SucursalItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const handleToggleEstado = async (id: number) => {
    setActionLoadingId(id);
    try {
      const res = await toggleEstadoSucursal(id);
      if (res.success) {
        onRefresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleKiosco = async (id: number) => {
    setActionLoadingId(id);
    try {
      const res = await toggleKioscoSucursal(id);
      if (res.success) {
        onRefresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!sucursalToDelete) return;
    setIsDeleting(true);
    try {
      const res = await eliminarSucursal(sucursalToDelete.id);
      if (res.success) {
        if (res.warning) {
          alert(res.warning);
        }
        setSucursalToDelete(null);
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
            <TableHead>Sucursal / Barrio</TableHead>
            <TableHead>Dirección y Teléfono</TableHead>
            <TableHead>Horarios</TableHead>
            <TableHead>Kiosco</TableHead>
            <TableHead>Redes Sociales</TableHead>
            <TableHead>Socios</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <tr>
              <td
                colSpan={8}
                className="px-6 py-12 text-center text-content-muted"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Cargando sucursales...
                </div>
              </td>
            </tr>
          ) : sucursales.length === 0 ? (
            <TableEmpty
              colSpan={8}
              message="No se encontraron sucursales registradas"
            />
          ) : (
            sucursales.map((s) => (
              <TableRow key={s.id}>
                {/* Barrio e Imagen */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    {s.imagen ? (
                      <img
                        src={s.imagen}
                        alt={s.barrio}
                        className="h-10 w-10 rounded-lg object-cover border border-border shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
                        📍
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-bold text-content text-sm">
                        {s.barrio}
                      </span>
                      <span className="text-[11px] text-content-muted">
                        ID #{s.id}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Dirección y Teléfono */}
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-content">
                      {s.direccion}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-content-muted">
                      <span>{s.telefono}</span>
                      {s.telefono && (
                        <a
                          href={getWhatsAppUrl(
                            s.telefono,
                            `Hola Meraki (${s.barrio})!`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`WhatsApp ${s.barrio}`}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors"
                        >
                          <WhatsAppIcon className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Horarios */}
                <TableCell>
                  <span className="text-xs text-content-muted max-w-xs block leading-relaxed">
                    {s.horarios}
                  </span>
                </TableCell>

                {/* Kiosco */}
                <TableCell>
                  <button
                    type="button"
                    onClick={() => handleToggleKiosco(s.id)}
                    disabled={actionLoadingId === s.id}
                    title="Click para habilitar/deshabilitar Kiosco en esta sucursal"
                    className="cursor-pointer focus:outline-none"
                  >
                    {s.tieneKiosco ? (
                      <Badge variant="success">🥤 Habilitado</Badge>
                    ) : (
                      <Badge variant="default">Sin Kiosco</Badge>
                    )}
                  </button>
                </TableCell>

                {/* Redes Sociales */}
                <TableCell>
                  <div className="flex items-center gap-2 text-xs">
                    {s.urlInstagram ? (
                      <a
                        href={s.urlInstagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-pink-500/10 px-2 py-1 font-semibold text-pink-500 hover:bg-pink-500/20 transition-colors"
                      >
                        Instagram
                      </a>
                    ) : null}
                    {s.urlTiktok ? (
                      <a
                        href={s.urlTiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-surface-hover border border-border px-2 py-1 font-semibold text-content hover:border-primary/40 transition-colors"
                      >
                        TikTok
                      </a>
                    ) : null}
                    {!s.urlInstagram && !s.urlTiktok && (
                      <span className="text-xs italic text-content-muted/70">
                        Sin enlaces
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Total Socios */}
                <TableCell>
                  {s.totalUsuarios > 0 ? (
                    <Badge variant="primary">
                      {s.totalUsuarios}{" "}
                      {s.totalUsuarios === 1 ? "socio" : "socios"}
                    </Badge>
                  ) : (
                    <span className="text-xs italic text-content-muted/70">
                      Sin socios
                    </span>
                  )}
                </TableCell>

                {/* Estado */}
                <TableCell>
                  <button
                    type="button"
                    onClick={() => handleToggleEstado(s.id)}
                    disabled={actionLoadingId === s.id}
                    title="Click para cambiar estado"
                    className="cursor-pointer focus:outline-none"
                  >
                    {s.isActive ? (
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
                      buttonTitle={`Acciones para ${s.barrio}`}
                      items={[
                        {
                          label: "Editar Sucursal",
                          icon: <EditIcon />,
                          onClick: () => onEdit(s),
                        },
                        {
                          label: s.isActive
                            ? "Desactivar Sucursal"
                            : "Activar Sucursal",
                          icon: <PowerIcon />,
                          onClick: () => handleToggleEstado(s.id),
                          variant: s.isActive ? "warning" : "success",
                        },
                        {
                          label: "Eliminar Sucursal",
                          icon: <TrashIcon />,
                          onClick: () => setSucursalToDelete(s),
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
        isOpen={Boolean(sucursalToDelete)}
        onClose={() => setSucursalToDelete(null)}
        title="Confirmar baja de sucursal"
        description="Si la sucursal tiene usuarios asociados, se desactivará automáticamente para preservar los datos."
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSucursalToDelete(null)}
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
        {sucursalToDelete && (
          <div className="p-3 rounded-lg bg-surface-hover/70 border border-border text-sm space-y-1">
            <p className="font-semibold text-content">
              {sucursalToDelete.barrio} — {sucursalToDelete.direccion}
            </p>
            <p className="text-xs text-content-muted">
              Socios asignados: {sucursalToDelete.totalUsuarios}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
