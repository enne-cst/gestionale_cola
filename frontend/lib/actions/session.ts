"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import { AZIENDA_ATTIVA_COOKIE_NAME } from "@/lib/azienda-attiva-cookie";
import { destinazioneIniziale } from "@/lib/auth-destinazione";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";
import type { LoginResponse } from "@/lib/types/auth";

export type LoginState = { error?: string };

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  let risultato: LoginResponse;
  try {
    risultato = await apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, risultato.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  // Un cookie azienda-attiva residuo di una sessione precedente (utente
  // diverso, sullo stesso browser) non deve sopravvivere a un nuovo login.
  cookieStore.delete(AZIENDA_ATTIVA_COOKIE_NAME);

  // Fuori dal try/catch: redirect() lancia internamente, non va intercettato.
  redirect(destinazioneIniziale(risultato));
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(AZIENDA_ATTIVA_COOKIE_NAME);
  redirect("/login");
}
