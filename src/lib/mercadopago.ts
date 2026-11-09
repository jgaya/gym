import crypto from "node:crypto";
import {
  MercadoPagoConfig,
  Preference,
  PreApproval,
  PreApprovalPlan,
  PaymentRefund,
} from "mercadopago";

/**
 * Servicio oficial de integración con Mercado Pago (SDK v2) para cobros de cuotas del Gimnasio.
 * Cumple con los estándares de Medición de Calidad y Homologación de Mercado Pago:
 * - Uso del SDK oficial `mercadopago` v2 (`MercadoPagoConfig`, `Preference`, `PreApproval`, `PaymentRefund`)
 * - Clave de idempotencia determinística (`X-Idempotency-Key`)
 * - Campos de prevención de fraude (`items[].category_id`, `payer.identification` DNI, `payer.phone`)
 * - Expiración explícita de preferencias (`expires: true`, `expiration_date_to`)
 * - Suscripciones recurrentes reales mediante la API `PreApproval`
 * - Separación estricta entre entorno productivo/tokenizado y modo demo local
 */

export interface CrearLinkPagoParams {
  usuarioId: number;
  nombreUsuario: string;
  apellidoUsuario: string;
  emailUsuario: string;
  dniUsuario?: string | null;
  telefonoUsuario?: string | null;
  planNombre: string;
  monto: number;
  mes: number;
  anio: number;
  tipoCobro?: "cuota_mes" | "suscripcion_mensual";
}

export interface LinkPagoResultado {
  initPoint: string;
  sandboxInitPoint?: string;
  preferenceId: string;
  tipo: "cuota_mes" | "suscripcion_mensual";
  externalReference: string;
  isSimulated: boolean;
}

export async function generarLinkMercadoPago({
  usuarioId,
  nombreUsuario,
  apellidoUsuario,
  emailUsuario,
  dniUsuario,
  telefonoUsuario,
  planNombre,
  monto,
  mes,
  anio,
  tipoCobro = "cuota_mes",
}: CrearLinkPagoParams): Promise<LinkPagoResultado> {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL?.trim() || "http://localhost:3000"
  ).replace(/\/+$/, "");
  const isProd = process.env.NODE_ENV === "production";
  const isPublicHttps =
    baseUrl.startsWith("https://") &&
    !baseUrl.includes("localhost") &&
    !baseUrl.includes("127.0.0.1");

  // Identificador de referencia externa determinístico por socio y período:
  // Formato: GYM-PAGO-[usuarioId]-[anio]-[mes]
  const externalReference = `GYM-PAGO-${usuarioId}-${anio}-${mes}`;

  // Clave de idempotencia (X-Idempotency-Key) para evitar duplicación de preferencias/suscripciones
  const idempotencyKey = crypto
    .createHash("sha256")
    .update(`${externalReference}-${Number(monto).toFixed(2)}-${tipoCobro}`)
    .digest("hex");

  const title =
    tipoCobro === "suscripcion_mensual"
      ? `Suscripción Meraki - ${planNombre} (Débito Mensual)`
      : `Cuota Meraki - ${planNombre} (${mes}/${anio}) - ${nombreUsuario} ${apellidoUsuario}`;

  const cleanDni = (dniUsuario || "").replace(/\D/g, "");
  const cleanPhone = (telefonoUsuario || "").replace(/\D/g, "");
  const validEmail =
    emailUsuario && emailUsuario.includes("@")
      ? emailUsuario.trim()
      : `socio_${usuarioId}@merakigym.com.ar`;

  // Si hay Token configurado, usamos exclusivamente el SDK oficial v2 de Mercado Pago
  // sin fallback silencioso a links de demostración ante errores de API.
  if (accessToken && accessToken.length > 10) {
    const isSandboxToken = accessToken.startsWith("TEST-");
    const client = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: 8000,
        idempotencyKey,
      },
    });

    // Modalidad 1: Suscripción recurrente mensual (API PreApproval / PreApprovalPlan)
    if (tipoCobro === "suscripcion_mensual") {
      const backUrl = isPublicHttps
        ? `${baseUrl}/mi-rutina?pago=success&ref=${encodeURIComponent(
            externalReference
          )}`
        : `https://www.mercadopago.com.ar`;

      try {
        const preApprovalClient = new PreApproval(client);
        const subResponse = await preApprovalClient.create({
          body: {
            reason: title,
            external_reference: externalReference,
            payer_email: validEmail,
            auto_recurring: {
              frequency: 1,
              frequency_type: "months",
              transaction_amount: Number(monto),
              currency_id: "ARS",
            },
            back_url: backUrl,
            status: "pending",
          },
          requestOptions: {
            idempotencyKey,
          },
        });

        if (subResponse.init_point && subResponse.id) {
          return {
            initPoint: subResponse.init_point,
            preferenceId: String(subResponse.id),
            tipo: tipoCobro,
            externalReference,
            isSimulated: false,
          };
        }
      } catch {
        // Si el email del socio en el gimnasio no coincide con una cuenta MP existente (o test_user en Sandbox),
        // generamos un PreApprovalPlan compartible para que el socio ingrese con su propia cuenta de MP.
      }

      const planClient = new PreApprovalPlan(client);
      const planRes = await planClient.create({
        body: {
          reason: title,
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: Number(monto),
            currency_id: "ARS",
          },
          back_url: backUrl,
        },
        requestOptions: {
          idempotencyKey: `${idempotencyKey}-plan`,
        },
      });

      if (!planRes.init_point || !planRes.id) {
        throw new Error(
          "Mercado Pago no devolvió un init_point válido para la suscripción."
        );
      }

      return {
        initPoint: planRes.init_point,
        preferenceId: String(planRes.id),
        tipo: tipoCobro,
        externalReference,
        isSimulated: false,
      };
    }

    // Modalidad 2: Pago único de cuota mensual (API Checkout Pro Preferences)
    const preferenceClient = new Preference(client);
    const now = new Date();
    const expirationDateTo = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const pref = await preferenceClient.create({
      body: {
        items: [
          {
            id: `plan-${planNombre.toLowerCase().replace(/\s+/g, "-")}`,
            title,
            description: `Membresía gimnasio socio #${usuarioId} — Período ${mes}/${anio}`,
            category_id: "services",
            quantity: 1,
            currency_id: "ARS",
            unit_price: Number(monto),
          },
        ],
        payer: {
          name: nombreUsuario,
          surname: apellidoUsuario,
          email: validEmail,
          ...(cleanDni.length >= 7
            ? {
                identification: {
                  type: "DNI",
                  number: cleanDni,
                },
              }
            : {}),
          ...(cleanPhone.length >= 6
            ? {
                phone: {
                  number: cleanPhone,
                },
              }
            : {}),
        },
        external_reference: externalReference,
        // Redirige a una ruta accesible por el socio tras completar el pago
        back_urls: {
          success: `${baseUrl}/mi-rutina?pago=success&ref=${encodeURIComponent(
            externalReference
          )}`,
          pending: `${baseUrl}/mi-rutina?pago=pending&ref=${encodeURIComponent(
            externalReference
          )}`,
          failure: `${baseUrl}/mi-rutina?pago=failure&ref=${encodeURIComponent(
            externalReference
          )}`,
        },
        ...(isPublicHttps
          ? {
              auto_return: "approved",
              notification_url: `${baseUrl}/api/mercadopago/webhook`,
            }
          : {}),
        binary_mode: false,
        expires: true,
        expiration_date_from: now.toISOString(),
        expiration_date_to: expirationDateTo,
        statement_descriptor: "MERAKI GYM",
      },
      requestOptions: {
        idempotencyKey,
      },
    });

    const chosenInitPoint = isSandboxToken
      ? pref.sandbox_init_point || pref.init_point
      : pref.init_point || pref.sandbox_init_point;

    if (!chosenInitPoint || !pref.id) {
      throw new Error(
        "Mercado Pago no devolvió un init_point válido para la preferencia."
      );
    }

    return {
      initPoint: chosenInitPoint,
      sandboxInitPoint: pref.sandbox_init_point,
      preferenceId: pref.id,
      tipo: tipoCobro,
      externalReference,
      isSimulated: false,
    };
  }

  // En producción, exigir que MERCADO_PAGO_ACCESS_TOKEN esté configurado
  if (isProd) {
    throw new Error(
      "MERCADO_PAGO_ACCESS_TOKEN no está configurado en el entorno de producción."
    );
  }

  // Modo Demo / Desarrollo local (únicamente cuando no hay MERCADO_PAGO_ACCESS_TOKEN en desarrollo)
  const simulatedPrefId = `PREF-${Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase()}`;
  const checkoutUrl = `${baseUrl}/api/mercadopago/checkout-demo?prefId=${simulatedPrefId}&ref=${encodeURIComponent(
    externalReference
  )}&usuarioId=${usuarioId}&mes=${mes}&anio=${anio}&monto=${monto}&titulo=${encodeURIComponent(
    title
  )}&tipo=${tipoCobro}`;

  return {
    initPoint: checkoutUrl,
    preferenceId: simulatedPrefId,
    tipo: tipoCobro,
    externalReference,
    isSimulated: true,
  };
}

/**
 * Ejecuta un reembolso total en Mercado Pago cuando se anula un cobro acreditado vía MP.
 */
export async function reembolsarPagoMercadoPago(
  mpPaymentId: string | number
): Promise<{ refunded: boolean; refundId?: number }> {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  const numericId = Number(String(mpPaymentId).replace(/^MP-/, ""));

  if (!accessToken || !Number.isFinite(numericId) || numericId <= 0) {
    return { refunded: false };
  }

  const idempotencyKey = crypto
    .createHash("sha256")
    .update(`REFUND-MP-${numericId}`)
    .digest("hex");

  const client = new MercadoPagoConfig({
    accessToken,
    options: { timeout: 8000, idempotencyKey },
  });

  const refundClient = new PaymentRefund(client);
  const refundRes = await refundClient.create({
    payment_id: numericId,
    requestOptions: { idempotencyKey },
  });

  return {
    refunded: true,
    refundId: refundRes.id,
  };
}
