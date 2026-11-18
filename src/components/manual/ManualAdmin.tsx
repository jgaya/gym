"use client";

import React from "react";
import { StepGuide } from "./StepGuide";
import { TipCallout } from "./TipCallout";
import { ScreenshotCard } from "./ScreenshotCard";

export function ManualAdmin() {
  return (
    <div className="space-y-12 text-content">
      {/* Encabezado del Manual de Administrador */}
      <div className="border-b border-border pb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20 mb-3">
          <span>💼</span> Guía de Administración & Finanzas
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content">
          Manual del Administrador — Meraki Gym
        </h1>
        <p className="text-sm text-content-muted mt-2 max-w-3xl leading-relaxed">
          Guía integral para administradores y dueños del gimnasio. Conocé en profundidad el manejo multi-sucursal, control de cuotas, venta rápida en kiosco, carga de gastos operativos y cálculo en tiempo real del margen neto del negocio.
        </p>
      </div>

      {/* SECCIÓN 1: SUCURSALES Y CONFIGURACIÓN */}
      <section id="sucursales" className="scroll-mt-24 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-xs">
            1
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-content">
              Gestión de Sucursales (Multi-Sede)
            </h2>
            <p className="text-xs text-content-muted">
              Administrá tus complejos, horarios, redes sociales y habilitación de módulos por sede.
            </p>
          </div>
        </div>

        <p className="text-sm text-content-muted leading-relaxed">
          En <strong className="text-content">Sucursales</strong> (`/admin/sucursales`), podés gestionar las sedes físicas del centro de entrenamiento.
        </p>

        <StepGuide
          steps={[
            {
              number: 1,
              title: "Crear o Editar una Sede",
              description:
                "Completá la dirección exacta, barrio, teléfono de contacto y horarios de atención en texto libre (ej: 'Lunes a Viernes de 7:00 a 22:00').",
            },
            {
              number: 2,
              title: "Redes Sociales y Fotografía",
              description:
                "Ingresá los enlaces a los perfiles oficiales de Instagram y TikTok de la sede y una imagen de portada representativa.",
            },
            {
              number: 3,
              title: "Habilitar o Inhabilitar Kiosco ('tieneKiosco')",
              description:
                "Si la sucursal no cuenta con mostrador o stock físico de venta de suplementos, podés apagar el interruptor de Kiosco para que no aparezca en esa sede.",
              badge: "Control por Sede",
            },
            {
              number: 4,
              title: "Asignación de Socios a Sede Única",
              description:
                "Cada socio pertenece a una sola sucursal. Los ingresos por cuotas y las ventas de mostrador impactan automáticamente en la sede asignada.",
            },
          ]}
        />
      </section>

      {/* SECCIÓN 2: PLANES Y RUTINAS MULTI-DÍA */}
      <section id="planes" className="scroll-mt-24 space-y-6 border-t border-border pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-xs">
            2
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-content">
              Planes Comerciales y Diseño de Rutinas
            </h2>
            <p className="text-xs text-content-muted">
              Definí aranceles por frecuencia semanal y administrá rutinas multi-día en el nuevo editor en pantalla completa.
            </p>
          </div>
        </div>

        <p className="text-sm text-content-muted leading-relaxed">
          En <strong className="text-content">Planes</strong> (`/admin/plan`) administrás la oferta comercial, y en <strong className="text-content">Rutinas</strong> (`/admin/rutinas`) diseñás los entrenamientos multi-día en una interfaz unificada sin modales.
        </p>

        <StepGuide
          steps={[
            {
              number: 1,
              title: "Configurar Días por Semana y Precio del Plan",
              description:
                "Creá planes por días semanales permitidos (de 1 a 7 días, por ejemplo: 'Plan 3 Días Semanales' a $25.000).",
              example: "Nombre: Musculación 4 Días | Días: 4 | Arancel: $28.000",
            },
            {
              number: 2,
              title: "Diseñar la Rutina en Pantalla Completa (/admin/rutinas/nueva)",
              description:
                "Al crear una rutina, seleccionás el plan (ej: 3 días) y el editor te permite cargar en la misma pantalla todos los ejercicios de cada día (Día 1, Día 2, etc.), con series, repeticiones, descansos y superseries.",
              badge: "Sin Modales",
            },
            {
              number: 3,
              title: "Duplicación Rápida y Asignación Directa",
              description:
                "Desde la tabla de rutinas podés clonar una rutina completa con todos sus días con el botón 'Duplicar Rutina'. Al inscribir un socio en /admin/usuarios, le asignás esta rutina en 1 clic.",
              badge: "1 Clic",
            },
          ]}
        />
      </section>

      {/* SECCIÓN 3: CONTROL DE COBRANZAS Y CUOTAS */}
      <section id="cobranzas" className="scroll-mt-24 space-y-6 border-t border-border pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-xs">
            3
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-content">
              Control de Pagos de Socios y Cobranzas
            </h2>
            <p className="text-xs text-content-muted">
              Llevá el seguimiento de cuotas mensuales con menú de acciones rápidas y adjuntos de comprobantes.
            </p>
          </div>
        </div>

        <p className="text-sm text-content-muted leading-relaxed">
          En <strong className="text-content">Economía</strong> (`/admin/economia`), la tabla de socios te permite identificar al instante quién tiene la cuota al día, pendiente o vencida.
        </p>

        <StepGuide
          steps={[
            {
              number: 1,
              title: "Filtrar por Sucursal o Vista Global",
              description:
                "Seleccioná en la parte superior si deseás ver los socios de una sucursal física o la sumatoria total del gimnasio.",
            },
            {
              number: 2,
              title: "Menú de Acciones (...) por Fila",
              description:
                "Cada socio cuenta con un botón '...' que abre un menú flotante para registrar su pago, editar el monto abonado, ver notas o consultar su perfil sin recargar la pantalla.",
              badge: "Menú Rápido",
            },
            {
              number: 3,
              title: "Registrar Cobro y Comprobante",
              description:
                "Al marcar una cuota como cobrada, seleccioná el método de pago (Efectivo, Transferencia, Mercado Pago, Débito) e ingresá el número de comprobante o notas si correspondiera.",
              example: "Método: Transferencia | Monto: $25.000 | Comprobante: OP-849201",
            },
          ]}
        />

        <ScreenshotCard
          title="Tabla de Control de Pagos de Socios"
          caption="Grilla con estados de membresía, fecha de cobro y menú de acciones compacto '...'."
          hotspots={[
            {
              number: 1,
              label: "Filtro de Estado",
              description: "Filtrá rápidamente por Al Día, Pendientes o Vencidos.",
            },
            {
              number: 2,
              label: "Monto y Método",
              description: "Visualización clara del importe y canal de cobro.",
            },
            {
              number: 3,
              label: "Menú Contextual (...)",
              description: "Acceso ágil a Registrar Pago, Comprobante y Ficha.",
            },
          ]}
        >
          {/* Mockup de tabla de pagos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-border rounded-lg overflow-hidden">
              <thead className="bg-surface-hover/80 text-content-muted uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="p-2.5">Socio</th>
                  <th className="p-2.5">Plan</th>
                  <th className="p-2.5">Estado</th>
                  <th className="p-2.5">Importe</th>
                  <th className="p-2.5">Fecha Pago</th>
                  <th className="p-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                <tr>
                  <td className="p-2.5 font-bold text-content">Martín Gómez (36.441.229)</td>
                  <td className="p-2.5 text-content-muted">Plan 4 Días</td>
                  <td className="p-2.5">
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-full">
                      Al Día ✓
                    </span>
                  </td>
                  <td className="p-2.5 font-mono font-semibold text-content">$28.000</td>
                  <td className="p-2.5 text-content-muted">04/11/2026 (Transf.)</td>
                  <td className="p-2.5 text-right">
                    <button
                      type="button"
                      className="px-2 py-1 rounded bg-surface-hover text-content font-bold hover:bg-border"
                    >
                      •••
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-content">Camila Fernández (40.912.831)</td>
                  <td className="p-2.5 text-content-muted">Plan 3 Días</td>
                  <td className="p-2.5">
                    <span className="text-[10px] bg-amber-500/10 text-amber-500 font-bold px-2 py-0.5 rounded-full">
                      Pendiente
                    </span>
                  </td>
                  <td className="p-2.5 font-mono font-semibold text-content">$25.000</td>
                  <td className="p-2.5 text-content-muted">—</td>
                  <td className="p-2.5 text-right">
                    <button
                      type="button"
                      className="px-2 py-1 rounded bg-surface-hover text-content font-bold hover:bg-border"
                    >
                      •••
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </ScreenshotCard>
      </section>

      {/* SECCIÓN 4: KIOSCO Y PUNTO DE VENTA EN MOSTRADOR */}
      <section id="kiosco" className="scroll-mt-24 space-y-6 border-t border-border pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-xs">
            4
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-content">
              Kiosco y Punto de Venta en Mostrador
            </h2>
            <p className="text-xs text-content-muted">
              Control de inventario, precios de compra vs venta y registro de ventas rápidas con deducción de stock.
            </p>
          </div>
        </div>

        <p className="text-sm text-content-muted leading-relaxed">
          En <strong className="text-content">Kiosco</strong> (`/admin/kiosco`), administrás los artículos que se venden en recepción (bebidas, barritas proteicas, suplementos, indumentaria).
        </p>

        <StepGuide
          steps={[
            {
              number: 1,
              title: "Dar de Alta un Producto con Doble Precio",
              description:
                "Ingresá el nombre, categoría, 'Precio de Compra' (costo para el gimnasio) y 'Precio de Venta' (al público). Esto permite calcular el margen de ganancia exacto por unidad vendida.",
              example: "Gatorade 500ml — Costo: $1.200 | Venta: $2.200 | Ganancia: $1.000",
              badge: "Cálculo de Margen",
            },
            {
              number: 2,
              title: "Control de Stock y Alertas de Reposición",
              description:
                "Definí el stock inicial y un umbral de 'Stock Mínimo'. Cuando las existencias bajen de ese valor, la fila se resaltará en amarillo para avisarte que es momento de reponer.",
            },
            {
              number: 3,
              title: "Registrar Venta de Mostrador",
              description:
                "Tocá 'Registrar Venta', seleccioná el producto y la cantidad. Podés imputar la venta a un socio registrado o dejarlo como 'Venta al paso / Mostrador anónimo'. El stock se descuenta en el instante.",
            },
            {
              number: 4,
              title: "Integración Directa en la Economía",
              description:
                "Las ventas brutas y las ganancias netas del kiosco se suman automáticamente a los ingresos de la sucursal en el panel de finanzas.",
            },
          ]}
        />
      </section>

      {/* SECCIÓN 5: GASTOS OPERATIVOS Y MARGEN NETO REAL */}
      <section id="economia" className="scroll-mt-24 space-y-6 border-t border-border pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-xs">
            5
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-content">
              Gestión de Gastos Operativos y Margen Neto Real
            </h2>
            <p className="text-xs text-content-muted">
              Cálculo contable en tiempo real del beneficio neto real del gimnasio (Ingresos vs Egresos) y exportación a Excel y PDF.
            </p>
          </div>
        </div>

        <p className="text-sm text-content-muted leading-relaxed">
          En la pestaña superior de <strong className="text-content">Economía</strong> (`/admin/economia`), el módulo calcula el estado de resultados del negocio en tiempo real.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              1. Ingresos Totales
            </span>
            <div className="text-lg font-black text-content">Cuotas + Ventas Kiosco</div>
            <p className="text-xs text-content-muted">Todo el dinero recaudado en el mes.</p>
          </div>

          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-1">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
              2. Costos y Gastos
            </span>
            <div className="text-lg font-black text-content">Costo Mercadería + Gastos</div>
            <p className="text-xs text-content-muted">Alquiler, sueldos, servicios, reposiciones.</p>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 space-y-1">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              3. Margen Neto Real
            </span>
            <div className="text-lg font-black text-primary">Ingresos − Egresos</div>
            <p className="text-xs text-content-muted">La ganancia neta de bolsillo del gimnasio.</p>
          </div>
        </div>

        <StepGuide
          steps={[
            {
              number: 1,
              title: "Cargar un Gasto Operativo",
              description:
                "Hacé clic en '+ Nuevo Gasto', escribí el concepto (ej: 'Alquiler local Noviembre'), el monto, seleccioná la categoría (Alquiler, Profesores, Luz y Servicios, Reposición de Máquinas, Limpieza, etc.) y marcá si es un gasto fijo mensual recurrente.",
              example: "Concepto: Honorarios Entrenadores | Monto: $850.000 | Categoría: Profesores",
            },
            {
              number: 2,
              title: "Alternar entre Vista por Sucursal y Global",
              description:
                "El selector superior te permite evaluar la rentabilidad individual de una sucursal o el consolidado de toda la cadena Meraki.",
              badge: "Filtro de Sede",
            },
            {
              number: 3,
              title: "Exportar Reportes a Excel (.xlsx) y PDF",
              description:
                "Tocá los botones de exportación en la esquina superior del panel para descargar el balance mensual auditado listo para contabilidad o socios.",
              badge: "Reportes Descargables",
            },
          ]}
        />

        <TipCallout variant="warning" title="Seguridad en Borrado de Transacciones">
          Cada modificación contable (cobro de cuotas, baja de stock o carga de gastos) se ejecuta en transacciones atómicas seguras (`enTransaccion`), garantizando que la caja nunca quede con valores inconsistentes.
        </TipCallout>
      </section>
    </div>
  );
}
