import { sendGAEvent } from "@next/third-parties/google";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Envía un evento personalizado a Google Analytics si está activo en el entorno.
 *
 * @param eventName Nombre del evento (ej: 'login', 'sesion_completada', 'venta_kiosco')
 * @param params Parámetros adicionales del evento (clave-valor)
 */
export function trackEvent(eventName: string, params: Record<string, string | number | boolean | null | undefined> = {}) {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) {
    return;
  }

  try {
    sendGAEvent("event", eventName, params);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Analytics] Error al emitir evento:", eventName, err);
    }
  }
}
