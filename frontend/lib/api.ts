// Tutte le chiamate al backend (lette e scritture) passano da qui e girano
// lato server (Server Component o Server Action): il browser non parla mai
// direttamente con l'API. Per questo si usa sempre API_URL_INTERNAL, l'URL
// interno alla rete Docker, non quello pubblico esposto al browser.

import { cookies } from "next/headers";

import { AZIENDA_ATTIVA_COOKIE_NAME } from "@/lib/azienda-attiva-cookie";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";

const INTERNAL_API_URL = process.env.API_URL_INTERNAL ?? process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail)) {
      return body.detail
        .map((issue: { loc?: unknown[]; msg?: string }) => {
          const field = Array.isArray(issue.loc) ? issue.loc.at(-1) : undefined;
          return field ? `${field}: ${issue.msg}` : issue.msg;
        })
        .join("; ");
    }
    return res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!INTERNAL_API_URL) {
    throw new ApiError(0, "URL del backend non configurato (API_URL_INTERNAL)");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const aziendaAttiva = cookieStore.get(AZIENDA_ATTIVA_COOKIE_NAME)?.value;

  const res = await fetch(`${INTERNAL_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(aziendaAttiva ? { "X-Azienda-Id": aziendaAttiva } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new ApiError(res.status, await extractErrorMessage(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

/** Converte un valore di FormData in stringa non vuota, o null (per campi
 * opzionali che il backend deve ricevere come `null`, non come ""). */
export function textOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function numberOrNull(value: FormDataEntryValue | null): number | null {
  const text = textOrNull(value);
  if (text === null) return null;
  const parsed = Number(text);
  return Number.isNaN(parsed) ? null : parsed;
}

export function checkboxToBool(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true";
}
