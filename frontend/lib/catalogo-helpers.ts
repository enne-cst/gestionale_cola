import type { CatalogoVoce } from "@/lib/types/anagrafica-iso9001";

/** Denominazione leggibile di una voce di catalogo (stati, frequenze...) a
 * partire dal suo id, per le tabelle delle sezioni ISO 9001 che salvano solo
 * l'id in relazione. */
export function catalogoLabel(catalogo: CatalogoVoce[], id: string | null | undefined): string {
  return catalogo.find((c) => c.id === id)?.denominazione ?? "—";
}

export function catalogoOptions(catalogo: CatalogoVoce[]): { value: string; label: string }[] {
  return catalogo.map((c) => ({ value: c.id, label: c.denominazione }));
}
