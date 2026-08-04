import { LayoutDashboardIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { getVociPanoramica } from "@/lib/actions/panoramica";
import { MODULO_ANAGRAFICA, sezioneBySlug } from "@/lib/anagrafica-sezioni";
import { formatValoreGenerico } from "@/lib/format";

import { PanoramicaLista } from "./panoramica-lista";
import { anteprimaRecord } from "./record-preview";
import type { PanoramicaItem } from "./types";

export default async function PanoramicaPage() {
  const voci = await getVociPanoramica(MODULO_ANAGRAFICA);

  const sezioniConVoci = [...new Set(voci.map((v) => v.sezione_slug))];
  const datiPerSezione = new Map(
    await Promise.all(
      sezioniConVoci.map(async (slug) => [slug, await apiFetch<unknown>(`/api/anagrafica/${slug}`)] as const),
    ),
  );

  const items: PanoramicaItem[] = voci.map((voce) => {
    const sezioneTitolo = sezioneBySlug(voce.sezione_slug)?.titolo ?? voce.sezione_slug;
    const dati = datiPerSezione.get(voce.sezione_slug);

    if (voce.campo) {
      const singleton = !Array.isArray(dati) ? (dati as Record<string, unknown> | null) : null;
      return {
        id: voce.id,
        modulo: voce.modulo,
        sezioneSlug: voce.sezione_slug,
        sezioneTitolo,
        titolo: voce.etichetta,
        sottotitolo: formatValoreGenerico(singleton?.[voce.campo]),
        campo: voce.campo,
        recordId: null,
        disponibile: true,
      };
    }

    const elenco = Array.isArray(dati) ? (dati as Record<string, unknown>[]) : [];
    const record = elenco.find((r) => r.id === voce.record_id);

    if (!record) {
      return {
        id: voce.id,
        modulo: voce.modulo,
        sezioneSlug: voce.sezione_slug,
        sezioneTitolo,
        titolo: voce.etichetta,
        sottotitolo: "",
        campo: null,
        recordId: voce.record_id,
        disponibile: false,
      };
    }

    const { titolo, sottotitolo } = anteprimaRecord(voce.sezione_slug, record);
    return {
      id: voce.id,
      modulo: voce.modulo,
      sezioneSlug: voce.sezione_slug,
      sezioneTitolo,
      titolo,
      sottotitolo,
      campo: null,
      recordId: voce.record_id,
      disponibile: true,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={LayoutDashboardIcon}
        title="Panoramica"
        subtitle="Le voci che hai scelto di tenere sott'occhio, raccolte da tutte le sezioni. Trascinale per riordinarle. Sola lettura: per modificarle vai alla sezione di origine."
      />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nessuna voce ancora selezionata. Apri una sezione e clicca l&apos;icona a forma di spillo accanto a un
          campo (o a una riga di un elenco) per aggiungerlo qui.
        </p>
      ) : (
        <PanoramicaLista modulo={MODULO_ANAGRAFICA} iniziali={items} />
      )}
    </div>
  );
}
