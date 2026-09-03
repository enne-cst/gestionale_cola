import { redirect } from "next/navigation";

// § migrazione al motore registro campo-per-campo (stesso trattamento di
// "Contratto di lavoro"/"Turni di lavoro"): modifica e consultazione sono
// ora nel workspace della Panoramica, aperto dalla card della griglia
// "Organizzazione". Questa route resta solo per non rompere i link
// esistenti che puntano allo slug.
export default function PosizioniAssicurativePrevidenzialiPage() {
  redirect("/anagrafica");
}
