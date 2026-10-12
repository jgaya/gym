import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Pantalla interactiva que simula el Checkout de Mercado Pago
 * Permite al administrador o al socio ver el link generado y presionar "Pagar ahora",
 * lo cual envía la notificación al webhook y actualiza el estado a "Pagado" inmediatamente.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prefId = searchParams.get("prefId") || "PREF-DEMO";
  const ref = searchParams.get("ref") || "";
  const monto = searchParams.get("monto") || "0";
  const titulo = searchParams.get("titulo") || "Cuota Gimnasio";
  const tipo = searchParams.get("tipo") || "cuota_mes";
  const mes = searchParams.get("mes") || "10";
  const anio = searchParams.get("anio") || "2026";
  const usuarioId = searchParams.get("usuarioId") || "0";

  const isSuscripcion = tipo === "suscripcion_mensual";

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mercado Pago — Checkout Seguro</title>
  <style>
    * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      margin: 0;
      background: #ebebeb;
      color: #333333;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
    }
    .header {
      width: 100%;
      max-width: 440px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      padding: 0 4px;
    }
    .mp-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 900;
      font-size: 19px;
      color: #009ee3;
      text-decoration: none;
    }
    .mp-badge {
      font-size: 10px;
      background: #009ee3;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .card {
      background: #ffffff;
      width: 100%;
      max-width: 440px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .card-banner {
      background: ${isSuscripcion ? "#7c3aed" : "#009ee3"};
      color: white;
      padding: 18px 20px;
    }
    .card-banner h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
    }
    .card-banner p {
      margin: 4px 0 0 0;
      font-size: 12px;
      opacity: 0.9;
    }
    .card-body {
      padding: 20px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
      font-size: 13px;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #666;
    }
    .detail-val {
      font-weight: 700;
      color: #111;
    }
    .amount-box {
      background: #f8fafc;
      border-radius: 8px;
      padding: 14px;
      margin: 16px 0;
      text-align: center;
      border: 1px dashed #cbd5e1;
    }
    .amount-box .label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .amount-box .price {
      font-size: 28px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 4px;
    }
    .badge-sub {
      display: inline-block;
      background: #ede9fe;
      color: #6d28d9;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 700;
      margin-top: 4px;
    }
    .methods {
      margin-top: 14px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      text-align: center;
      font-size: 11px;
      color: #555;
    }
    .method-pill {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 4px;
      background: #fafafa;
    }
    .btn-pay {
      width: 100%;
      background: #009ee3;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 14px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      margin-top: 20px;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-pay:hover {
      background: #0081ba;
    }
    .btn-cancel {
      width: 100%;
      background: transparent;
      color: #666;
      border: none;
      padding: 10px;
      font-size: 12px;
      cursor: pointer;
      margin-top: 6px;
    }
    .btn-cancel:hover {
      color: #111;
      text-decoration: underline;
    }
    .card-footer {
      background: #f8fafc;
      padding: 12px 20px;
      font-size: 11px;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #f1f5f9;
    }
    .secure-icon {
      color: #16a34a;
      font-weight: 700;
    }
    /* Loading overlay */
    #loading-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(255, 255, 255, 0.95);
      z-index: 100;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 20px;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #009ee3;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>

  <!-- Loading State -->
  <div id="loading-overlay">
    <div class="spinner"></div>
    <h3 style="margin: 0; color: #0f172a; font-size: 18px;">Procesando pago...</h3>
    <p style="margin: 6px 0 0 0; color: #64748b; font-size: 13px;">Notificando vía Webhook a Gym Meraki</p>
  </div>

  <div class="header">
    <div class="mp-logo">
      <span>🤝</span>
      <span>mercado pago</span>
    </div>
    <span class="mp-badge">${isSuscripcion ? "Suscripción" : "Checkout Pro"}</span>
  </div>

  <div class="card">
    <div class="card-banner">
      <h2>${isSuscripcion ? "Suscripción a Débito Mensual" : "Pago de Cuota Mensual"}</h2>
      <p>Comercio: <strong>Gym Meraki</strong></p>
    </div>

    <div class="card-body">
      <div class="amount-box">
        <div class="label">${isSuscripcion ? "Monto Débito Recurrente" : "Total a Pagar"}</div>
        <div class="price">$${Number(monto).toLocaleString("es-AR")}</div>
        ${isSuscripcion ? '<div class="badge-sub">🔁 Se debitará automáticamente mes a mes</div>' : ""}
      </div>

      <div class="detail-row">
        <span class="detail-label">Concepto:</span>
        <span class="detail-val">${titulo}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Período:</span>
        <span class="detail-val">Mes ${mes} / ${anio}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Referencia:</span>
        <span class="detail-val" style="font-family: monospace; font-size: 11px;">${ref}</span>
      </div>

      <div style="margin-top: 14px;">
        <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Medios habilitados:</span>
        <div class="methods">
          <div class="method-pill">💳 Tarjetas</div>
          <div class="method-pill">📱 Dinero en MP</div>
          <div class="method-pill">⚡ Transferencia</div>
        </div>
      </div>

      <button id="payBtn" class="btn-pay" onclick="simularPago()">
        <span>🔒 Confirmar y Pagar $${Number(monto).toLocaleString("es-AR")}</span>
      </button>

      <button class="btn-cancel" onclick="window.close(); window.history.back();">
        Cancelar y volver
      </button>
    </div>

    <div class="card-footer">
      <span class="secure-icon">🛡️ Pago 100% Protegido</span>
      <span>Certificado SSL 256 bits</span>
    </div>
  </div>

  <script>
    async function simularPago() {
      const overlay = document.getElementById("loading-overlay");
      overlay.style.display = "flex";

      try {
        // Enviar evento al webhook local
        const res = await fetch("/api/mercadopago/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isSimulation: true,
            externalReference: "${ref}",
            monto: ${monto},
            tipo: "${tipo}",
            paymentId: Math.floor(10000000 + Math.random() * 90000000)
          })
        });

        const data = await res.json();

        // Mostrar éxito y redirigir
        setTimeout(() => {
          overlay.innerHTML = \`
            <div style="font-size: 54px; margin-bottom: 12px;">✅</div>
            <h2 style="margin: 0; color: #16a34a; font-size: 22px;">¡Pago Acreditado!</h2>
            <p style="margin: 8px 0 16px 0; color: #475569; font-size: 14px;">
              El estado de la membresía se actualizó a <strong>"Pagado"</strong> en el sistema de Gym Meraki.
            </p>
            <button onclick="window.location.href='/admin/economia'" style="background: #0f172a; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">
              Volver al Panel de Economía
            </button>
          \`;
        }, 1200);

      } catch (err) {
        alert("Error al procesar el webhook: " + err.message);
        overlay.style.display = "none";
      }
    }
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
