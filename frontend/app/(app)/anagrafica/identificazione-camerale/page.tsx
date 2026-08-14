import { redirect } from "next/navigation";

// Modifica e consultazione di "Identificazione camerale" sono ora nel
// workspace della Panoramica (§8, sezione "Informazioni societarie"): unico
// percorso di scrittura che tiene coerenti stato di verifica e visibilità
// per campo. Questa route resta solo per non rompere i link esistenti che
// puntano allo slug (es. la card "Completa la prossima sezione").
export default function IdentificazioneCameralePage() {
  redirect("/anagrafica");
}
