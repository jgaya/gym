import { cookies } from "next/headers";
import { Role } from "@lib/generated/prisma/enums";

export const COOKIE_NAME = "gym_session";
const JWT_SECRET = process.env.JWT_SECRET || "gym-meraki-super-secret-session-key-2026";
const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

export interface SessionUser {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  role: Role;
}

export interface SessionPayload extends SessionUser {
  exp: number;
  iat: number;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return Buffer.from(str, "base64").toString("utf-8");
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Genera un JWT firmado con HS256 mediante Web Crypto API nativo
 */
export async function signSessionToken(user: SessionUser): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    ...user,
    iat: now,
    exp: now + SEVEN_DAYS_IN_SECONDS,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const key = await getHmacKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );

  const signature = Buffer.from(signatureBuffer)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${signature}`;
}

/**
 * Valida la firma y expiración del JWT
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const data = `${headerB64}.${payloadB64}`;

    // Reconstruir buffer de firma
    const sigStr = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = sigStr.length % 4 ? "=".repeat(4 - (sigStr.length % 4)) : "";
    const signatureBytes = Buffer.from(sigStr + pad, "base64");

    const key = await getHmacKey();
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      new TextEncoder().encode(data)
    );

    if (!isValid) return null;

    const payload: SessionPayload = JSON.parse(base64UrlDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp < now) {
      return null; // Token expirado
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Obtiene el usuario autenticado actual desde las cookies de la petición
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload) return null;

    return {
      id: payload.id,
      email: payload.email,
      nombre: payload.nombre,
      apellido: payload.apellido,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

/**
 * Crea la cookie HTTP-Only de sesión
 */
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await signSessionToken(user);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SEVEN_DAYS_IN_SECONDS,
    path: "/",
  });
}

/**
 * Elimina la cookie de sesión (Cerrar Sesión)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

