"use server";

import { revalidatePath } from "next/cache";
import { prisma, type Prisma } from "@lib/prisma";
import { Role } from "@lib/generated/prisma/enums";
import { hashPassword } from "@/lib/password";

export interface GetUsuariosParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface UsuarioItem {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
  direccion: string | null;
  birthDate: Date | null;
  avatarUrl: string | null;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  planId: number | null;
  plan: {
    id: number;
    nombre: string;
    diasPorSemana: number;
  } | null;
  rutinasDias?: {
    id: number;
    diaNumero: number;
    nombreDia: string | null;
    rutina: {
      id: number;
      nombre: string;
    };
  }[];
}

export interface GetUsuariosResult {
  usuarios: UsuarioItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export async function getUsuarios({
  page = 1,
  pageSize = 10,
  search = "",
  role = "ALL",
  status = "ALL",
}: GetUsuariosParams = {}): Promise<GetUsuariosResult> {
  try {
    const currentPage = Math.max(1, page);
    const take = Math.max(1, Math.min(100, pageSize));
    const skip = (currentPage - 1) * take;

    const trimmedSearch = search.trim();

    // Filtros de búsqueda
    const where: Prisma.UsuarioWhereInput = {
      deletedAt: null, // Excluir soft-deleted
    };

    if (trimmedSearch) {
      where.OR = [
        { nombre: { contains: trimmedSearch } },
        { apellido: { contains: trimmedSearch } },
        { email: { contains: trimmedSearch } },
        { dni: { contains: trimmedSearch } },
        { telefono: { contains: trimmedSearch } },
      ];
    }

    if (role !== "ALL" && (role === "USER" || role === "ADMIN" || role === "SUPERADMIN")) {
      where.role = role as Role;
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const [totalItems, usuarios] = await Promise.all([
      prisma.usuario.count({ where }),
      prisma.usuario.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          plan: {
            select: {
              id: true,
              nombre: true,
              diasPorSemana: true,
            },
          },
          rutinasDias: {
            select: {
              id: true,
              diaNumero: true,
              nombreDia: true,
              rutina: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
            orderBy: { diaNumero: "asc" },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / take);

    return {
      usuarios,
      totalItems,
      totalPages,
      currentPage,
      pageSize: take,
    };
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return {
      usuarios: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize,
    };
  }
}

export async function getPlanesDisponibles() {
  try {
    return await prisma.plan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        nombre: true,
        diasPorSemana: true,
      },
      orderBy: { diasPorSemana: "asc" },
    });
  } catch (error) {
    console.error("Error al obtener planes:", error);
    return [];
  }
}

export interface UsuarioFormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
  direccion?: string;
  birthDate?: string; // YYYY-MM-DD
  role: Role;
  password?: string;
  planId?: number | null;
  isActive?: boolean;
}

export async function crearUsuario(data: UsuarioFormData) {
  try {
    const { nombre, apellido, email, telefono, dni, direccion, birthDate, role, password, planId, isActive } =
      data;

    if (!nombre || !apellido || !email || !telefono || !dni) {
      return { success: false, error: "Todos los campos obligatorios deben completarse" };
    }

    // Comprobar email duplicado
    const existenteEmail = await prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existenteEmail && !existenteEmail.deletedAt) {
      return { success: false, error: "Ya existe un usuario con este correo electrónico" };
    }

    // Comprobar DNI duplicado
    const existenteDni = await prisma.usuario.findUnique({
      where: { dni: dni.trim() },
    });
    if (existenteDni && !existenteDni.deletedAt) {
      return { success: false, error: "Ya existe un usuario con este DNI" };
    }

    // Si el usuario es ADMIN o SUPERADMIN, asignamos o generamos contraseña hasheada
    let passwordHash: string | null = null;
    if (role === Role.ADMIN || role === Role.SUPERADMIN) {
      passwordHash = hashPassword(password && password.trim() ? password.trim() : "admin123");
    }

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim(),
        dni: dni.trim(),
        direccion: direccion?.trim() || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        role: role || Role.USER,
        passwordHash,
        planId: planId ? Number(planId) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    revalidatePath("/admin/usuarios");
    return { success: true, usuario: nuevoUsuario };
  } catch (error: unknown) {
    console.error("Error al crear usuario:", error);
    const message = error instanceof Error ? error.message : "Error al registrar el usuario";
    return { success: false, error: message };
  }
}

export async function actualizarUsuario(id: number, data: UsuarioFormData) {
  try {
    const { nombre, apellido, email, telefono, dni, direccion, birthDate, role, password, planId, isActive } =
      data;

    // Verificar existencia
    const usuarioExistente = await prisma.usuario.findUnique({ where: { id } });
    if (!usuarioExistente) {
      return { success: false, error: "Usuario no encontrado" };
    }

    // Comprobar si el email pertenece a otro usuario
    const existenteEmail = await prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existenteEmail && existenteEmail.id !== id && !existenteEmail.deletedAt) {
      return { success: false, error: "El correo electrónico ya está siendo utilizado por otro usuario" };
    }

    // Comprobar si el DNI pertenece a otro usuario
    const existenteDni = await prisma.usuario.findUnique({
      where: { dni: dni.trim() },
    });
    if (existenteDni && existenteDni.id !== id && !existenteDni.deletedAt) {
      return { success: false, error: "El DNI ya está siendo utilizado por otro usuario" };
    }

    const updateData: Prisma.UsuarioUpdateInput = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono.trim(),
      dni: dni.trim(),
      direccion: direccion?.trim() || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      role: role || Role.USER,
      plan: planId ? { connect: { id: Number(planId) } } : { disconnect: true },
      isActive: isActive !== undefined ? isActive : usuarioExistente.isActive,
    };

    if (role === Role.ADMIN || role === Role.SUPERADMIN) {
      if (password && password.trim()) {
        updateData.passwordHash = hashPassword(password.trim());
      } else if (!usuarioExistente.passwordHash) {
        updateData.passwordHash = hashPassword("admin123");
      }
    } else {
      updateData.passwordHash = null;
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/usuarios");
    return { success: true, usuario: usuarioActualizado };
  } catch (error: unknown) {
    console.error("Error al actualizar usuario:", error);
    const message = error instanceof Error ? error.message : "Error al guardar los cambios";
    return { success: false, error: message };
  }
}

export async function toggleEstadoUsuario(id: number) {
  try {
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      return { success: false, error: "Usuario no encontrado" };
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: { isActive: !usuario.isActive },
    });

    revalidatePath("/admin/usuarios");
    return { success: true, isActive: usuarioActualizado.isActive };
  } catch (error: unknown) {
    console.error("Error al cambiar estado de usuario:", error);
    const message = error instanceof Error ? error.message : "Error al modificar estado";
    return { success: false, error: message };
  }
}

export async function eliminarUsuario(id: number) {
  try {
    // Soft delete: marcamos deletedAt y desactivamos
    await prisma.usuario.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al eliminar usuario:", error);
    const message = error instanceof Error ? error.message : "Error al eliminar el usuario";
    return { success: false, error: message };
  }
}

// -----------------------------------------------------------------------------
// ASIGNACIÓN DE RUTINAS Y PLANTILLAS MULTI-DÍA A USUARIOS
// -----------------------------------------------------------------------------

export type AsignacionRutinaData = NonNullable<Awaited<ReturnType<typeof getAsignacionRutinaUsuario>>>;

export async function getAsignacionRutinaUsuario(usuarioId: number) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        planId: true,
        plan: {
          select: {
            id: true,
            nombre: true,
            diasPorSemana: true,
          },
        },
        rutinasDias: {
          orderBy: { diaNumero: "asc" },
          include: {
            rutina: {
              include: {
                ejercicios: {
                  include: {
                    ejercicio: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!usuario) return null;

    // Obtener plantillas disponibles para el plan del usuario
    const templatesDisponibles = usuario.planId
      ? await prisma.planRutinaTemplate.findMany({
          where: {
            planId: usuario.planId,
            isActive: true,
            deletedAt: null,
          },
          include: {
            dias: {
              orderBy: { diaNumero: "asc" },
              include: {
                rutina: {
                  include: {
                    _count: {
                      select: { ejercicios: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

    // Obtener catálogo de rutinas activas para selección manual por día
    const rutinasCatalogo = await prisma.rutina.findMany({
      where: { isActive: true, deletedAt: null },
      select: {
        id: true,
        nombre: true,
        _count: {
          select: { ejercicios: true },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        plan: usuario.plan
          ? {
              id: usuario.plan.id,
              nombre: usuario.plan.nombre,
              diasPorSemana: usuario.plan.diasPorSemana,
            }
          : null,
      },
      rutinasDias: usuario.rutinasDias,
      templatesDisponibles: templatesDisponibles.map((t) => ({
        id: t.id,
        nombre: t.nombre,
        descripcion: t.descripcion,
        totalDias: t.dias.length,
        dias: t.dias.map((d) => ({
          diaNumero: d.diaNumero,
          nombreDia: d.nombreDia,
          rutinaId: d.rutinaId,
          rutinaNombre: d.rutina.nombre,
          totalEjercicios: d.rutina._count.ejercicios,
        })),
      })),
      rutinasDisponibles: rutinasCatalogo.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        totalEjercicios: r._count.ejercicios,
      })),
    };
  } catch (error) {
    console.error("Error al obtener asignación de rutina de usuario:", error);
    return null;
  }
}

export interface DiaPersonalizadoInput {
  diaNumero: number;
  nombreDia?: string;
  rutinaId: number;
}

export async function asignarRutinasPersonalizadasAUsuario({
  usuarioId,
  dias,
}: {
  usuarioId: number;
  dias: DiaPersonalizadoInput[];
}) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        planId: true,
        plan: {
          select: {
            diasPorSemana: true,
          },
        },
      },
    });

    if (!usuario) {
      return { success: false, error: "Usuario no encontrado" };
    }

    if (!usuario.plan) {
      return { success: false, error: "El usuario no tiene un plan de membresía asignado" };
    }

    // Filtrar días válidos con rutina seleccionada
    const diasValidos = dias.filter((d) => d.rutinaId && Number(d.rutinaId) > 0);
    if (diasValidos.length === 0) {
      return { success: false, error: "Debes seleccionar al menos una rutina para algún día" };
    }

    if (diasValidos.length > usuario.plan.diasPorSemana) {
      return {
        success: false,
        error: `El plan del socio permite como máximo ${usuario.plan.diasPorSemana} días por semana`,
      };
    }

    // Ejecutar en transacción
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar asignaciones previas de días del usuario
      await tx.usuarioRutinaDia.deleteMany({
        where: { usuarioId },
      });

      // 2. Crear las nuevas asignaciones personalizadas
      for (const d of diasValidos) {
        await tx.usuarioRutinaDia.create({
          data: {
            usuarioId,
            diaNumero: d.diaNumero,
            nombreDia: d.nombreDia?.trim() || `Día ${d.diaNumero}`,
            rutinaId: Number(d.rutinaId),
            isActive: true,
          },
        });
      }

      // 3. Inicializar UsuarioEjercicio para todos los ejercicios de las rutinas asignadas
      const rutinaIds = diasValidos.map((d) => Number(d.rutinaId));
      const ejerciciosRutinas = await tx.rutinaEjercicio.findMany({
        where: { rutinaId: { in: rutinaIds } },
        select: { ejercicioId: true },
      });

      const uniqueEjercicioIds = Array.from(new Set(ejerciciosRutinas.map((e) => e.ejercicioId)));

      for (const ejercicioId of uniqueEjercicioIds) {
        const existe = await tx.usuarioEjercicio.findUnique({
          where: {
            usuarioId_ejercicioId: {
              usuarioId,
              ejercicioId,
            },
          },
        });
        if (!existe) {
          await tx.usuarioEjercicio.create({
            data: {
              usuarioId,
              ejercicioId,
              pesoActual: 0,
            },
          });
        }
      }
    });

    revalidatePath("/admin/usuarios");
    revalidatePath("/mi-rutina");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al asignar rutinas personalizadas:", error);
    const message = error instanceof Error ? error.message : "Error al guardar la asignación personalizada";
    return { success: false, error: message };
  }
}


export async function asignarTemplateAUsuario({
  usuarioId,
  templateId,
}: {
  usuarioId: number;
  templateId: number;
}) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, planId: true },
    });
    if (!usuario) {
      return { success: false, error: "Usuario no encontrado" };
    }

    const template = await prisma.planRutinaTemplate.findUnique({
      where: { id: templateId },
      include: {
        dias: {
          include: {
            rutina: {
              include: {
                ejercicios: true,
              },
            },
          },
        },
      },
    });
    if (!template) {
      return { success: false, error: "Plantilla no encontrada" };
    }

    // Ejecutar en transacción
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar asignaciones previas de días del usuario
      await tx.usuarioRutinaDia.deleteMany({
        where: { usuarioId },
      });

      // 2. Crear las nuevas asignaciones según los días de la plantilla
      for (const d of template.dias) {
        await tx.usuarioRutinaDia.create({
          data: {
            usuarioId,
            diaNumero: d.diaNumero,
            nombreDia: d.nombreDia || `Día ${d.diaNumero}`,
            rutinaId: d.rutinaId,
            isActive: true,
          },
        });
      }

      // 3. Inicializar UsuarioEjercicio para todos los ejercicios de las rutinas si no existen
      const allEjercicios = template.dias.flatMap((d) => d.rutina.ejercicios);
      const uniqueEjercicioIds = Array.from(new Set(allEjercicios.map((e) => e.ejercicioId)));

      for (const ejercicioId of uniqueEjercicioIds) {
        const existe = await tx.usuarioEjercicio.findUnique({
          where: {
            usuarioId_ejercicioId: {
              usuarioId,
              ejercicioId,
            },
          },
        });
        if (!existe) {
          await tx.usuarioEjercicio.create({
            data: {
              usuarioId,
              ejercicioId,
              pesoActual: 0,
            },
          });
        }
      }
    });

    revalidatePath("/admin/usuarios");
    revalidatePath("/mi-rutina");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al asignar plantilla a usuario:", error);
    const message = error instanceof Error ? error.message : "Error al asignar la plantilla";
    return { success: false, error: message };
  }
}

export async function desasignarRutinaUsuario(usuarioId: number) {
  try {
    await prisma.usuarioRutinaDia.deleteMany({
      where: { usuarioId },
    });

    revalidatePath("/admin/usuarios");
    revalidatePath("/mi-rutina");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al desasignar rutinas de usuario:", error);
    const message = error instanceof Error ? error.message : "Error al desasignar las rutinas";
    return { success: false, error: message };
  }
}

