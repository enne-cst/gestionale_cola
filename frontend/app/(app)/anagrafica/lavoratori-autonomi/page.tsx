import { redirect } from "next/navigation";

// § migrazione alla verifica per riga nel workspace (§ "falle tutte", stesso
// trattamento delle sezioni a registro campo-per-campo): modifica e
// consultazione sono ora nel drawer aperto dalla card della griglia
// "Organizzazione". Questa route resta solo per non rompere i link
// esistenti che puntano allo slug.
export default function LavoratoriAutonomiPage() {
  redirect("/anagrafica");
}
