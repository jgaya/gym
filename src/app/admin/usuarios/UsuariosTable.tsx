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
  DumbbellIcon,
  getWhatsAppUrl,
} from "@/components/ui/ActionsMenu";
import { Role } from "@lib/generated/prisma/enums";
import { UsuarioItem, eliminarUsuario, toggleEstadoUsuario } from "./actions";
import { AsignarRutinaModal } from "./AsignarRutinaModal";

interface UsuariosTableProps {
  usuarios: UsuarioItem[];
  isLoading?: boolean;
  onEdit: (usuario: UsuarioItem) => void;
  onRefresh: () => void;
}

export function UsuariosTable({
  usuarios,
  isLoading = false,
  onEdit,
  onRefresh,
}: UsuariosTableProps) {
  const [usuarioToDelete, setUsuarioToDelete] = useState<UsuarioItem | null>(null);
  const [userForRutina, setUserForRutina] = useState<UsuarioItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const handleToggleEstado = async (id: number) => {
    setActionLoadingId(id);
    try {
      const res = await toggleEstadoUsuario(id);
      if (res.success) {
        onRefresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!usuarioToDelete) return;
    setIsDeleting(true);
    try {
      const res = await eliminarUsuario(usuarioToDelete.id);
      if (res.success) {
        setUsuarioToDelete(null);
        onRefresh();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.SUPERADMIN:
        return <Badge variant="primary">Super Admin</Badge>;
      case Role.ADMIN:
        return <Badge variant="warning">Admin</Badge>;
      default:
        return <Badge variant="default">Miembro</Badge>;
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Miembro</TableHead>
            <TableHead>DNI</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-content-muted">
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Cargando miembros...
                </div>
              </td>
            </tr>
          ) : usuarios.length === 0 ? (
            <TableEmpty
              colSpan={7}
              message="No se encontraron usuarios coincidentes"
            />
          ) : (
            usuarios.map((user) => (
              <TableRow key={user.id}>
                {/* Miembro */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-xs text-primary">
                      {user.nombre.charAt(0)}
                      {user.apellido.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-content">
                        {user.nombre} {user.apellido}
                      </span>
                      <span className="text-xs text-content-muted">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* DNI */}
                <TableCell className="font-mono text-xs text-content font-medium">
                  {user.dni}
                </TableCell>

                {/* Contacto */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {user.telefono && (
                      <a
                        href={getWhatsAppUrl(
                          user.telefono,
                          `Hola ${user.nombre}, te contactamos desde Gym Meraki.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Enviar mensaje por WhatsApp a ${user.nombre}`}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:text-white transition-all transform hover:scale-110 cursor-pointer shadow-2xs"
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </TableCell>

                {/* Plan y Rutina */}
                <TableCell>
                  {user.plan ? (
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-content">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {user.plan.nombre} ({user.plan.diasPorSemana}d)
                      </span>
                      {user.rutinasDias && user.rutinasDias.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Rutina: {user.rutinasDias.length}/{user.plan.diasPorSemana} días
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          Sin rutina asignada
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-content-muted italic">
                      Sin plan
                    </span>
                  )}
                </TableCell>

                {/* Rol */}
                <TableCell>{getRoleBadge(user.role)}</TableCell>

                {/* Estado */}
                <TableCell>
                  <button
                    type="button"
                    onClick={() => handleToggleEstado(user.id)}
                    disabled={actionLoadingId === user.id}
                    title="Click para alternar estado"
                    className="cursor-pointer focus:outline-none"
                  >
                    {user.isActive ? (
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
                      buttonTitle={`Acciones para ${user.nombre}`}
                      items={[
                        {
                          label: "Gestionar / Asignar Rutina",
                          icon: <DumbbellIcon />,
                          onClick: () => setUserForRutina(user),
                        },
                        {
                          label: "Editar Datos",
                          icon: <EditIcon />,
                          onClick: () => onEdit(user),
                        },
                        user.telefono
                          ? {
                            label: "Enviar WhatsApp",
                            icon: <WhatsAppIcon />,
                            href: getWhatsAppUrl(
                              user.telefono,
                              `Hola ${user.nombre}, te contactamos desde Gym Meraki.`
                            ),
                            target: "_blank",
                            variant: "success",
                          }
                          : null,
                        {
                          label: user.isActive ? "Desactivar Miembro" : "Activar Miembro",
                          icon: <PowerIcon />,
                          onClick: () => handleToggleEstado(user.id),
                          variant: user.isActive ? "warning" : "success",
                        },
                        {
                          label: "Dar de Baja",
                          icon: <TrashIcon />,
                          onClick: () => setUsuarioToDelete(user),
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

      {/* Modal de gestión y asignación de rutinas multi-día */}
      <AsignarRutinaModal
        isOpen={Boolean(userForRutina)}
        onClose={() => setUserForRutina(null)}
        usuario={userForRutina}
        onSuccess={onRefresh}
      />

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={Boolean(usuarioToDelete)}
        onClose={() => setUsuarioToDelete(null)}
        title="Confirmar baja de miembro"
        description="¿Estás seguro de que deseas dar de baja este usuario? Sus rutinas y datos se preservarán en el sistema."
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUsuarioToDelete(null)}
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
        {usuarioToDelete && (
          <div className="p-3 rounded-lg bg-surface-hover/70 border border-border text-sm">
            <p className="font-semibold text-content">
              {usuarioToDelete.nombre} {usuarioToDelete.apellido}
            </p>
            <p className="text-xs text-content-muted mt-0.5">
              DNI: {usuarioToDelete.dni} • Email: {usuarioToDelete.email}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
