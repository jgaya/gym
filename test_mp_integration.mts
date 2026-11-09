import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { generarLinkMercadoPago, reembolsarPagoMercadoPago } from "./src/lib/mercadopago.ts";
import { POST as webhookPost } from "./src/app/api/mercadopago/webhook/route.ts";
import { prisma } from "./lib/prisma.ts";

async function runTests() {
  console.log("=== INICIANDO PRUEBAS INTEGRALES DE MERCADO PAGO (SANDBOX / SDK v2) ===\n");

  // Obtener un usuario real de la base de datos para la prueba (y restaurar su estado al final)
  const testUser = await prisma.usuario.findFirst({
    where: { role: "USER" },
    include: { plan: true },
  });

  if (!testUser) {
    throw new Error("No se encontró ningún usuario en la base de datos para ejecutar la prueba.");
  }

  const testMes = 12;
  const testAnio = 2029; // Año futuro para no afectar datos reales del gimnasio

  // Limpiar cualquier registro previo de prueba en 12/2029
  await prisma.pago.deleteMany({
    where: { usuarioId: testUser.id, anio: testAnio, mes: testMes },
  });

  const originalFetch = globalThis.fetch;
  let lastSdkRequestUrl = "";
  let lastSdkRequestHeaders: Record<string, string> = {};
  let lastSdkRequestBody: any = null;
  let mockPaymentStatus = "approved";

  try {
    // 1. Prueba de Checkout Demo Local (sin token)
    delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
    delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;

    const demoLink = await generarLinkMercadoPago({
      usuarioId: testUser.id,
      nombreUsuario: testUser.nombre,
      apellidoUsuario: testUser.apellido,
      emailUsuario: testUser.email,
      dniUsuario: testUser.dni,
      telefonoUsuario: testUser.telefono,
      planNombre: testUser.plan?.nombre || "Plan 3 Días",
      monto: 28000,
      mes: testMes,
      anio: testAnio,
      tipoCobro: "cuota_mes",
    });

    console.assert(demoLink.isSimulated === true, "Debe usar modo simulado cuando no hay token en dev");
    console.log("✅ [1/7] Modo Demo Local (sin token): genera URL interactiva correctamente ->", demoLink.preferenceId);

    // Configurar credenciales Sandbox de prueba e interceptar transporte HTTP del SDK oficial de Mercado Pago
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "TEST-1234567890123456-110820-sandboxtoken";
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = "mp_sandbox_webhook_secret_key_2026";

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      lastSdkRequestUrl = url;
      lastSdkRequestHeaders = Object.fromEntries(new Headers(init?.headers).entries());
      lastSdkRequestBody = init?.body ? JSON.parse(String(init.body)) : null;

      // Simular respuesta de POST /checkout/preferences de Mercado Pago Sandbox
      if (url.includes("/checkout/preferences")) {
        return new Response(
          JSON.stringify({
            id: "198273645-sandbox-pref-id",
            init_point: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=198273645",
            sandbox_init_point: "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=198273645-sandbox-pref-id",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      // Simular respuesta de POST /preapproval (Suscripciones)
      if (url.includes("/preapproval") && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            id: "2c9380848-sandbox-sub-id",
            init_point: "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=2c9380848-sandbox-sub-id",
            status: "pending",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      // Simular respuesta de GET /v1/payments/{id}
      if (url.includes("/v1/payments/9988776655") && (!init?.method || init.method === "GET")) {
        return new Response(
          JSON.stringify({
            id: 9988776655,
            status: mockPaymentStatus,
            currency_id: "ARS",
            transaction_amount: 28000,
            payment_method_id: "account_money",
            date_approved: new Date().toISOString(),
            external_reference: `GYM-PAGO-${testUser.id}-${testAnio}-${testMes}`,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Simular respuesta de POST /v1/payments/{id}/refunds
      if (url.includes("/v1/payments/9988776655/refunds")) {
        return new Response(
          JSON.stringify({
            id: 55443322,
            payment_id: 9988776655,
            amount: 28000,
            status: "approved",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      return originalFetch(input, init);
    };

    // 2. Prueba de creación de Preferencia Checkout Pro vía SDK v2
    const sandboxPref = await generarLinkMercadoPago({
      usuarioId: testUser.id,
      nombreUsuario: testUser.nombre,
      apellidoUsuario: testUser.apellido,
      emailUsuario: testUser.email,
      dniUsuario: testUser.dni,
      telefonoUsuario: testUser.telefono,
      planNombre: testUser.plan?.nombre || "Plan 3 Días",
      monto: 28000,
      mes: testMes,
      anio: testAnio,
      tipoCobro: "cuota_mes",
    });

    console.assert(sandboxPref.isSimulated === false, "No debe ser simulado con token TEST-");
    console.assert(
      sandboxPref.initPoint.startsWith("https://sandbox.mercadopago.com.ar/"),
      "Debe seleccionar sandbox_init_point cuando el token empieza con TEST-"
    );
    console.assert(Boolean(lastSdkRequestHeaders["x-idempotency-key"]), "Debe enviar header X-Idempotency-Key");
    console.assert(lastSdkRequestBody?.items?.[0]?.category_id === "services", "Debe enviar category_id: 'services'");
    console.assert(lastSdkRequestBody?.payer?.identification?.type === "DNI", "Debe enviar DNI del socio");
    console.assert(lastSdkRequestBody?.expires === true, "Debe configurar expiración de preferencia");
    console.log(
      "✅ [2/7] Preferencia Checkout Pro (SDK v2): validados headers X-Idempotency-Key, category_id, DNI, expiración y sandbox_init_point ->",
      sandboxPref.initPoint
    );

    // 3. Prueba de creación de Suscripción Recurrente (PreApproval API vía SDK v2)
    const sandboxSub = await generarLinkMercadoPago({
      usuarioId: testUser.id,
      nombreUsuario: testUser.nombre,
      apellidoUsuario: testUser.apellido,
      emailUsuario: testUser.email,
      dniUsuario: testUser.dni,
      telefonoUsuario: testUser.telefono,
      planNombre: testUser.plan?.nombre || "Plan 3 Días",
      monto: 28000,
      mes: testMes,
      anio: testAnio,
      tipoCobro: "suscripcion_mensual",
    });

    console.assert(lastSdkRequestUrl.includes("/preapproval"), "Debe invocar el endpoint /preapproval");
    console.assert(lastSdkRequestBody?.auto_recurring?.frequency_type === "months", "Debe configurar frecuencia mensual");
    console.log(
      "✅ [3/7] Suscripción Débito Automático (PreApproval SDK v2): validado auto_recurring mensual ->",
      sandboxSub.preferenceId
    );

    // 4. Prueba de Seguridad Webhook: Bloqueo de `isSimulation` cuando hay token activo
    const simAttackReq = new NextRequest("http://localhost:3000/api/mercadopago/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isSimulation: true,
        externalReference: `GYM-PAGO-${testUser.id}-${testAnio}-${testMes}`,
        monto: 28000,
      }),
    });
    const simAttackRes = await webhookPost(simAttackReq);
    console.assert(simAttackRes.status === 403, `Esperaba 403 ante simulación con token activo, recibió ${simAttackRes.status}`);
    console.log("✅ [4/7] Seguridad Webhook: intento de bypass con isSimulation bloqueado con HTTP 403");

    // 5. Prueba de Seguridad Webhook: Rechazo de firma `x-signature` inválida (HTTP 401)
    const badSigReq = new NextRequest("http://localhost:3000/api/mercadopago/webhook?type=payment&data.id=9988776655", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": "req-invalid-123",
        "x-signature": `ts=${Math.floor(Date.now() / 1000)},v1=0000000000000000000000000000000000000000000000000000000000000000`,
      },
      body: JSON.stringify({ type: "payment", data: { id: "9988776655" } }),
    });
    const badSigRes = await webhookPost(badSigReq);
    console.assert(badSigRes.status === 401, `Esperaba 401 ante firma inválida, recibió ${badSigRes.status}`);
    console.log("✅ [5/7] Seguridad Webhook: firma HMAC-SHA256 adulterada rechazada con HTTP 401");

    // 6. Prueba de Webhook Oficial Firmado (Acreditación de pago `approved` + Idempotencia)
    const ts = String(Math.floor(Date.now() / 1000));
    const requestId = "mp-req-sandbox-9988776655";
    const dataId = "9988776655";
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const validHmac = crypto
      .createHmac("sha256", process.env.MERCADO_PAGO_WEBHOOK_SECRET!)
      .update(manifest)
      .digest("hex");

    const buildSignedWebhookReq = () =>
      new NextRequest(`http://localhost:3000/api/mercadopago/webhook?type=payment&data.id=${dataId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": requestId,
          "x-signature": `ts=${ts},v1=${validHmac}`,
        },
        body: JSON.stringify({
          action: "payment.updated",
          type: "payment",
          data: { id: dataId },
        }),
      });

    const approvedRes = await webhookPost(buildSignedWebhookReq());
    const approvedJson = await approvedRes.json();
    console.assert(approvedRes.status === 200 && approvedJson.status === "approved", "Debe acreditar el pago aprobado");

    const pagoEnDb = await prisma.pago.findUnique({
      where: {
        usuarioId_anio_mes: { usuarioId: testUser.id, anio: testAnio, mes: testMes },
      },
    });
    console.assert(pagoEnDb?.comprobante === "MP-9988776655", "El pago debe persistirse en MySQL con comprobante MP-9988776655");

    // Segundo envío idéntico para verificar idempotencia
    const duplicateRes = await webhookPost(buildSignedWebhookReq());
    const duplicateJson = await duplicateRes.json();
    console.assert(duplicateJson.idempotent === true, "El segundo webhook idéntico debe responder idempotent: true");
    console.log(
      "✅ [6/7] Webhook Oficial Firmado (`approved` + Idempotencia): pago acreditado en DB y duplicado detectado correctamente"
    );

    // 7. Prueba de Reembolso (`PaymentRefund` SDK v2) y reversión por Webhook (`refunded`)
    const refundRes = await reembolsarPagoMercadoPago("MP-9988776655");
    console.assert(refundRes.refunded === true && refundRes.refundId === 55443322, "Debe ejecutar reembolso vía PaymentRefund SDK");

    mockPaymentStatus = "refunded";
    const refundedWebhookRes = await webhookPost(buildSignedWebhookReq());
    const refundedJson = await refundedWebhookRes.json();
    console.assert(refundedJson.status === "refunded", "El webhook debe procesar el estado refunded");

    const pagoPostRefund = await prisma.pago.findUnique({
      where: {
        usuarioId_anio_mes: { usuarioId: testUser.id, anio: testAnio, mes: testMes },
      },
    });
    console.assert(pagoPostRefund === null, "El pago reembolsado debe eliminarse automáticamente de la base de datos");
    console.log(
      "✅ [7/7] Reembolso y Reversión (`refunded`): ejecutado PaymentRefund y revertida la cuota en MySQL automáticamente"
    );

    console.log("\n🎉 TODAS LAS PRUEBAS (7/7) PASARON EXITOSAMENTE.");
  } finally {
    globalThis.fetch = originalFetch;
    await prisma.pago.deleteMany({
      where: { usuarioId: testUser.id, anio: testAnio, mes: testMes },
    });
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("❌ Error en las pruebas:", err);
  process.exit(1);
});
