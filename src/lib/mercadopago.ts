/**
 * Servicio de integración con Mercado Pago para cobros de cuotas del Gimnasio
 * Soporta credenciales reales (MERCADO_PAGO_ACCESS_TOKEN) o simulación interactiva con URLs seguras.
 */

interface CrearLinkPagoParams {
  usuarioId: number;
  nombreUsuario: string;
  apellidoUsuario: string;
  emailUsuario: string;
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
  planNombre,
  monto,
  mes,
  anio,
  tipoCobro = "cuota_mes",
}: CrearLinkPagoParams): Promise<LinkPagoResultado> {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() || "http://localhost:3000";

  // Identificador de referencia externa unívoco que viaja a Mercado Pago y regresa en el Webhook / IPN
  const externalReference = `GYM-PAGO-${usuarioId}-${anio}-${mes}-${Date.now()}`;
  const title =
    tipoCobro === "suscripcion_mensual"
      ? `Suscripción Gym Meraki - ${planNombre} (Débito Mensual)`
      : `Cuota Gym Meraki - ${planNombre} (${mes}/${anio}) - ${nombreUsuario} ${apellidoUsuario}`;

  // Si hay Token real de Mercado Pago configurado, creamos la Preferencia vía REST API oficial
  if (accessToken && accessToken.length > 10) {
    try {
      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              id: `plan-${planNombre.toLowerCase().replace(/\s+/g, "-")}`,
              title,
              description: `Membresía gimnasio socio #${usuarioId}`,
              quantity: 1,
              currency_id: "ARS",
              unit_price: Number(monto),
            },
          ],
          payer: {
            name: nombreUsuario,
            surname: apellidoUsuario,
            email: emailUsuario || `socio_${usuarioId}@gymmeraki.com`,
          },
          external_reference: externalReference,
          back_urls: {
            success: `${baseUrl}/admin/economia?status=success&ref=${externalReference}`,
            pending: `${baseUrl}/admin/economia?status=pending&ref=${externalReference}`,
            failure: `${baseUrl}/admin/economia?status=failure&ref=${externalReference}`,
          },
          auto_return: "approved",
          notification_url: `${baseUrl}/api/mercadopago/webhook`,
          statement_descriptor: "GYM MERAKI",
        }),
      });

      if (response.ok) {
        const pref = await response.json();
        return {
          initPoint: pref.init_point || pref.sandbox_init_point,
          sandboxInitPoint: pref.sandbox_init_point,
          preferenceId: pref.id,
          tipo: tipoCobro,
          externalReference,
          isSimulated: false,
        };
      } else {
        const errData = await response.text();
        console.warn("Mercado Pago API respondió con error, usando fallback simulado:", errData);
      }
    } catch (apiError) {
      console.warn("Error de red con Mercado Pago API, usando fallback simulado:", apiError);
    }
  }

  // Modo Sandbox / Demo interactivo sin bloquear al administrador:
  // Redirige al portal de pago de prueba de la app que simula el checkout de Mercado Pago
  const simulatedPrefId = `PREF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
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
