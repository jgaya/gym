import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Webhook oficial para recibir notificaciones de pago de Mercado Pago
 * Procesa notificaciones tipo:
 * 1. payment.created / payment.updated (IPN v1 & v2)
 * 2. Simulación directa desde el panel de pruebas
 */
interface MercadoPagoWebhookBody {
  type?: string;
  action?: string;
  data?: { id?: string | number };
  id?: string | number;
  isSimulation?: boolean;
  externalReference?: string;
  monto?: number | string;
  tipo?: string;
  paymentId?: string | number;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  try {
    let body: MercadoPagoWebhookBody = {};
    try {
      body = (await req.json()) as MercadoPagoWebhookBody;
    } catch {
      // Body vacío o text
    }

    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic") || searchParams.get("type") || body.type || body.action;
    const paymentId = searchParams.get("data.id") || searchParams.get("id") || body?.data?.id || body?.id;

    // Caso A: Simulación directa enviada por el entorno de prueba del sistema
    if (body.isSimulation && body.externalReference) {
      const parts = body.externalReference.split("-");
      // Formato: GYM-PAGO-[usuarioId]-[anio]-[mes]-[timestamp]
      if (parts.length >= 5 && parts[0] === "GYM" && parts[1] === "PAGO") {
        const usuarioId = Number(parts[2]);
        const anio = Number(parts[3]);
        const mes = Number(parts[4]);
        const monto = Number(body.monto) || 0;
        const metodo = body.tipo === "suscripcion_mensual" ? "Mercado Pago (Débito Automático)" : "Mercado Pago (Link de Pago)";
        const comprobante = "MP-" + (body.paymentId || Math.floor(10000000 + Math.random() * 90000000));

        await prisma.pago.upsert({
          where: {
            usuarioId_anio_mes: {
              usuarioId,
              anio,
              mes,
            },
          },
          update: {
            monto,
            metodoPago: metodo,
            comprobante,
            notas: "Cobrado automáticamente vía Webhook de Mercado Pago",
            fechaPago: new Date(),
          },
          create: {
            usuarioId,
            anio,
            mes,
            monto,
            metodoPago: metodo,
            comprobante,
            notas: "Cobrado automáticamente vía Webhook de Mercado Pago",
            fechaPago: new Date(),
          },
        });

        return NextResponse.json({
          received: true,
          status: "approved",
          message: "Pago registrado y acreditado en la base de datos.",
        });
      }
    }

    // Caso B: Notificación de la API oficial de Mercado Pago
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();

    if (accessToken && paymentId) {
      // Consultar detalle del pago en Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (mpResponse.ok) {
        const paymentData = await mpResponse.json();
        const status = paymentData.status; // "approved", "pending", "rejected"
        const externalReference = paymentData.external_reference;

        if (status === "approved" && externalReference) {
          const parts = externalReference.split("-");
          if (parts.length >= 5 && parts[0] === "GYM" && parts[1] === "PAGO") {
            const usuarioId = Number(parts[2]);
            const anio = Number(parts[3]);
            const mes = Number(parts[4]);
            const monto = Number(paymentData.transaction_amount) || 0;
            const metodo =
              paymentData.payment_method_id
                ? `Mercado Pago (${paymentData.payment_method_id.toUpperCase()})`
                : "Mercado Pago";
            const comprobante = `MP-${paymentData.id}`;

            await prisma.pago.upsert({
              where: {
                usuarioId_anio_mes: {
                  usuarioId,
                  anio,
                  mes,
                },
              },
              update: {
                monto,
                metodoPago: metodo,
                comprobante,
                notas: `Acreditado vía Webhook MP. Operación #${paymentData.id}`,
                fechaPago: new Date(paymentData.date_approved || Date.now()),
              },
              create: {
                usuarioId,
                anio,
                mes,
                monto,
                metodoPago: metodo,
                comprobante,
                notas: `Acreditado vía Webhook MP. Operación #${paymentData.id}`,
                fechaPago: new Date(paymentData.date_approved || Date.now()),
              },
            });

            console.log(`[Mercado Pago Webhook] Pago #${paymentId} acreditado para usuario #${usuarioId}`);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("[Mercado Pago Webhook Error]:", error);
    const message = error instanceof Error ? error.message : "Error interno en el webhook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Permitir verificación de endpoint vía GET
export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "Mercado Pago Webhook Endpoint",
    timestamp: new Date().toISOString(),
  });
}
