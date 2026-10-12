# Guía de Integración con Mercado Pago — Gym Meraki

Esta guía detalla los pasos para poner en producción la pasarela de pagos con **Mercado Pago**, qué solicitarle al cliente (dueño del gimnasio) y cómo realizar pruebas completas en el entorno **Sandbox**.

---

## 1. ¿Qué se le debe pedir al cliente (Dueño del Gimnasio)?

Para que el dinero ingrese directamente en la cuenta bancaria / cuenta de Mercado Pago del gimnasio, el cliente debe proveer las credenciales de su cuenta de desarrollador de Mercado Pago.

### Pasos que debe realizar el cliente:
1. **Tener una cuenta de Mercado Pago activa** (cuenta comercial, de empresa o personal verificada).
2. Ingresar a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel) con su usuario habitual.
3. Crear una nueva aplicación (o seleccionar una existente):
   - **Nombre de la app:** Ej. `Gym Meraki - Cobros`
   - **Tipo de solución:** *Pagos online / Checkout Pro*
4. En el menú lateral de la app, ingresar a **Credenciales de producción**:
   - Completar el formulario de homologación de negocio si es la primera vez (rubro: *Servicios deportivos / Gimnasio*).
5. Copiar y entregarte únicamente:
   - **`Access Token` de Producción** (empieza con `APP_USR-...`)
   - *(Opcional)* **`Public Key`** (empieza con `APP_USR-...`)

> [!WARNING]
> El cliente **NUNCA** debe compartir su contraseña de Mercado Pago ni su email personal. Solo debe entregarte el **Access Token** generado dentro del Panel de Desarrolladores.

---

## 2. Configuración en la Aplicación (`.env`)

En el archivo `.env` del proyecto (o en las variables de entorno de tu servidor de hosting como Vercel, Railway, etc.), agrega lo siguiente:

```bash
# URL pública de tu aplicación (necesaria para el Webhook y retornos de pago)
NEXT_PUBLIC_BASE_URL="https://tu-dominio.com"

# Token de Mercado Pago (Sandbox para pruebas o Producción para cobros reales)
MERCADO_PAGO_ACCESS_TOKEN="APP_USR-xxxxxx-xxxxxx-xxxxxx"
```

---

## 3. ¿Cómo probar en el Sandbox de Mercado Pago?

Mercado Pago cuenta con un entorno de **Sandbox** que permite simular transacciones reales sin mover dinero real ni requerir tarjetas de crédito verdaderas.

### Paso 1: Obtener credenciales de Prueba (Sandbox)
1. En [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel), ingresa a tu aplicación.
2. En el menú lateral, dirígete a **Credenciales de prueba**.
3. Copia el **`Access Token` de Prueba** (empieza con `TEST-...`).
4. Pégalo en tu `.env`:
   ```bash
   MERCADO_PAGO_ACCESS_TOKEN="TEST-1234567890..."
   ```

### Paso 2: Crear Cuentas de Prueba (Test Users)
Para que Mercado Pago no rechace la compra en Sandbox, **el comprador y el vendedor deben ser cuentas de prueba distintas**:
1. En el panel de Mercado Pago Developers, entra a **Cuentas de prueba** (Test users).
2. Crea 2 usuarios:
   - **Vendedor:** Es la cuenta dueña de la app (la que emite el token `TEST-...`).
   - **Comprador:** Cuenta con dinero y tarjeta ficticia para simular que un socio paga.

### Paso 3: Tarjetas de Crédito y Débito Oficiales de Prueba
Cuando se abra el Checkout de Mercado Pago, ingresa cualquiera de las tarjetas de prueba oficiales:

| Caso de Prueba | Número de Tarjeta | Vencimiento | Código (CVV) | Nombre Titular |
| :--- | :--- | :--- | :--- | :--- |
| **Pago Aprobado (Visa)** | `4012 0010 3714 1112` | `11/28` | `123` | `APRO` |
| **Pago Aprobado (Mastercard)** | `5031 7557 3453 0145` | `11/28` | `123` | `APRO` |
| **Pago Aprobado (Amex)** | `3777 7777 7777 771` | `11/28` | `1234` | `APRO` |
| **Tarjeta Rechazada** | `4012 0010 3714 1120` | `11/28` | `123` | `OTHE` |
| **Fondos Insuficientes** | `4012 0010 3714 1115` | `11/28` | `123` | `CALL` |

*DNI para el formulario de prueba:* Cualquier número válido de 8 dígitos (ej: `34567890`).

---

## 4. Configuración del Webhook para Notificaciones Automáticas

Para que Mercado Pago notifique a tu servidor cuando el pago fue completado y tu base de datos lo marque como **"Pagado"** automáticamente:

### En Producción / Staging (Servidor con URL pública HTTPS):
1. En Mercado Pago Developers, ve a tu aplicación → **Webhooks / Notificaciones IPN**.
2. Ingresa la URL de notificación de tu sistema:
   ```text
   https://tu-dominio.com/api/mercadopago/webhook
   ```
3. Selecciona los eventos:
   - `Pagos (Payments)`
   - `Planes y Suscripciones (Subscriptions)`

### En Entorno Local (`localhost`):
Dado que Mercado Pago no puede enviar un request HTTP directo a tu máquina privada (`http://localhost:3000`), tienes dos opciones:

1. **Simulador Integrado Autónomo (Disponible ya en la app):**
   - Si no configuras ningún `MERCADO_PAGO_ACCESS_TOKEN`, la app automáticamente utiliza el portal interactivo en `/api/mercadopago/checkout-demo`. Al hacer clic en *"Confirmar y Pagar"*, se envía el evento interno al Webhook `/api/mercadopago/webhook` acreditando el socio en la base de datos de inmediato.
2. **Conexión Real con ngrok:**
   - Si quieres recibir el webhook directamente desde los servidores de Mercado Pago a tu localhost:
     ```bash
     npx ngrok http 3000
     ```
   - Configura la URL pública que te dé ngrok en tu `.env`:
     ```bash
     NEXT_PUBLIC_BASE_URL="https://tu-subdominio.ngrok-free.app"
     ```
   - En el panel de Mercado Pago coloca:
     `https://tu-subdominio.ngrok-free.app/api/mercadopago/webhook`

---

## 5. Arquitectura del Flujo Implementado

```
[Administrador del Gym]
         │ (1. Clic en "💳 MP" de un socio)
         ▼
[Gym Meraki App] ──(2. Crea Preferencia / externalReference)──► [Mercado Pago API]
         │                                                            │
         │ (3. Link listo con botón WhatsApp / Copiar)               │
         ▼                                                            │
   [Socio / Atleta] ◄────(4. Paga con Tarjeta o Saldo MP)─────────────┘
         │
         ▼
  [Mercado Pago] ────(5. Webhook POST /api/mercadopago/webhook)───► [Gym Meraki App]
                                                                          │
                                                                 (6. Prisma Upsert)
                                                                          ▼
                                                                 [Estado: "Pagado"]
```
