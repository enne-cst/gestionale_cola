// Nome del cookie che memorizza l'azienda cliente su cui un consulente sta
// operando (vedi lib/api.ts, che lo inoltra come header X-Azienda-Id, e
// lib/actions/azienda-attiva.ts). Separato dal cookie di sessione: non
// contiene credenziali, solo un id verificato ad ogni richiesta dal
// backend (mai fidato lato client, vedi app.core.deps.get_current_azienda).
export const AZIENDA_ATTIVA_COOKIE_NAME = "azienda-attiva";
