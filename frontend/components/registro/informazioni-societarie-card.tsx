"use client";

import { CompanyCard, type CompanyCardStato } from "@/components/registro/company-card";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { IdentificazioneCamerale } from "@/lib/types/anagrafica";

const SECTION_KEY = "informazioni-societarie";

/** Card di anteprima "Identificazione camerale" nella griglia di
 * "Informazioni societarie" (§8.1 del prompt master): apre il pannello
 * temporaneo del workspace (registro campo-per-campo) invece di navigare a
 * una pagina intera. Il pannello che si apre è intitolato "Informazioni
 * societarie" (i suoi campi coincidono con `ana_identificazione_camerale`). */
export function InformazioniSocietarieCard({ identificazione }: { identificazione: IdentificazioneCamerale | null }) {
  const { openDrawer, state } = useWorkspace();
  const compilata = Boolean(identificazione?.ragione_sociale);
  const quality = state.overview.quality;

  // Verde solo se la sezione è compilata per intero (tutti i campi del
  // catalogo, non solo quelli già toccati) e tutti confermati: la qualità
  // (percentuale) misura solo l'affidabilità di ciò che è già stato
  // inserito, ma qui serve anche sapere se manca ancora qualcosa da
  // compilare, quindi si usa `totalApplicable` a parte da `percentage`.
  // Al momento "Informazioni societarie" è l'unica sezione a registro,
  // quindi `quality` (calcolata sull'intero modulo) coincide con questa
  // sola card. Un campo oscurato con l'occhietto (`hidden`) non deve
  // impedire il verde solo perché non è ancora compilato: è una scelta del
  // Consulente di non mostrarlo, non un dato mancante da segnalare.
  const totalApplicabileVisibile = quality ? quality.totalApplicable - quality.hidden : 0;
  const tuttiCompilati = quality ? quality.verified + quality.pending + quality.revisionRequired >= totalApplicabileVisibile : false;
  const stato: CompanyCardStato = !compilata
    ? "incompleto"
    : !quality || !tuttiCompilati || quality.pending > 0 || quality.revisionRequired > 0
      ? "completato"
      : "verificato";

  return (
    <CompanyCard
      icon={SEZIONE_ICONE["identificazione-camerale"]}
      title="Identificazione camerale"
      stato={stato}
      details={
        identificazione
          ? [
              ["Ragione sociale", identificazione.ragione_sociale],
              ["Forma giuridica", identificazione.forma_giuridica],
              ["Codice fiscale", identificazione.codice_fiscale],
              ["Partita IVA", identificazione.partita_iva],
            ]
          : null
      }
      actionLabel={compilata ? "Visualizza dettagli" : "Compila sezione"}
      onAction={() => openDrawer(SECTION_KEY)}
    />
  );
}
