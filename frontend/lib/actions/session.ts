"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
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

  (await cookies()).set(SESSION_COOKIE_NAME, risultato.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  // Fuori dal try/catch: redirect() lancia internamente, non va intercettato.
  redirect(destinazioneIniziale(risultato));
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
