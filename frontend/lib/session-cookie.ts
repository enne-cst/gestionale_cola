// Nome del cookie di sessione, condiviso tra middleware.ts (edge runtime,
// non può importare next/headers) e lib/api.ts + lib/actions/session.ts
// (server actions/componenti). Un'unica costante evita di duplicare la
// stringa e disallinearla per errore.
export const SESSION_COOKIE_NAME = "session";
