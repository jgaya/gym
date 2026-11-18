"use client";

import React from "react";
import { StepGuide } from "./StepGuide";
import { TipCallout } from "./TipCallout";
import { ScreenshotCard } from "./ScreenshotCard";

export function ManualSocio() {
  return (
    <div className="space-y-12 text-content">
      {/* Encabezado del Manual de Socio */}
      <div className="border-b border-border pb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3">
          <span>🏋️‍♂️</span> Guía del Atleta / Socio
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content">
          Manual del Socio — Meraki Gym
        </h1>
        <p className="text-sm text-content-muted mt-2 max-w-3xl leading-relaxed">
          Bienvenido a la plataforma de Meraki Centro de Entrenamiento. Esta guía interactiva te enseñará a aprovechar al máximo tu rutina diaria, registrar tus pesos en sala, controlar tus medidas y mantener tu perfil de salud siempre al día.
        </p>
      </div>

      {/* SECCIÓN 1: MI PERFIL Y FICHA DE SALUD */}
      <section id="perfil" className="scroll-mt-24 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-base">
            1
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-content">
              Mi Perfil, Ficha Médica y Objetivos
            </h2>
            <p className="text-xs text-content-muted">
              Mantené tu información de salud, contactos de urgencia y preferencias visuales actualizadas.
            </p>
          </div>
        </div>

        <p className="text-sm text-content-muted leading-relaxed">
          En la sección <strong className="text-content">Mi Perfil</strong> (accesible tocando tu nombre en el encabezado o en el menú móvil), podés configurar los datos más importantes para tu seguridad en el gimnasio.
        </p>

        <StepGuide
          steps={[
            {
              number: 1,
              title: "Cargar tu Ficha de Salud",
              description:
                "Indicá si tenés alguna lesión previa, si tomás medicación actual o si tenés restricciones médicas. Si tu médico te autorizó formalmente a entrenar, marcá la casilla de autorización.",
              example:
                "¿Posee alguna lesión? 'Sí, molestia en manguito rotador derecho'. ¿Autorizado por médico? 'Sí'.",
              badge: "Seguridad Médica",
            },
            {
              number: 2,
              title: "Registrar Datos de Emergencia",
              description:
                "Ingresá un contacto de confianza, su parentesco y su teléfono directo para que el staff de Meraki pueda comunicarse inmediatamente ante cualquier imprevisto.",
              example: "Contacto: María Gómez | Parentesco: Madre | Tel: 11 5555-8888",
            },
            {
              number: 3,
              title: "Definir tus Objetivos de Entrenamiento",
              description:
                "Podés marcar uno o varios objetivos: Bajar de peso, Aumentar masa muscular, Rendimiento deportivo, Salud o especificar otro.",
            },
            {
              number: 4,
              title: "Foto con Detector Facial Inteligente",
              description:
                "Subí una foto tuya: el sistema centrará tu rostro automáticamente usando inteligencia artificial en tu navegador para que tu carnet digital quede perfecto.",
              badge: "IA en Navegador",
            },
          ]}
        />

        <ScreenshotCard
          title="Ficha Integral de Salud y Perfil del Socio"
          caption="Vista de edición de Mi Perfil con la ficha médica, datos de emergencia y recorte de foto."
          hotspots={[
            {
              number: 1,
              label: "Foto de Perfil",
              description: "Centrado de rostro automático con detector facial.",
            },
            {
              number: 2,
              label: "Ficha de Salud",
              description: "Lesiones, medicación y apto médico declarado.",
            },
            {
              number: 3,
              label: "Contacto de Urgencia",
              description: "Teléfono y vínculo de tu contacto de emergencia.",
            },
            {
              number: 4,
              label: "Objetivos",
              description: "Metas de entrenamiento multiseleccionables.",
            },
          ]}
        >
          {/* Mockup visual de la interfaz de Perfil */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center p-4 border border-dashed border-border rounded-xl bg-surface-hover/30">
              <div className="relative h-24 w-24 rounded-full border-2 border-primary/50 bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                <span>JG</span>
                <span className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 text-[10px]">
                  📷
                </span>
              </div>
              <span className="text-xs font-bold text-content mt-2">Juan Pérez</span>
              <span className="text-[11px] text-content-muted">DNI: 38.123.456</span>
              <span className="mt-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                Detector Facial Activo
              </span>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="border border-border rounded-lg p-3 bg-surface">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-content text-xs">Información Médica</span>
                  <span className="text-emerald-500 font-bold text-[11px]">✓ Apto Médico Vigente</span>
                </div>
                <div className="text-[11px] text-content-muted space-y-0.5">
                  <p>• Lesión: Sin lesiones agudas declaradas</p>
                  <p>• Medicación: Ninguna</p>
                  <p>• Observaciones: Operación de meniscos año 2022 (rehabilitado)</p>
                </div>
              </div>

              <div className="border border-border rounded-lg p-3 bg-surface">
                <span className="font-bold text-content text-xs block mb-1">Contacto de Emergencia</span>
                <p className="text-[11px] text-content-muted">
                  Laura Pérez (Hermana) — Teléfono: <strong className="text-content">11 3456-7890</strong>
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] bg-primary/15 text-primary px-2.5 py-0.5 rounded-full font-semibold">
                  Aumentar masa muscular ✓
                </span>
                <span className="text-[10px] bg-primary/15 text-primary px-2.5 py-0.5 rounded-full font-semibold">
                  Mejorar condición física ✓
                </span>
                <span className="text-[10px] bg-primary/15 text-primary px-2.5 py-0.5 rounded-full font-semibold">
                  Salud y bienestar ✓
                </span>
              </div>
            </div>
          </div>
        </ScreenshotCard>

        <TipCallout variant="info" title="Privacidad Garantizada">
          Tus datos médicos y de emergencia son confidenciales y están protegidos. Solo tienen acceso vos y los administradores habilitados del gimnasio en caso de asistencia inmediata.
        </TipCallout>
      </section>

      {/* SECCIÓN 2: MI RUTINA Y ENTRENAMIENTO EN SALA */}
      <section id="rutina" className="scroll-mt-24 space-y-6 border-t border-border pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-base">
            2
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-content">
              Mi Rutina: Entrenamiento Diario en Sala
            </h2>
            <p className="text-xs text-content-muted">
              Cómo registrar tus pesos, completar series y utilizar el temporizador de descansos.
            </p>
          </div>
        </div>

        <p className="text-sm text-content-muted leading-relaxed">
          En la pestaña <strong className="text-content">Mi Rutina</strong> (`/mi-rutina`) vas a encontrar la planificación asignada para cada día de tu semana (Día 1, Día 2, etc.).
        </p>

        <StepGuide
          steps={[
            {
              number: 1,
              title: "Seleccionar el Día de Entrenamiento",
              description:
                "Elegí el día que vas a realizar hoy (por ejemplo: 'Día 1 - Pecho y Bíceps'). El sistema guardará el día activo automáticamente.",
            },
            {
              number: 2,
              title: "Registrar tus Pesos en kg",
              description:
                "En cada ejercicio tenés un campo interactivo para ingresar el peso utilizado. Al cambiarlo, se actualiza tu récord de trabajo actual y queda guardado para la próxima sesión.",
              example: "Press de Banca Plano: Modificá de 50 kg a 52.5 kg.",
              badge: "Sobrecarga Progresiva",
            },
            {
              number: 3,
              title: "Marcar Ejercicios Realizados",
              description:
                "A medida que termines cada ejercicio, tildá la casilla de verificación. Al completar todos los ejercicios, tu sesión se registrará como completada y sumará a tus asistencias.",
            },
            {
              number: 4,
              title: "Temporizador de Pausas Flotante",
              description:
                "Entre serie y serie, tocá el botón de descanso para iniciar el cronómetro de 60s, 90s o 120s. Recibirás un aviso visual y sonoro cuando finalice el tiempo para retomar la serie.",
              badge: "Timer Inteligente",
            },
            {
              number: 5,
              title: "Ver tu Evolución de Fuerza",
              description:
                "Tocando el ícono de gráfico junto al ejercicio podés ver el historial de cómo fue aumentando el peso que levantás a lo largo de las semanas.",
            },
          ]}
        />

        <ScreenshotCard
          title="Pantalla de Entrenamiento — Mi Rutina"
          caption="Tarjeta de ejercicio con control interactivo de peso en kg, series y temporizador."
          hotspots={[
            {
              number: 1,
              label: "Selector de Día",
              description: "Alterná entre los días de tu plan semanal.",
            },
            {
              number: 2,
              label: "Peso en kg",
              description: "Ajustá la carga levantada en tiempo real.",
            },
            {
              number: 3,
              label: "Check de Completado",
              description: "Marcá el ejercicio al finalizar tus series.",
            },
            {
              number: 4,
              label: "Historial de Cargas",
              description: "Consultá tu evolución gráfica de fuerza.",
            },
          ]}
        >
          {/* Mockup visual de Mi Rutina */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                  Día 1: Pecho & Bíceps
                </span>
                <span className="px-3 py-1 rounded-lg bg-surface border border-border text-content-muted font-medium text-xs">
                  Día 2: Piernas
                </span>
                <span className="px-3 py-1 rounded-lg bg-surface border border-border text-content-muted font-medium text-xs">
                  Día 3: Espalda & Hombros
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-500">2 de 6 completados (33%)</span>
            </div>

            {/* Ejercicio Mock */}
            <div className="border border-border rounded-xl p-3.5 bg-surface space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded text-primary focus:ring-primary accent-primary"
                    readOnly
                  />
                  <div>
                    <h4 className="font-bold text-content text-sm">Press de Banca con Barra</h4>
                    <span className="text-[10px] text-content-muted">Pecho • 4 series de 8 a 10 repeticiones</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-md">
                    Completado ✓
                  </span>
                  <span className="text-xs text-primary cursor-pointer hover:underline">📈 Historial</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-surface-hover/50 rounded-lg p-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-content-muted font-medium">Carga actual:</span>
                  <span className="font-mono font-bold text-primary text-sm bg-surface px-2 py-0.5 rounded border border-border">
                    65.0 kg
                  </span>
                  <span className="text-[10px] text-content-muted">(+2.5 kg vs sesión anterior)</span>
                </div>
                <button
                  type="button"
                  className="bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1 rounded-md font-semibold text-xs"
                >
                  ⏱ Iniciar Pausa (90s)
                </button>
              </div>
            </div>
          </div>
        </ScreenshotCard>

        <TipCallout variant="tip" title="Agrupación en Superseries">
          Cuando dos o más ejercicios comparten el distintivo <strong className="text-primary">Grupo 1</strong> o similar, significa que se realizan juntos como superserie (un ejercicio seguido de otro sin pausa). El descanso se toma recién al finalizar la ronda completa.
        </TipCallout>
      </section>

      {/* SECCIÓN 3: CALENDARIO Y ASISTENCIAS */}
      <section id="calendario" className="scroll-mt-24 space-y-6 border-t border-border pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-base">
            3
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-content">
              Calendario y Registro de Asistencias
            </h2>
            <p className="text-xs text-content-muted">
              Llevá la cuenta de cuántos días entrenaste en el mes y tu cumplimiento de objetivos.
            </p>
          </div>
        </div>

        <p className="text-sm text-content-muted leading-relaxed">
          En la sección <strong className="text-content">Calendario</strong> (`/calendario`) podés visualizar el mapa de días entrenados durante el mes actual. Cada día que completás tu rutina en la app se marca automáticamente con un indicador verde.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <span className="text-2xl font-black text-primary">14</span>
            <p className="text-xs text-content-muted mt-1">Días entrenados este mes</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <span className="text-2xl font-black text-emerald-500">93%</span>
            <p className="text-xs text-content-muted mt-1">Cumplimiento del plan</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <span className="text-2xl font-black text-sky-500">3 Días</span>
            <p className="text-xs text-content-muted mt-1">Racha consecutiva actual</p>
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: MIS MEDIDAS CORPORALES */}
      <section id="medidas" className="scroll-mt-24 space-y-6 border-t border-border pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-base">
            4
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-content">
              Mis Medidas Corporales y Gráficos de Evolución
            </h2>
            <p className="text-xs text-content-muted">
              Monitoreá tus cambios físicos a lo largo del tiempo con métricas estándar y personalizadas.
            </p>
          </div>
        </div>

        <p className="text-sm text-content-muted leading-relaxed">
          En <strong className="text-content">Mis Medidas</strong> (`/mis-medidas`) podés cargar periódicamente tu peso y perímetros corporales para ver tus avances en gráficos interactivos.
        </p>

        <StepGuide
          steps={[
            {
              number: 1,
              title: "Cargar una Medición Estándar",
              description:
                "Seleccioná la métrica (Peso Corporal en kg, Cintura en cm, Bíceps, etc.), escribí el valor actual y guardá la fecha.",
              example: "Peso: 78.4 kg — Fecha: Hoy.",
            },
            {
              number: 2,
              title: "Crear una Métrica Personalizada",
              description:
                "¿Querés medir algo específico como gemelos, glúteos o porcentaje graso? Tocá 'Nueva Medida Personalizada', elegí el nombre, unidad (cm, kg, %) y su color en el gráfico.",
              badge: "100% Personalizable",
            },
            {
              number: 3,
              title: "Analizar el Gráfico Temporal",
              description:
                "El gráfico traza la línea de tiempo mostrando tus picos y descensos, permitiéndote comprobar visualmente si estás ganando masa muscular o reduciendo cintura.",
            },
          ]}
        />
      </section>

      {/* SECCIÓN 5: ACCESIBILIDAD Y PERSONALIZACIÓN */}
      <section id="visuales" className="scroll-mt-24 space-y-6 border-t border-border pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-base">
            5
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-content">
              Ajuste Visual: Modo Oscuro y Tamaño de Fuente
            </h2>
            <p className="text-xs text-content-muted">
              Configurá la aplicación para leer cómodamente en cualquier condición de iluminación.
            </p>
          </div>
        </div>

        <p className="text-sm text-content-muted leading-relaxed">
          Tanto en el encabezado superior como al final de tu perfil podés adaptar la apariencia de la plataforma:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-content">
              <span>☀️ / 🌙</span>
              <span>Modo Claro y Oscuro</span>
            </div>
            <p className="text-xs text-content-muted leading-relaxed">
              Tocá el ícono de Sol o Luna en el header para alternar entre el modo día y el modo noche de alto contraste para entrenar sin encandilarte.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-content">
              <span>🔤</span>
              <span>Tamaño de Fuente (90% al 150%)</span>
            </div>
            <p className="text-xs text-content-muted leading-relaxed">
              Tocá el ícono tipográfico en el header o usá el slider en `/perfil` para ajustar el tamaño del texto en toda la app sin alterar el diseño.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
