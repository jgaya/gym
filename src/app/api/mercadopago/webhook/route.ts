import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { MercadoPagoConfig, Payment, PreApproval } from "mercadopago";
import { prisma } from "@lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Webhook oficial para recibir notificaciones de pago y suscripciones de Mercado Pago.
 * Cumple con los estándares de seguridad y homologación:
 * - Validación criptográfica HMAC-SHA256 de firma (`x-signature` y `x-request-id`)
 * - Bloqueo de simulaciones en entornos productivos o con token activo
 * - Filtrado estricto por tipo de evento (`payment`, `subscription_preapproval`)
 * - Uso del SDK oficial `mercadopago` v2 con timeouts configurados
 * - Idempotencia ante reintentos y manejo del ciclo completo (`approved`, `refunded`, `cancelled`, `charged_back`)
 */
interface MercadoPagoWebhookBody {
  type?: string;
  action?: string;
  topic?: string;
  data?: { id?: string | number };
  id?: string | number;
  isSimulation?: boolean;
  externalReference?: string;
  monto?: number | string;
  tipo?: string;
  paymentId?: string | number;
  [key: string]: unknown;
}

/**
 * Verifica la firma HMAC-SHA256 enviada por Mercado Pago en el header `x-signature`.
 * Formato oficial del manifiesto: `id:[data.id_url];request-id:[x-request-id];ts:[ts];`
 */
function verifyMercadoPagoSignature(
  req: NextRequest,
  dataId: string,
  secret: string
): boolean {
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  if (!xSignature || !xRequestId || !dataId) {
    return false;
  }

  let ts = "";
  let v1 = "";
  for (const part of xSignature.split(",")) {
    const [key, val] = part.trim().split("=");
    if (key === "ts" && val) ts = val.trim();
    if (key === "v1" && val) v1 = val.trim();
  }

  if (!ts || !v1) {
    return false;
  }

  // Mitigación de ataques de replay (ventana máxima de 5 minutos)
  const timestampSec = Number(ts);
  const nowSec = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(timestampSec) || Math.abs(nowSec - timestampSec) > 300) {
    return false;
  }

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const expectedHex = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  try {
    const receivedBuf = Buffer.from(v1, "hex");
    const expectedBuf = Buffer.from(expectedHex, "hex");
    return (
      receivedBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(receivedBuf, expectedBuf)
    );
  } catch {
    return false;
  }
}

/**
 * Extrae `usuarioId`, `anio` y `mes` desde un `external_reference` con formato `GYM-PAGO-{usuarioId}-{anio}-{mes}`
 */
function parseExternalReference(ref: string | null | undefined): {
  usuarioId: number;
  anio: number;
  mes: number;
} | null {
  if (!ref) return null;
  const parts = ref.split("-");
  if (parts.length < 5 || parts[0] !== "GYM" || parts[1] !== "PAGO") {
    return null;
  }

  const usuarioId = Number(parts[2]);
  const anio = Number(parts[3]);
  const mes = Number(parts[4]);

  if (
    !Number.isInteger(usuarioId) ||
    usuarioId <= 0 ||
    !Number.isInteger(anio) ||
    anio < 2020 ||
    anio > 2100 ||
    !Number.isInteger(mes) ||
    mes < 1 ||
    mes > 12
  ) {
    return null;
  }

  return { usuarioId, anio, mes };
}

export async function POST(req: NextRequest) {
  try {
    let body: MercadoPagoWebhookBody = {};
    try {
      body = (await req.json()) as MercadoPagoWebhookBody;
    } catch {
      // Notificación con parámetros únicamente por query string
    }

    const { searchParams } = new URL(req.url);
    const topic =
      searchParams.get("type") ||
      searchParams.get("topic") ||
      body.type ||
      body.topic ||
      body.action ||
      "";
    const resourceId = String(
      searchParams.get("data.id") ||
        searchParams.get("id") ||
        body?.data?.id ||
        body?.id ||
        ""
    ).trim();

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
    const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
    const isProd = process.env.NODE_ENV === "production";

    // Caso A: Simulación local — estrictamente bloqueada en producción o cuando existe token real
    if (body.isSimulation) {
      if (isProd || accessToken) {
        return NextResponse.json(
          { error: "Simulación deshabilitada en entorno productivo o con token activo." },
          { status: 403 }
        );
      }

      const parsed = parseExternalReference(body.externalReference);
      if (!parsed) {
        return NextResponse.json(
          { error: "Referencia externa de simulación inválida." },
          { status: 400 }
        );
      }

      const { usuarioId, anio, mes } = parsed;
      const monto = Number(body.monto) || 0;
      const metodo =
        body.tipo === "suscripcion_mensual"
          ? "Mercado Pago (Débito Automático)"
          : "Mercado Pago (Link de Pago)";
      const comprobante =
        "MP-SIM-" +
        (body.paymentId || Math.floor(10000000 + Math.random() * 90000000));

      await prisma.pago.upsert({
        where: {
          usuarioId_anio_mes: { usuarioId, anio, mes },
        },
        update: {
          monto,
          metodoPago: metodo,
          comprobante,
          notas: "Cobrado en entorno de simulación local (Demo Checkout)",
          fechaPago: new Date(),
        },
        create: {
          usuarioId,
          anio,
          mes,
          monto,
          metodoPago: metodo,
          comprobante,
          notas: "Cobrado en entorno de simulación local (Demo Checkout)",
          fechaPago: new Date(),
        },
      });

      return NextResponse.json({
        received: true,
        status: "approved",
        message: "Pago simulado registrado en entorno de desarrollo.",
      });
    }

    // Filtrar únicamente eventos relevantes de pagos o suscripciones (ignorar merchant_order, etc.)
    const isPaymentEvent =
      topic === "payment" || String(body.action || "").startsWith("payment.");
    const isSubscriptionEvent =
      topic === "subscription_preapproval" ||
      topic === "preapproval" ||
      String(body.action || "").startsWith("subscription_preapproval.");

    if ((!isPaymentEvent && !isSubscriptionEvent) || !resourceId) {
      return NextResponse.json(
        { received: true, ignored: true, topic },
        { status: 200 }
      );
    }

    // Validar firma criptográfica HMAC-SHA256 cuando MERCADO_PAGO_WEBHOOK_SECRET está configurado
    if (webhookSecret) {
      const isValidSig = verifyMercadoPagoSignature(req, resourceId, webhookSecret);
      if (!isValidSig) {
        console.warn(
          `[Mercado Pago Webhook] Firma inválida rechazada para recurso #${resourceId}`
        );
        return NextResponse.json(
          { error: "Firma de webhook inválida (x-signature)." },
          { status: 401 }
        );
      }
    } else if (isProd) {
      console.warn(
        "[Mercado Pago Webhook] ADVERTENCIA: MERCADO_PAGO_WEBHOOK_SECRET no está definido en producción."
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { received: true, warning: "Token de Mercado Pago no configurado." },
        { status: 200 }
      );
    }

    const client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 8000 },
    });

    // Sub-flujo 1: Notificación de Suscripción (PreApproval)
    if (isSubscriptionEvent) {
      const preApprovalClient = new PreApproval(client);
      const subData = await preApprovalClient.get({ id: resourceId });
      const parsed = parseExternalReference(subData.external_reference);

      if (subData.status === "authorized" && parsed) {
        const { usuarioId, anio, mes } = parsed;
        const monto = Number(subData.auto_recurring?.transaction_amount) || 0;
        const comprobante = `MP-SUB-${subData.id}`;

        const existente = await prisma.pago.findUnique({
          where: { usuarioId_anio_mes: { usuarioId, anio, mes } },
        });

        // Idempotencia: no sobrescribir si ya fue procesado con el mismo comprobante
        if (existente?.comprobante === comprobante) {
          return NextResponse.json({
            received: true,
            idempotent: true,
            status: subData.status,
          });
        }

        await prisma.pago.upsert({
          where: { usuarioId_anio_mes: { usuarioId, anio, mes } },
          update: {
            monto,
            metodoPago: "Mercado Pago (Débito Automático)",
            comprobante,
            notas: `Suscripción autorizada vía Webhook MP (#${subData.id})`,
            fechaPago: new Date(),
          },
          create: {
            usuarioId,
            anio,
            mes,
            monto,
            metodoPago: "Mercado Pago (Débito Automático)",
            comprobante,
            notas: `Suscripción autorizada vía Webhook MP (#${subData.id})`,
            fechaPago: new Date(),
          },
        });
      }

      return NextResponse.json({ received: true, status: subData.status });
    }

    // Sub-flujo 2: Notificación de Pago (Payment API v1 vía SDK oficial)
    const paymentClient = new Payment(client);
    const paymentData = await paymentClient.get({ id: resourceId });

    const status = paymentData.status;
    const comprobante = `MP-${paymentData.id}`;
    const parsed = parseExternalReference(paymentData.external_reference);

    // Manejo de reversos: reembolsos, cancelaciones y contracargos
    if (
      status === "refunded" ||
      status === "cancelled" ||
      status === "charged_back"
    ) {
      if (parsed) {
        await prisma.pago.deleteMany({
          where: {
            usuarioId: parsed.usuarioId,
            anio: parsed.anio,
            mes: parsed.mes,
            comprobante,
          },
        });
      } else {
        await prisma.pago.deleteMany({
          where: { comprobante },
        });
      }

      console.log(
        `[Mercado Pago Webhook] Pago #${paymentData.id} revertido por estado '${status}'.`
      );
      return NextResponse.json({ received: true, status });
    }

    // Manejo de pagos aprobados
    if (status === "approved" && parsed) {
      const { usuarioId, anio, mes } = parsed;
      const montoPagado = Number(paymentData.transaction_amount) || 0;

      // Validar moneda e importe positivo
      if (
        (paymentData.currency_id && paymentData.currency_id !== "ARS") ||
        montoPagado <= 0
      ) {
        console.warn(
          `[Mercado Pago Webhook] Pago #${paymentData.id} rechazado por moneda/monto inválido (${paymentData.currency_id} ${montoPagado}).`
        );
        return NextResponse.json({ received: true, ignored: true });
      }

      // Verificar idempotencia y conciliar con el precio del plan del usuario
      const [existente, usuario] = await Promise.all([
        prisma.pago.findUnique({
          where: { usuarioId_anio_mes: { usuarioId, anio, mes } },
        }),
        prisma.usuario.findUnique({
          where: { id: usuarioId },
          include: { plan: true },
        }),
      ]);

      if (!usuario) {
        return NextResponse.json({ received: true, ignored: true });
      }

      // Si el mismo paymentId ya fue acreditado, retornar 200 de forma idempotente
      if (existente?.comprobante === comprobante) {
        return NextResponse.json({
          received: true,
          idempotent: true,
          status: "approved",
        });
      }

      const montoEsperado = usuario.plan?.precio
        ? Number(usuario.plan.precio)
        : null;
      const observacionMonto =
        montoEsperado && Math.abs(montoPagado - montoEsperado) > 1
          ? ` (Monto plan: $${montoEsperado}, abonado: $${montoPagado})`
          : "";

      const metodo = paymentData.payment_method_id
        ? `Mercado Pago (${paymentData.payment_method_id.toUpperCase()})`
        : "Mercado Pago";

      await prisma.pago.upsert({
        where: {
          usuarioId_anio_mes: {
            usuarioId,
            anio,
            mes,
          },
        },
        update: {
          monto: montoPagado,
          metodoPago: metodo,
          comprobante,
          notas: `Acreditado vía Webhook MP. Operación #${paymentData.id}${observacionMonto}`,
          fechaPago: new Date(paymentData.date_approved || Date.now()),
        },
        create: {
          usuarioId,
          anio,
          mes,
          monto: montoPagado,
          metodoPago: metodo,
          comprobante,
          notas: `Acreditado vía Webhook MP. Operación #${paymentData.id}${observacionMonto}`,
          fechaPago: new Date(paymentData.date_approved || Date.now()),
        },
      });

      console.log(
        `[Mercado Pago Webhook] Pago #${paymentData.id} acreditado para usuario #${usuarioId}`
      );
    }

    return NextResponse.json({ received: true, status });
  } catch (error: unknown) {
    console.error("[Mercado Pago Webhook Error]:", error);
    const message =
      error instanceof Error ? error.message : "Error interno en el webhook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Permitir verificación de salud del endpoint vía GET
export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "Mercado Pago Webhook Endpoint (SDK v2)",
    timestamp: new Date().toISOString(),
  });
}
