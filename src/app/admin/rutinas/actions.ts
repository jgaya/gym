"use server";

import { revalidatePath } from "next/cache";
import { prisma, type Prisma } from "@lib/prisma";

export interface GetRutinasParams {
  page?: number;
  pageSize?: number;
  search?: string;
  templateFilter?: string; // "ALL" | "TEMPLATES" | "NORMAL"
  status?: string; // "ALL" | "active" | "inactive"
}

export interface RutinaEjercicioConfig {
  ejercicioId: number;
  nombre?: string;
  grupoMuscular?: string | null;
  grupoNumero?: number | null;
  orden: number;
  series: number;
  repeticiones: string;
  descansoSegundos?: number | null;
  pesoSugerido?: number | null;
  notas?: string | null;
}

export interface RutinaItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  esTemplate: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalEjercicios: number;
  totalUsuarios: number;
  ejercicios: {
    id: number;
    ejercicioId: number;
    grupoNumero: number | null;
    orden: number;
    series: number;
    repeticiones: string;
    descansoSegundos: number | null;
    pesoSugerido: number | null;
    notas: string | null;
    ejercicio: {
      id: number;
      nombre: string;
      grupoMuscular: string | null;
    };
  }[];
}

export interface GetRutinasResult {
  rutinas: RutinaItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export async function getRutinas({
  page = 1,
  pageSize = 10,
  search = "",
  templateFilter = "ALL",
  status = "ALL",
}: GetRutinasParams = {}): Promise<GetRutinasResult> {
  try {
    const currentPage = Math.max(1, page);
    const take = Math.max(1, Math.min(100, pageSize));
    const skip = (currentPage - 1) * take;

    const trimmedSearch = search.trim();

    const where: Prisma.RutinaWhereInput = {
      deletedAt: null,
    };

    if (trimmedSearch) {
      where.OR = [
        { nombre: { contains: trimmedSearch } },
        { descripcion: { contains: trimmedSearch } },
      ];
    }

    if (templateFilter === "TEMPLATES") {
      where.esTemplate = true;
    } else if (templateFilter === "NORMAL") {
      where.esTemplate = false;
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const [totalItems, rutinasRaw] = await Promise.all([
      prisma.rutina.count({ where }),
      prisma.rutina.findMany({
        where,
        take,
        skip,
        orderBy: [{ esTemplate: "desc" }, { nombre: "asc" }],
        include: {
          _count: {
            select: {
              usuariosDias: true,
            },
          },
          ejercicios: {
            orderBy: { orden: "asc" },
            include: {
              ejercicio: {
                select: {
                  id: true,
                  nombre: true,
                  grupoMuscular: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / take);

    const rutinas: RutinaItem[] = rutinasRaw.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      esTemplate: r.esTemplate,
      isActive: r.isActive,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      totalEjercicios: r.ejercicios.length,
      totalUsuarios: r._count.usuariosDias,
      ejercicios: r.ejercicios.map((re) => ({
        id: re.id,
        ejercicioId: re.ejercicioId,
        grupoNumero: re.grupoNumero,
        orden: re.orden,
        series: re.series,
        repeticiones: re.repeticiones,
        descansoSegundos: re.descansoSegundos,
        pesoSugerido: re.pesoSugerido,
        notas: re.notas,
        ejercicio: {
          id: re.ejercicio.id,
          nombre: re.ejercicio.nombre,
          grupoMuscular: re.ejercicio.grupoMuscular,
        },
      })),
    }));

    return {
      rutinas,
      totalItems,
      totalPages,
      currentPage,
      pageSize: take,
    };
  } catch (error) {
    console.error("Error al obtener rutinas:", error);
    return {
      rutinas: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize,
    };
  }
}

export async function getEjerciciosParaSelector() {
  try {
    return await prisma.ejercicio.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        nombre: true,
        grupoMuscular: true,
      },
      orderBy: [{ grupoMuscular: "asc" }, { nombre: "asc" }],
    });
  } catch (error) {
    console.error("Error al obtener ejercicios para selector:", error);
    return [];
  }
}

export interface RutinaFormData {
  nombre: string;
  descripcion?: string;
  esTemplate?: boolean;
  isActive?: boolean;
  ejercicios: RutinaEjercicioConfig[];
}

export async function crearRutina(data: RutinaFormData) {
  try {
    const { nombre, descripcion, esTemplate, isActive, ejercicios } = data;

    if (!nombre || !nombre.trim()) {
      return { success: false, error: "El nombre de la rutina es obligatorio" };
    }

    if (!ejercicios || ejercicios.length === 0) {
      return { success: false, error: "Debes seleccionar al menos un ejercicio para la rutina" };
    }

    const nuevaRutina = await prisma.rutina.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        esTemplate: esTemplate ?? false,
        isActive: isActive !== undefined ? isActive : true,
        ejercicios: {
          create: ejercicios.map((ej, index) => ({
            ejercicioId: ej.ejercicioId,
            grupoNumero: ej.grupoNumero ? Number(ej.grupoNumero) : null,
            orden: index + 1,
            series: Number(ej.series) || 4,
            repeticiones: ej.repeticiones ? String(ej.repeticiones) : "10-12",
            descansoSegundos: ej.descansoSegundos ? Number(ej.descansoSegundos) : 60,
            pesoSugerido: ej.pesoSugerido ? Number(ej.pesoSugerido) : null,
            notas: ej.notas?.trim() || null,
          })),
        },
      },
      include: {
        ejercicios: true,
      },
    });

    revalidatePath("/admin/rutinas");
    return { success: true, rutina: nuevaRutina };
  } catch (error: unknown) {
    console.error("Error al crear rutina:", error);
    const message = error instanceof Error ? error.message : "Error al crear la rutina";
    return { success: false, error: message };
  }
}

export async function actualizarRutina(id: number, data: RutinaFormData) {
  try {
    const { nombre, descripcion, esTemplate, isActive, ejercicios } = data;

    const rutinaExistente = await prisma.rutina.findUnique({ where: { id } });
    if (!rutinaExistente) {
      return { success: false, error: "Rutina no encontrada" };
    }

    if (!nombre || !nombre.trim()) {
      return { success: false, error: "El nombre de la rutina es obligatorio" };
    }

    if (!ejercicios || ejercicios.length === 0) {
      return { success: false, error: "Debes seleccionar al menos un ejercicio para la rutina" };
    }

    // Sincronizar ejercicios: eliminamos los existentes y creamos los nuevos
    await prisma.$transaction([
      prisma.rutinaEjercicio.deleteMany({
        where: { rutinaId: id },
      }),
      prisma.rutina.update({
        where: { id },
        data: {
          nombre: nombre.trim(),
          descripcion: descripcion?.trim() || null,
          esTemplate: esTemplate !== undefined ? esTemplate : rutinaExistente.esTemplate,
          isActive: isActive !== undefined ? isActive : rutinaExistente.isActive,
          ejercicios: {
            create: ejercicios.map((ej, index) => ({
              ejercicioId: ej.ejercicioId,
              grupoNumero: ej.grupoNumero ? Number(ej.grupoNumero) : null,
              orden: index + 1,
              series: Number(ej.series) || 4,
              repeticiones: ej.repeticiones ? String(ej.repeticiones) : "10-12",
              descansoSegundos: ej.descansoSegundos ? Number(ej.descansoSegundos) : 60,
              pesoSugerido: ej.pesoSugerido ? Number(ej.pesoSugerido) : null,
              notas: ej.notas?.trim() || null,
            })),
          },
        },
      }),
    ]);

    revalidatePath("/admin/rutinas");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al actualizar rutina:", error);
    const message = error instanceof Error ? error.message : "Error al actualizar la rutina";
    return { success: false, error: message };
  }
}

export async function toggleEstadoRutina(id: number) {
  try {
    const rutina = await prisma.rutina.findUnique({ where: { id } });
    if (!rutina) {
      return { success: false, error: "Rutina no encontrada" };
    }

    const rutinaActualizada = await prisma.rutina.update({
      where: { id },
      data: { isActive: !rutina.isActive },
    });

    revalidatePath("/admin/rutinas");
    return { success: true, isActive: rutinaActualizada.isActive };
  } catch (error: unknown) {
    console.error("Error al alternar estado de rutina:", error);
    const message = error instanceof Error ? error.message : "Error al modificar estado";
    return { success: false, error: message };
  }
}

export async function eliminarRutina(id: number) {
  try {
    // Soft-delete
    await prisma.rutina.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    revalidatePath("/admin/rutinas");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al eliminar rutina:", error);
    const message = error instanceof Error ? error.message : "Error al eliminar la rutina";
    return { success: false, error: message };
  }
}

// -----------------------------------------------------------------------------
// PLANTILLAS DE RUTINA PARA PLANES (Multi-día: 1 a N días del plan)
// -----------------------------------------------------------------------------

export interface PlanRutinaTemplateItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  planId: number;
  plan: {
    id: number;
    nombre: string;
    diasPorSemana: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalDias: number;
  dias: {
    id: number;
    diaNumero: number;
    nombreDia: string | null;
    rutinaId: number;
    rutina: {
      id: number;
      nombre: string;
      totalEjercicios: number;
      ejercicios: {
        id: number;
        ejercicio: {
          id: number;
          nombre: string;
          grupoMuscular: string | null;
        };
      }[];
    };
  }[];
}

export interface PlanRutinaTemplateFormData {
  nombre: string;
  descripcion?: string;
  planId: number;
  isActive?: boolean;
  dias: {
    diaNumero: number;
    nombreDia?: string;
    rutinaId: number;
  }[];
}

export async function getPlanRutinaTemplates({
  planId,
  search = "",
}: {
  planId?: number;
  search?: string;
} = {}): Promise<PlanRutinaTemplateItem[]> {
  try {
    const trimmedSearch = search.trim();
    const where: Prisma.PlanRutinaTemplateWhereInput = {
      deletedAt: null,
    };

    if (planId && !isNaN(planId)) {
      where.planId = planId;
    }

    if (trimmedSearch) {
      where.OR = [
        { nombre: { contains: trimmedSearch } },
        { descripcion: { contains: trimmedSearch } },
      ];
    }

    const templatesRaw = await prisma.planRutinaTemplate.findMany({
      where,
      orderBy: [{ plan: { diasPorSemana: "asc" } }, { createdAt: "desc" }],
      include: {
        plan: {
          select: {
            id: true,
            nombre: true,
            diasPorSemana: true,
          },
        },
        dias: {
          orderBy: { diaNumero: "asc" },
          include: {
            rutina: {
              include: {
                ejercicios: {
                  include: {
                    ejercicio: {
                      select: {
                        id: true,
                        nombre: true,
                        grupoMuscular: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return templatesRaw.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      descripcion: t.descripcion,
      planId: t.planId,
      plan: t.plan,
      isActive: t.isActive,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      totalDias: t.dias.length,
      dias: t.dias.map((d) => ({
        id: d.id,
        diaNumero: d.diaNumero,
        nombreDia: d.nombreDia,
        rutinaId: d.rutinaId,
        rutina: {
          id: d.rutina.id,
          nombre: d.rutina.nombre,
          totalEjercicios: d.rutina.ejercicios.length,
          ejercicios: d.rutina.ejercicios.map((re) => ({
            id: re.id,
            ejercicio: re.ejercicio,
          })),
        },
      })),
    }));
  } catch (error) {
    console.error("Error al obtener plantillas de planes:", error);
    return [];
  }
}

export async function getPlanesSelector() {
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
    console.error("Error al obtener selector de planes:", error);
    return [];
  }
}

export async function getRutinasSelector() {
  try {
    const rutinas = await prisma.rutina.findMany({
      where: { isActive: true, deletedAt: null },
      select: {
        id: true,
        nombre: true,
        esTemplate: true,
        _count: {
          select: { ejercicios: true },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return rutinas.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      esTemplate: r.esTemplate,
      totalEjercicios: r._count.ejercicios,
    }));
  } catch (error) {
    console.error("Error al obtener selector de rutinas:", error);
    return [];
  }
}

export async function getEjerciciosDeRutina(rutinaId: number): Promise<RutinaEjercicioConfig[]> {
  try {
    const rutina = await prisma.rutina.findUnique({
      where: { id: rutinaId },
      include: {
        ejercicios: {
          orderBy: { orden: "asc" },
          include: {
            ejercicio: {
              select: {
                id: true,
                nombre: true,
                grupoMuscular: true,
              },
            },
          },
        },
      },
    });

    if (!rutina) return [];

    return rutina.ejercicios.map((re) => ({
      ejercicioId: re.ejercicioId,
      nombre: re.ejercicio.nombre,
      grupoMuscular: re.ejercicio.grupoMuscular,
      grupoNumero: re.grupoNumero,
      orden: re.orden,
      series: re.series,
      repeticiones: re.repeticiones,
      descansoSegundos: re.descansoSegundos,
      pesoSugerido: re.pesoSugerido,
      notas: re.notas,
    }));
  } catch (error) {
    console.error("Error al obtener ejercicios de rutina:", error);
    return [];
  }
}

export async function crearPlanRutinaTemplate(data: PlanRutinaTemplateFormData) {
  try {
    const { nombre, descripcion, planId, dias, isActive } = data;

    if (!nombre || !nombre.trim()) {
      return { success: false, error: "El nombre de la plantilla es obligatorio" };
    }
    if (!planId) {
      return { success: false, error: "Debes seleccionar un plan" };
    }
    if (!dias || dias.length === 0) {
      return { success: false, error: "Debes configurar al menos 1 día de la plantilla" };
    }

    const template = await prisma.planRutinaTemplate.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        planId: Number(planId),
        isActive: isActive !== undefined ? isActive : true,
        dias: {
          create: dias.map((d) => ({
            diaNumero: d.diaNumero,
            nombreDia: d.nombreDia?.trim() || `Día ${d.diaNumero}`,
            rutinaId: Number(d.rutinaId),
          })),
        },
      },
    });

    revalidatePath("/admin/rutinas");
    revalidatePath("/admin/usuarios");
    return { success: true, template };
  } catch (error: unknown) {
    console.error("Error al crear plantilla de plan:", error);
    const message = error instanceof Error ? error.message : "Error al crear la plantilla";
    return { success: false, error: message };
  }
}

export async function actualizarPlanRutinaTemplate(
  id: number,
  data: PlanRutinaTemplateFormData
) {
  try {
    const { nombre, descripcion, planId, dias, isActive } = data;

    if (!nombre || !nombre.trim()) {
      return { success: false, error: "El nombre de la plantilla es obligatorio" };
    }
    if (!planId) {
      return { success: false, error: "Debes seleccionar un plan" };
    }
    if (!dias || dias.length === 0) {
      return { success: false, error: "Debes configurar al menos 1 día de la plantilla" };
    }

    await prisma.$transaction([
      prisma.planRutinaTemplateDia.deleteMany({
        where: { templateId: id },
      }),
      prisma.planRutinaTemplate.update({
        where: { id },
        data: {
          nombre: nombre.trim(),
          descripcion: descripcion?.trim() || null,
          planId: Number(planId),
          isActive: isActive !== undefined ? isActive : true,
          dias: {
            create: dias.map((d) => ({
              diaNumero: d.diaNumero,
              nombreDia: d.nombreDia?.trim() || `Día ${d.diaNumero}`,
              rutinaId: Number(d.rutinaId),
            })),
          },
        },
      }),
    ]);

    revalidatePath("/admin/rutinas");
    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al actualizar plantilla de plan:", error);
    const message = error instanceof Error ? error.message : "Error al actualizar la plantilla";
    return { success: false, error: message };
  }
}

export async function toggleEstadoPlanRutinaTemplate(id: number) {
  try {
    const template = await prisma.planRutinaTemplate.findUnique({ where: { id } });
    if (!template) {
      return { success: false, error: "Plantilla no encontrada" };
    }

    const actualizado = await prisma.planRutinaTemplate.update({
      where: { id },
      data: { isActive: !template.isActive },
    });

    revalidatePath("/admin/rutinas");
    revalidatePath("/admin/usuarios");
    return { success: true, isActive: actualizado.isActive };
  } catch (error: unknown) {
    console.error("Error al cambiar estado de plantilla:", error);
    const message = error instanceof Error ? error.message : "Error al modificar estado";
    return { success: false, error: message };
  }
}

export async function eliminarPlanRutinaTemplate(id: number) {
  try {
    await prisma.planRutinaTemplate.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    revalidatePath("/admin/rutinas");
    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al eliminar plantilla de plan:", error);
    const message = error instanceof Error ? error.message : "Error al eliminar la plantilla";
    return { success: false, error: message };
  }
}

// -----------------------------------------------------------------------------
// NUEVAS ACCIONES: GESTIÓN SIMPLIFICADA TODO-EN-UNO DE RUTINAS
// -----------------------------------------------------------------------------

export interface RutinaDiaConfig {
  diaNumero: number;
  nombreDia: string;
  rutinaIdExistente?: number | null;
  ejercicios: RutinaEjercicioConfig[];
}

export interface RutinaCompletaFormData {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  planId: number;
  isActive?: boolean;
  dias: RutinaDiaConfig[];
}

export interface RutinaCompletaEditable {
  id: number;
  nombre: string;
  descripcion: string | null;
  planId: number;
  isActive: boolean;
  dias: {
    diaNumero: number;
    nombreDia: string;
    rutinaId: number;
    rutinaNombre: string;
    ejercicios: RutinaEjercicioConfig[];
  }[];
}

export async function getRutinaCompletaParaEditar(
  id: number
): Promise<RutinaCompletaEditable | null> {
  try {
    const template = await prisma.planRutinaTemplate.findFirst({
      where: { id, deletedAt: null },
      include: {
        plan: {
          select: {
            id: true,
            nombre: true,
            diasPorSemana: true,
          },
        },
        dias: {
          orderBy: { diaNumero: "asc" },
          include: {
            rutina: {
              include: {
                ejercicios: {
                  orderBy: { orden: "asc" },
                  include: {
                    ejercicio: {
                      select: {
                        id: true,
                        nombre: true,
                        grupoMuscular: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!template) return null;

    return {
      id: template.id,
      nombre: template.nombre,
      descripcion: template.descripcion,
      planId: template.planId,
      isActive: template.isActive,
      dias: template.dias.map((d) => ({
        diaNumero: d.diaNumero,
        nombreDia: d.nombreDia || `Día ${d.diaNumero}`,
        rutinaId: d.rutinaId,
        rutinaNombre: d.rutina.nombre,
        ejercicios: d.rutina.ejercicios.map((re) => ({
          ejercicioId: re.ejercicioId,
          nombre: re.ejercicio.nombre,
          grupoMuscular: re.ejercicio.grupoMuscular,
          grupoNumero: re.grupoNumero,
          orden: re.orden,
          series: re.series,
          repeticiones: re.repeticiones,
          descansoSegundos: re.descansoSegundos,
          pesoSugerido: re.pesoSugerido,
          notas: re.notas,
        })),
      })),
    };
  } catch (error) {
    console.error("Error al obtener rutina para editar:", error);
    return null;
  }
}

export async function guardarRutinaCompleta(data: RutinaCompletaFormData) {
  try {
    const { id, nombre, descripcion, planId, isActive = true, dias } = data;

    if (!nombre || !nombre.trim()) {
      return { success: false, error: "El nombre de la rutina es obligatorio" };
    }

    if (!planId) {
      return { success: false, error: "Debes seleccionar un plan asociado" };
    }

    if (!dias || dias.length === 0) {
      return { success: false, error: "Debes configurar al menos 1 día en la rutina" };
    }

    // Validar que cada día tenga al menos un ejercicio o una rutina existente
    for (const d of dias) {
      const tieneEjercicios = d.ejercicios && d.ejercicios.length > 0;
      const tieneRutinaExistente = Boolean(d.rutinaIdExistente);
      if (!tieneEjercicios && !tieneRutinaExistente) {
        return {
          success: false,
          error: `El ${d.nombreDia || `Día ${d.diaNumero}`} no tiene ningún ejercicio cargado.`,
        };
      }
    }

    const templateResult = await prisma.$transaction(async (tx) => {
      let templateId = id;

      if (templateId) {
        // En edición, limpiar los días anteriores
        await tx.planRutinaTemplateDia.deleteMany({
          where: { templateId },
        });

        await tx.planRutinaTemplate.update({
          where: { id: templateId },
          data: {
            nombre: nombre.trim(),
            descripcion: descripcion?.trim() || null,
            planId: Number(planId),
            isActive,
          },
        });
      } else {
        // En creación, crear la plantilla principal
        const nuevo = await tx.planRutinaTemplate.create({
          data: {
            nombre: nombre.trim(),
            descripcion: descripcion?.trim() || null,
            planId: Number(planId),
            isActive,
          },
        });
        templateId = nuevo.id;
      }

      // Procesar cada día
      for (const d of dias) {
        let rutinaId = d.rutinaIdExistente;

        // Si el usuario configuró ejercicios personalizados en este día (o modificó los existentes):
        if (d.ejercicios && d.ejercicios.length > 0) {
          const nombreDiaLimpio = d.nombreDia?.trim() || `Día ${d.diaNumero}`;
          const rutinaDia = await tx.rutina.create({
            data: {
              nombre: `${nombre.trim()} — ${nombreDiaLimpio}`,
              descripcion: `Rutina diaria para ${nombreDiaLimpio} de ${nombre.trim()}`,
              esTemplate: true,
              isActive: true,
              ejercicios: {
                create: d.ejercicios.map((ej, index) => ({
                  ejercicioId: Number(ej.ejercicioId),
                  grupoNumero: ej.grupoNumero ? Number(ej.grupoNumero) : null,
                  orden: index + 1,
                  series: Number(ej.series) || 4,
                  repeticiones: String(ej.repeticiones || "10-12").trim(),
                  descansoSegundos: ej.descansoSegundos ? Number(ej.descansoSegundos) : 60,
                  pesoSugerido: ej.pesoSugerido ? Number(ej.pesoSugerido) : null,
                  notas: ej.notas?.trim() || null,
                })),
              },
            },
          });
          rutinaId = rutinaDia.id;
        }

        // Crear la relación del día
        await tx.planRutinaTemplateDia.create({
          data: {
            templateId: Number(templateId),
            diaNumero: d.diaNumero,
            nombreDia: d.nombreDia?.trim() || `Día ${d.diaNumero}`,
            rutinaId: Number(rutinaId),
          },
        });
      }

      return templateId;
    });

    revalidatePath("/admin/rutinas");
    revalidatePath("/admin/usuarios");
    return { success: true, id: templateResult };
  } catch (error: unknown) {
    console.error("Error al guardar rutina completa:", error);
    const message = error instanceof Error ? error.message : "Error al guardar la rutina";
    return { success: false, error: message };
  }
}

export async function duplicarRutinaCompleta(id: number) {
  try {
    const original = await prisma.planRutinaTemplate.findFirst({
      where: { id, deletedAt: null },
      include: {
        dias: {
          orderBy: { diaNumero: "asc" },
          include: {
            rutina: {
              include: {
                ejercicios: {
                  orderBy: { orden: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!original) {
      return { success: false, error: "Rutina no encontrada" };
    }

    const nueva = await prisma.$transaction(async (tx) => {
      const template = await tx.planRutinaTemplate.create({
        data: {
          nombre: `Copia de ${original.nombre}`,
          descripcion: original.descripcion,
          planId: original.planId,
          isActive: true,
        },
      });

      for (const d of original.dias) {
        const rutinaDiaClon = await tx.rutina.create({
          data: {
            nombre: `Copia de ${d.rutina.nombre}`,
            descripcion: d.rutina.descripcion,
            esTemplate: true,
            isActive: true,
            ejercicios: {
              create: d.rutina.ejercicios.map((e, idx) => ({
                ejercicioId: e.ejercicioId,
                grupoNumero: e.grupoNumero,
                orden: idx + 1,
                series: e.series,
                repeticiones: e.repeticiones,
                descansoSegundos: e.descansoSegundos,
                pesoSugerido: e.pesoSugerido,
                notas: e.notas,
              })),
            },
          },
        });

        await tx.planRutinaTemplateDia.create({
          data: {
            templateId: template.id,
            diaNumero: d.diaNumero,
            nombreDia: d.nombreDia,
            rutinaId: rutinaDiaClon.id,
          },
        });
      }

      return template;
    });

    revalidatePath("/admin/rutinas");
    revalidatePath("/admin/usuarios");
    return { success: true, newId: nueva.id };
  } catch (error: unknown) {
    console.error("Error al duplicar rutina completa:", error);
    const message = error instanceof Error ? error.message : "Error al duplicar la rutina";
    return { success: false, error: message };
  }
}

