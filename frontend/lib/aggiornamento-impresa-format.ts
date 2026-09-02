// Etichette italiane della colonna "Evento" (§6): un solo posto per la
// mappatura codice tipologia -> testo visibile, riusato dalla tabella e dal
// popup di verifica.
const ETICHETTE_TIPOLOGIA: Record<string, string> = {
  PRATICA_CAMERALE: "Pratica camerale",
  IMPORTAZIONE_VISURA: "Importazione visura PDF",
  CONFERMA_VISURA: "Conferma visura",
  VARIAZIONE_SEDE: "Variazione della sede",
  TRASFERIMENTO_QUOTE: "Trasferimento di quote",
};

export function etichettaTipologiaEvento(tipologia: string): string {
  return ETICHETTE_TIPOLOGIA[tipologia] ?? tipologia;
}
