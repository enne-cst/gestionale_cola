import { redirect } from "next/navigation";

// § pilota migrazione al motore registro campo-per-campo (stesso trattamento
// già riservato alle sezioni "Dati CCIAA", es. identificazione-camerale):
// modifica e consultazione di "Contratto di lavoro" sono ora nel workspace
// della Panoramica, aperto dalla card della griglia "Organizzazione". Questa
// route resta solo per non rompere i link esistenti che puntano allo slug.
export default function ContrattoLavoroPage() {
  redirect("/anagrafica");
}
