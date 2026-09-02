// Metadati di presentazione delle sezioni a registro campo-per-campo,
// condivisi da workspace-shell.tsx (barra schede) e section-content.tsx
// (header del pannello) per non duplicare la stessa mappa in due posti
// (vedi backend/app/core/registro_campi.py per il catalogo campi di ognuna).

export const TITOLO_SEZIONE_REGISTRO: Record<string, string> = {
  "informazioni-societarie": "Informazioni societarie",
  "capitale-sociale": "Capitale sociale",
  "durata-societa-esercizi": "Durata società ed esercizi",
  "amministrazione-controllo": "Amministrazione e controllo",
  "organi-controllo": "Organi di controllo",
  sede: "Sede",
  statuto: "Informazioni da statuto/atto costitutivo",
  "attivita-economica": "Attività economica",
  "unita-locali": "Sedi secondarie e unità locali",
};

export const SOTTOTITOLO_SEZIONE_REGISTRO: Record<string, string> = {
  "informazioni-societarie": "Dati identificativi e societari dell'azienda",
  "capitale-sociale": "Capitale deliberato, sottoscritto e versato",
  "durata-societa-esercizi": "Durata della società e chiusura degli esercizi",
  "amministrazione-controllo": "Organo amministrativo in carica e conteggi aggregati",
  "organi-controllo": "Assetto di controllo in carica e impostazioni generali",
  sede: "Sede legale, domicilio digitale e dati identificativi camerali",
  statuto: "Denominazione, iscrizione, durata e sistema di amministrazione adottato",
  "attivita-economica": "Stato, classificazioni e indicatori generali dell'attività aziendale",
  "unita-locali": "Numero di unità locali dichiarato in visura, a confronto con quelle registrate",
};
