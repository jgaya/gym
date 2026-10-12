/**
 * Utilidades para exportación contable: Excel (.xlsx / .csv) y PDF (Imprimible / PDF vectorial).
 */

import { EconomiaDataResponse, UsuarioEconomiaItem } from "./types";

/**
 * Escapa un campo para formato CSV con soporte de comillas y caracteres especiales
 */
function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exporta el reporte contable a formato Excel (.csv compatible con Microsoft Excel, Google Sheets, LibreOffice con BOM UTF-8)
 */
export function exportarBalanceExcel(data: EconomiaDataResponse) {
  const { metricas, usuarios, metodosPagoDesglose } = data;

  const lines: string[] = [];

  // Encabezado del reporte
  lines.push(`"REPORTE ECONÓMICO Y BALANCE DE CAJA - GYM MERAKI"`);
  lines.push(`"Período:","${metricas.nombreMes} ${metricas.anio}"`);
  lines.push(`"Fecha de Emisión:","${new Date().toLocaleString("es-AR")}"`);
  lines.push("");

  // 1. Resumen de Métricas / Balance
  lines.push(`"--- RESUMEN EJECUTIVO DE CAJA ---"`);
  lines.push(`"Concepto","Valor"`);
  lines.push(`"Total Potencial Mensual",${metricas.recaudacionTotalPotencial}`);
  lines.push(`"Recaudación Cobrada Hasta Ahora",${metricas.recaudacionHastaAhora}`);
  lines.push(`"Saldo Pendiente de Cobro",${metricas.pendienteCobro}`);
  lines.push(`"Porcentaje de Cobranza Cumplido","${metricas.porcentajeCobrado}%"`);
  lines.push(`"Total Miembros Activos con Plan",${metricas.totalMiembrosConPlan}`);
  lines.push(`"Miembros con Cuota Pagada",${metricas.miembrosPagados}`);
  lines.push(`"Miembros con Cuota Pendiente",${metricas.miembrosPendientes}`);
  lines.push("");

  // 2. Desglose por método de pago
  if (metodosPagoDesglose && metodosPagoDesglose.length > 0) {
    lines.push(`"--- DESGLOSE POR MÉTODO DE PAGO ---"`);
    lines.push(`"Método","Monto Cobrado","Cantidad de Cobros","% del Total"`);
    metodosPagoDesglose.forEach((m) => {
      lines.push(
        `${escapeCsv(m.metodo)},${m.total},${m.cantidad},"${m.porcentaje}%"`
      );
    });
    lines.push("");
  }

  // 3. Detalle completo de miembros y estado de cuenta
  lines.push(`"--- LISTADO DE SOCIOS Y ESTADO DE CUOTA (${metricas.nombreMes} ${metricas.anio}) ---"`);
  lines.push(
    [
      `"ID"`,
      `"Apellido"`,
      `"Nombre"`,
      `"DNI"`,
      `"Email"`,
      `"Teléfono"`,
      `"Plan Asignado"`,
      `"Importe Cuota Plan"`,
      `"Estado Cuota"`,
      `"Monto Abonado"`,
      `"Fecha de Pago"`,
      `"Método de Pago"`,
      `"N° Comprobante"`,
      `"Notas / Observaciones"`,
    ].join(",")
  );

  usuarios.forEach((u) => {
    const estado = u.haPagado ? "AL DÍA (PAGADO)" : "PENDIENTE (MOROSO)";
    const importePlan = u.plan ? u.plan.precio : 0;
    const montoAbonado = u.pagoMesActual ? u.pagoMesActual.monto : 0;
    const fechaPago = u.pagoMesActual
      ? new Date(u.pagoMesActual.fechaPago).toLocaleDateString("es-AR")
      : "";
    const metodo = u.pagoMesActual?.metodoPago || "";
    const comprobante = u.pagoMesActual?.comprobante || "";
    const notas = u.pagoMesActual?.notas || "";

    lines.push(
      [
        u.id,
        escapeCsv(u.apellido),
        escapeCsv(u.nombre),
        escapeCsv(u.dni),
        escapeCsv(u.email),
        escapeCsv(u.telefono),
        escapeCsv(u.plan ? u.plan.nombre : "Sin Plan"),
        importePlan,
        escapeCsv(estado),
        montoAbonado,
        escapeCsv(fechaPago),
        escapeCsv(metodo),
        escapeCsv(comprobante),
        escapeCsv(notas),
      ].join(",")
    );
  });

  // Crear Blob con BOM (\uFEFF) para que Excel abra UTF-8 con tildes y caracteres correctamente
  const csvContent = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  const filename = `Balance_GymMeraki_${metricas.anio}_${String(metricas.mes).padStart(2, "0")}.csv`;
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta el reporte contable a PDF profesional mediante una ventana de impresión estilizada
 */
export function exportarBalancePDF(data: EconomiaDataResponse) {
  const { metricas, usuarios, metodosPagoDesglose } = data;

  const formatMoney = (val: number) => "$" + Number(val || 0).toLocaleString("es-AR");

  // Crear ventana emergente de impresión
  const printWindow = window.open("", "_blank", "width=900,height=750");
  if (!printWindow) {
    alert("Por favor habilita las ventanas emergentes en tu navegador para generar el PDF.");
    return;
  }

  const pagados = usuarios.filter((u) => u.haPagado);
  const pendientes = usuarios.filter((u) => !u.haPagado);

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Balance Económico - ${metricas.nombreMes} ${metricas.anio} - Gym Meraki</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 12mm 15mm 12mm;
    }
    * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      color: #1a1a1a;
      background: #ffffff;
      margin: 0;
      padding: 10px;
      font-size: 11px;
      line-height: 1.4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #22c55e;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand p {
      margin: 2px 0 0 0;
      font-size: 11px;
      color: #64748b;
    }
    .report-meta {
      text-align: right;
    }
    .report-meta .period {
      font-size: 15px;
      font-weight: 700;
      color: #22c55e;
      margin: 0;
    }
    .report-meta .date {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 2px;
    }

    /* KPI Summary Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      background: #f8fafc;
    }
    .kpi-title {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }
    .kpi-sub {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
    }

    /* Section Titles */
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      border-left: 3px solid #22c55e;
      padding-left: 6px;
      margin: 16px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 10px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border-bottom: 1px solid #cbd5e1;
      text-transform: uppercase;
      font-size: 8.5px;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 8.5px;
    }
    .badge-paid {
      background: #dcfce7;
      color: #166534;
    }
    .badge-pending {
      background: #fef3c7;
      color: #92400e;
    }

    /* Metodos breakdown */
    .methods-table {
      width: 60%;
      margin-bottom: 14px;
    }

    .footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 9px;
    }

    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #0f172a; color: white; padding: 12px; margin-bottom: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <strong>Vista previa de impresión contable</strong> — Hacé clic en "Guardar como PDF" o Imprimir en el cuadro de diálogo.
    </div>
    <div>
      <button onclick="window.print()" style="background: #22c55e; color: black; border: none; font-weight: bold; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; margin-right: 8px;">🖨️ Imprimir / Guardar PDF</button>
      <button onclick="window.close()" style="background: #334155; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px;">Cerrar</button>
    </div>
  </div>

  <div class="header">
    <div class="brand">
      <h1>GYM MERAKI</h1>
      <p>Reporte Contable Oficial — Estado de Caja y Rendición de Membresías</p>
    </div>
    <div class="report-meta">
      <div class="period">${metricas.nombreMes.toUpperCase()} ${metricas.anio}</div>
      <div class="date">Generado el: ${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</div>
    </div>
  </div>

  <!-- KPI SUMMARY -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Recaudado Hasta Ahora</div>
      <div class="kpi-value" style="color: #16a34a;">${formatMoney(metricas.recaudacionHastaAhora)}</div>
      <div class="kpi-sub">${metricas.porcentajeCobrado}% del potencial total</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Total Potencial Mensual</div>
      <div class="kpi-value">${formatMoney(metricas.recaudacionTotalPotencial)}</div>
      <div class="kpi-sub">Cuotas al 100% socios activos</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Pendiente de Cobro</div>
      <div class="kpi-value" style="color: #d97706;">${formatMoney(metricas.pendienteCobro)}</div>
      <div class="kpi-sub">${metricas.miembrosPendientes} socios morosos</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Cumplimiento de Cobro</div>
      <div class="kpi-value">${metricas.miembrosPagados} / ${metricas.totalMiembrosConPlan}</div>
      <div class="kpi-sub">${metricas.totalMiembrosConPlan > 0 ? Math.round((metricas.miembrosPagados / metricas.totalMiembrosConPlan) * 100) : 0}% socios al día</div>
    </div>
  </div>

  <!-- DESGLOSE MEDIOS DE PAGO -->
  ${
    metodosPagoDesglose.length > 0
      ? `
  <div class="section-title">Distribución por Medio de Cobro</div>
  <table class="methods-table">
    <thead>
      <tr>
        <th>Medio de Pago</th>
        <th class="text-right">Monto</th>
        <th class="text-center">Operaciones</th>
        <th class="text-right">Participación</th>
      </tr>
    </thead>
    <tbody>
      ${metodosPagoDesglose
        .map(
          (m) => `
        <tr>
          <td><strong>${m.metodo}</strong></td>
          <td class="text-right"><strong>${formatMoney(m.total)}</strong></td>
          <td class="text-center">${m.cantidad}</td>
          <td class="text-right">${m.porcentaje}%</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
  `
      : ""
  }

  <!-- TABLA DE COBROS Y MOROSIDAD -->
  <div class="section-title">Nómina de Socios y Estado de Cuenta (${usuarios.length} Registros)</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Socio / DNI</th>
        <th>Plan</th>
        <th class="text-right">Valor Cuota</th>
        <th class="text-center">Estado</th>
        <th class="text-right">Monto Cobrado</th>
        <th>Fecha & Medio</th>
        <th>N° Comprobante</th>
      </tr>
    </thead>
    <tbody>
      ${usuarios
        .map(
          (u, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>
            <strong>${u.apellido}, ${u.nombre}</strong><br>
            <span style="font-size: 8.5px; color: #64748b;">${u.dni ? "DNI: " + u.dni : u.email}</span>
          </td>
          <td>${u.plan ? u.plan.nombre : "Sin Plan"}</td>
          <td class="text-right">${u.plan ? formatMoney(u.plan.precio) : "-"}</td>
          <td class="text-center">
            <span class="badge ${u.haPagado ? "badge-paid" : "badge-pending"}">
              ${u.haPagado ? "PAGADO" : "PENDIENTE"}
            </span>
          </td>
          <td class="text-right"><strong>${u.pagoMesActual ? formatMoney(u.pagoMesActual.monto) : "$0"}</strong></td>
          <td>
            ${
              u.pagoMesActual
                ? `${new Date(u.pagoMesActual.fechaPago).toLocaleDateString("es-AR")}<br><span style="font-size: 8.5px; color: #64748b;">${u.pagoMesActual.metodoPago || "Efectivo"}</span>`
                : "-"
            }
          </td>
          <td style="font-size: 8.5px; font-family: monospace;">${u.pagoMesActual?.comprobante || "-"}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <div>Gym Meraki Management System &copy; ${new Date().getFullYear()}</div>
    <div>Documento para control contable y administrativo interno</div>
  </div>

  <script>
    // Lanzar diálogo de impresión automáticamente tras cargar
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
