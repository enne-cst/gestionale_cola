// Metadati di presentazione delle sezioni a registro campo-per-campo,
// condivisi da workspace-shell.tsx (barra schede) e section-content.tsx
// (header del pannello) per non duplicare la stessa mappa in due posti
// (vedi backend/app/core/registro_campi.py per il catalogo campi di ognuna).

export const TITOLO_SEZIONE_REGISTRO: Record<string, string> = {
  "informazioni-societarie": "Informazioni societarie",
  "capitale-sociale": "Capitale sociale",
  "durata-societa-esercizi": "Durata società ed esercizi",
  "amministrazione-controllo": "Amministrazione e controllo",
};

export const SOTTOTITOLO_SEZIONE_REGISTRO: Record<string, string> = {
  "informazioni-societarie": "Dati identificativi e societari dell'azienda",
  "capitale-sociale": "Capitale deliberato, sottoscritto e versato",
  "durata-societa-esercizi": "Durata della società e chiusura degli esercizi",
  "amministrazione-controllo": "Organo amministrativo in carica e conteggi aggregati",
};
