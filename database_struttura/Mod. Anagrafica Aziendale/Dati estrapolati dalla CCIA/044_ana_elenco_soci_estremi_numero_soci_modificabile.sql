
-- =======================================================================
-- "NUMERO DEI SOCI" DIVENTA UNA CAPIENZA MODIFICABILE (§ come "Numero
-- componenti" dell'organo amministrativo)
-- =======================================================================
--
-- Richiesta esplicita dell'utente (31/08/2026): "Numero dei soci" deve
-- comportarsi esattamente come "Numero componenti" di
-- ana_amministrazione_controllo.numero_amministratori_in_carica (migrazione
-- 007) — una capienza dichiarata, sincronizzata con la tabella dei soci
-- (si aggiorna da sola quando si aggiunge/elimina una riga, mai oltre la
-- capienza già prevista) ma modificabile a mano e scritta subito, mai
-- tramite il PATCH generico/"Salva modifiche" della sezione.
--
-- Questo sostituisce esplicitamente, solo per questo campo, la decisione
-- del 27/08/2026 (migrazione 035) di tenerlo un puro conteggio calcolato
-- senza colonna propria "per non poter mai disallinearsi dalla tabella
-- soci": qui il disallineamento resta impossibile per costruzione (la
-- sincronizzazione lato backend, non l'assenza di una colonna, lo
-- impedisce — vedi app/core/incarichi.py::sincronizza_numero_soci_dopo_
-- aggiunta/_eliminazione/imposta_numero_soci), esattamente come già
-- avviene per l'organo amministrativo.
--
-- Aggiunge a ana_elenco_soci_estremi (migrazione 030, già applicata, non
-- più modificabile per convenzione CLAUDE.md) la colonna numero_soci:
-- stesso nome della chiave del campo in registro_campi.py — nessun
-- `campi_derivati` per questa chiave, il valore letto è direttamente
-- questa colonna (vedi app/core/registro_campi.py::SEZIONE_ELENCO_SOCI_
-- ESTREMI, `derived=True` qui serve solo a escluderla dal PATCH generico,
-- non a calcolarla da una formula — stesso significato già in uso per
-- numero_amministratori_in_carica).
--
-- Nessun dato esistente viene toccato o rimosso.

ALTER TABLE ana_elenco_soci_estremi
    ADD COLUMN IF NOT EXISTS numero_soci INTEGER;

COMMENT ON COLUMN ana_elenco_soci_estremi.numero_soci IS
    'Numero dei soci dichiarato: capienza sincronizzata con gli incarichi ruolo SOCIO (aggiunta/eliminazione riga la aggiornano da sola), ma modificabile a mano e scritta subito tramite un endpoint dedicato — mai tramite il PATCH generico della sezione (vedi app/core/incarichi.py::imposta_numero_soci).';
