"use client";

import React from "react";
import { StepGuide } from "./StepGuide";
import { TipCallout } from "./TipCallout";
import { ScreenshotCard } from "./ScreenshotCard";
import { Badge } from "@/components/ui/Badge";

export function ManualEntrenador() {
  return (
    <div className="space-y-12 text-content">
      {/* Encabezado del Manual de Entrenador */}
      <div className="border-b border-border pb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-600 dark:text-sky-400 border border-sky-500/20 mb-3">
          <span>📋</span> Guía del Staff Técnico / Entrenador
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content">
          Manual del Entrenador — Meraki Gym
        </h1>
        <p className="text-sm text-content-muted mt-2 max-w-3xl leading-relaxed">
          Guía operativa para profesores y preparadores físicos. Aprendé a administrar la base de ejercicios, estructurar rutinas complejas con superseries, gestionar plantillas y monitorear el progreso de tus alumnos.
        </p>
      </div>

      {/* SECCIÓN 1: CATÁLOGO DE EJERCICIOS */}
      <section id="ejercicios" className="scroll-mt-24 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-base">
            1
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-content">
              Catálogo y Biblioteca de Ejercicios
            </h2>
            <p className="text-xs text-content-muted">
              Mantené actualizada la base de ejercicios con grupos musculares y videos de técnica.
            </p>
          </div>
        </div>

        <p className="text-sm text-content-muted leading-relaxed">
          Desde <strong className="text-content">Ejercicios</strong> (`/admin/ejercicios`), podés consultar, buscar y crear los movimientos que formarán parte de las rutinas de los alumnos.
        </p>

        <StepGuide
          steps={[
            {
              number: 1,
              title: "Crear un Nuevo Ejercicio",
              description:
                "Tocá el botón '+ Nuevo Ejercicio' e ingresá el nombre descriptivo (ej: 'Sentadilla Búlgara con Mancuernas').",
            },
            {
              number: 2,
              title: "Clasificar por Grupo Muscular",
              description:
                "Asigná el músculo principal: Pecho, Espalda, Piernas, Hombros, Bíceps, Tríceps, Core / Abdominales o Glúteos. Esto permite filtrar rápidamente al armar rutinas.",
              badge: "Filtro Rápido",
            },
            {
              number: 3,
              title: "Adjuntar Multimedia y Video Explicativo",
              description:
                "Podés pegar el enlace a un video demostrativo de YouTube o Vimeo para que el socio aprenda la técnica correcta desde su celular.",
              example: "URL: https://www.youtube.com/watch?v=ejemplo",
            },
            {
              number: 4,
              title: "Describir Puntos Clave y Precauciones",
              description:
                "Agregá indicaciones posturales esenciales, como 'Mantener la espalda neutra' o 'No bloquear las rodillas en la extensión máxima'.",
            },
          ]}
        />
      </section>

      {/* SECCIÓN 2: ARMADO DE RUTINAS Y SUPERSERIES */}
      <section id="rutinas" className="scroll-mt-24 space-y-6 border-t border-border pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-base">
            2
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-content">
              Diseño de Rutinas Todo-en-Uno (Nueva Experiencia)
            </h2>
            <p className="text-xs text-content-muted">
              Armá entrenamientos multi-día en una página dedicada de pantalla completa, sin modales ni pasos intermedios.
            </p>
          </div>
        </div>

        <p className="text-sm text-content-muted leading-relaxed">
          En <strong className="text-content">Rutinas</strong> (`/admin/rutinas`) la experiencia fue totalmente simplificada: ya no existe la división confusa entre rutinas por día y plantillas. Ahora administrás directamente **Rutinas de Entrenamiento** completas.
        </p>

        <StepGuide
          steps={[
            {
              number: 1,
              title: "Nueva Rutina en Pantalla Completa",
              description:
                "Al hacer clic en '+ Nueva Rutina', se abre una página dedicada (/admin/rutinas/nueva) con todo el espacio visual necesario para diseñar el entrenamiento.",
              badge: "Sin Modales",
            },
            {
              number: 2,
              title: "Seleccionar el Plan y Frecuencia Semanal",
              description:
                "Asigná el nombre (ej: 'Fuerza e Hipertrofia') y elegí el Plan comercial (ej: 'Plan 3 Días por semana'). El editor genera automáticamente las pestañas correspondientes para cada día.",
            },
            {
              number: 3,
              title: "Cargar Ejercicios por Día sin Salir",
              description:
                "Navegá entre las pestañas de días (Día 1, Día 2, Día 3...). En cada día podés abrir el buscador en línea y sumar ejercicios del catálogo con 1 clic, o copiar una rutina existente para editarla.",
              badge: "Carga en Línea",
            },
            {
              number: 4,
              title: "Series, Repeticiones, Pausas y Superseries",
              description:
                "Por cada ejercicio configurás series, repeticiones (ej: '10-12' o 'Al Fallo'), descansos rápidos (60s, 90s, 120s) y peso de referencia. Para armar una superserie, simplemente asignales el mismo grupo (ej: Grupo 1).",
            },
            {
              number: 5,
              title: "Guardado Atómico y Duplicación en 1 Clic",
              description:
                "El botón 'Guardar Rutina' persiste todos los días y ejercicios en una única operación segura. Además, desde el listado podés clonar cualquier rutina completa con el botón 'Duplicar Rutina'.",
              badge: "Duplicación Rápida",
            },
          ]}
        />

        <ScreenshotCard
          title="Editor Todo-en-Uno de Rutina Multi-Día"
          caption="Nueva interfaz en pantalla completa con pestañas por día, configuración de superseries y carga de ejercicios en línea."
          hotspots={[
            {
              number: 1,
              label: "Datos y Plan",
              description: "Nombre de rutina y plan semanal que fija la cantidad de días.",
            },
            {
              number: 2,
              label: "Pestañas de Días",
              description: "Alternancia ágil entre Día 1, Día 2, Día 3 con contador de ejercicios.",
            },
            {
              number: 3,
              label: "Buscador de Ejercicios",
              description: "Filtro rápido por grupo muscular para agregar ejercicios al día activo.",
            },
            {
              number: 4,
              label: "Parámetros y Superseries",
              description: "Series, reps, descansos rápidos y agrupación de circuitos.",
            },
          ]}
        >
          {/* Mockup del nuevo editor todo-en-uno */}
          <div className="space-y-4">
            {/* Barra superior de pestañas de días */}
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs">
                  Día 1: Pecho & Bíceps (4 ej.)
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-surface border border-border text-content-muted font-medium text-xs">
                  Día 2: Piernas (5 ej.)
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-surface border border-border text-content-muted font-medium text-xs">
                  Día 3: Espalda & Hombros (4 ej.)
                </span>
              </div>
              <button
                type="button"
                className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-lg text-xs font-bold"
              >
                + Agregar Ejercicios
              </button>
            </div>

            {/* Ejercicio 1 con superserie */}
            <div className="border border-primary/30 rounded-xl p-3.5 bg-primary/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Superserie — Grupo 1
                  </span>
                  <span className="font-bold text-xs text-content">Press de Banca Plano con Barra</span>
                  <Badge variant="default" className="text-[10px]">Pecho</Badge>
                </div>
                <span className="text-[11px] text-content-muted">Orden: 1</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-surface p-1.5 rounded border border-border">
                  <span className="text-[10px] text-content-muted block">Series</span>
                  <strong className="text-content">4</strong>
                </div>
                <div className="bg-surface p-1.5 rounded border border-border">
                  <span className="text-[10px] text-content-muted block">Reps</span>
                  <strong className="text-content">8-10</strong>
                </div>
                <div className="bg-surface p-1.5 rounded border border-border">
                  <span className="text-[10px] text-content-muted block">Pausa</span>
                  <strong className="text-content">0s (Super)</strong>
                </div>
                <div className="bg-surface p-1.5 rounded border border-border">
                  <span className="text-[10px] text-content-muted block">Peso Ref.</span>
                  <strong className="text-content">60 kg</strong>
                </div>
              </div>
            </div>

            {/* Ejercicio 2 de superserie */}
            <div className="border border-primary/30 rounded-xl p-3.5 bg-primary/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Superserie — Grupo 1
                  </span>
                  <span className="font-bold text-xs text-content">Aperturas con Mancuernas en Banco</span>
                  <Badge variant="default" className="text-[10px]">Pecho</Badge>
                </div>
                <span className="text-[11px] text-content-muted">Orden: 2</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-surface p-1.5 rounded border border-border">
                  <span className="text-[10px] text-content-muted block">Series</span>
                  <strong className="text-content">4</strong>
                </div>
                <div className="bg-surface p-1.5 rounded border border-border">
                  <span className="text-[10px] text-content-muted block">Reps</span>
                  <strong className="text-content">12</strong>
                </div>
                <div className="bg-surface p-1.5 rounded border border-border">
                  <span className="text-[10px] text-content-muted block">Pausa</span>
                  <strong className="text-emerald-500 font-bold">90 seg</strong>
                </div>
                <div className="bg-surface p-1.5 rounded border border-border">
                  <span className="text-[10px] text-content-muted block">Peso Ref.</span>
                  <strong className="text-content">16 kg</strong>
                </div>
              </div>
            </div>
          </div>
        </ScreenshotCard>

        <TipCallout variant="success" title="Sobrecarga Progresiva">
          Al definir pesos de referencia, el socio ve una sugerencia inicial de carga, pero cuando él mismo modifique el peso en su celular durante el entrenamiento, su valor personal sobreescribirá el sugerido para sus próximas sesiones.
        </TipCallout>
      </section>

      {/* SECCIÓN 3: SEGUIMIENTO DE ALUMNOS */}
      <section id="alumnos" className="scroll-mt-24 space-y-6 border-t border-border pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-base">
            3
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-content">
              Padrón de Alumnos y Asignación de Días
            </h2>
            <p className="text-xs text-content-muted">
              Consultá la ficha médica de cada socio y asignale las rutinas correspondientes a su plan semanal.
            </p>
          </div>
        </div>

        <p className="text-sm text-content-muted leading-relaxed">
          En <strong className="text-content">Usuarios</strong> (`/admin/usuarios`), podés buscar a cualquier alumno por nombre, apellido, DNI o teléfono.
        </p>

        <StepGuide
          steps={[
            {
              number: 1,
              title: "Revisar la Ficha de Salud del Alumno",
              description:
                "Antes de asignarle ejercicios de alta intensidad o impacto, abrí el perfil del alumno y verificá si tiene lesiones declaradas, limitaciones o apto médico vigente.",
              badge: "Prevención",
            },
            {
              number: 2,
              title: "Asignar Rutinas a Cada Día",
              description:
                "Según los días por semana contratados por el alumno (ej: Plan de 3 Días), asignale la rutina correspondiente al Día 1, Día 2 y Día 3.",
            },
            {
              number: 3,
              title: "Monitorear Cargas y Asistencias",
              description:
                "Podés inspeccionar qué pesos está levantando tu alumno en cada ejercicio y su constancia mensual para ajustar el volumen de entrenamiento según sus metas.",
            },
          ]}
        />
      </section>
    </div>
  );
}
