/*
===============================================================================
 MIGRAZIONE 054 - VISTA: CRONOLOGIA AGGIORNAMENTI E PROTOCOLLI (CORREZIONE 24)
===============================================================================

 Scopo
 -----
 Correzione 24 §7: riunisce automaticamente le fonti della tabella
 "Cronologia aggiornamenti e protocolli" (card "Aggiornamento impresa") in
 un'unica vista, senza duplicare eventi in una tabella scritta a mano (§
 "la cronologia non deve essere una tabella compilata manualmente").

 Fonti unite (§7, "eventuali variazioni societarie rilevanti" = trasferimenti
 di quote + variazioni di sede legale):
   1. ana_pratiche_camerali                    -> evento "PRATICA_CAMERALE"
   2. sys_importazioni_visure_cciaa (import)    -> evento "IMPORTAZIONE_VISURA"
   3. sys_importazioni_visure_cciaa (conferma)  -> evento "CONFERMA_VISURA"
      (solo quando confermata_at non è nullo: due righe distinte della
      stessa importazione, mai una sola data accorpata, § testo esplicito)
   4. ana_variazioni_sede_legale                -> evento "VARIAZIONE_SEDE"
   5. ana_trasferimenti_quote                   -> evento "TRASFERIMENTO_QUOTE"

 "Partecipazioni" (§2) alimenta solo l'indicatore riepilogativo, non la
 cronologia: nessuna riga qui.

 `evento_id` è sempre uno UUID reale (mai una chiave composta testuale):
 per l'evento "conferma", derivato deterministicamente dall'id
 dell'importazione con `md5(id || '-conferma')::uuid` (Postgres accetta un
 digest esadecimale a 32 caratteri come uuid), cosí resta compatibile senza
 modifiche con `app.core.verifica_riga` (chiave "per riga" = uuid) e resta
 stabile a ogni rilettura della vista. Il separatore è un trattino, mai un
 carattere due punti seguito da lettere: `alembic.op.execute` passa il
 testo della migrazione attraverso `sqlalchemy.text()`, che interpreta
 "due punti più una parola" come segnaposto di parametro anche dentro un
 commento o un letterale SQL, non solo nel codice eseguibile — un simile
 segnaposto letterale romperebbe l'esecuzione della migrazione (§ errore
 osservato e corretto in questa stessa migrazione).

 Lo stato di conferma del consulente (colonna "Stato", § punto 6 — "non
 deve duplicare l'esito") NON è qui: viene risolto in `app.core.
 aggiornamento_impresa` con lo stesso motore generico
 `app.core.verifica_riga`, chiave `evento_id`, invece di un secondo
 meccanismo o un JOIN che ne ripeterebbe la logica.

 CREATE OR REPLACE VIEW è già idempotente.
===============================================================================
*/

BEGIN;

CREATE OR REPLACE VIEW vw_ana_cronologia_aggiornamenti_impresa AS

SELECT
    p.id                                                AS evento_id,
    p.azienda_id                                        AS azienda_id,
    'PRATICA_CAMERALE'::text                             AS tipologia,
    COALESCE(p.data_protocollo, p.data_presentazione)    AS data,
    COALESCE(co.denominazione, 'Registro Imprese')       AS origine,
    ce.denominazione                                     AS esito,
    'ana_pratiche_camerali'::text                        AS tabella_origine,
    p.id                                                 AS record_origine_id,
    p.created_at                                         AS created_at
FROM ana_pratiche_camerali p
LEFT JOIN cat_origini_aggiornamento_impresa co ON co.id = p.origine_id
LEFT JOIN cat_esiti_pratiche_camerali ce ON ce.id = p.esito_id

UNION ALL

SELECT
    i.id                                                 AS evento_id,
    i.azienda_id                                         AS azienda_id,
    'IMPORTAZIONE_VISURA'::text                          AS tipologia,
    i.data_importazione::date                            AS data,
    COALESCE(
        'Visura estratta il ' || to_char(i.data_estrazione_visura, 'DD/MM/YYYY'),
        'Visura camerale'
    )                                                     AS origine,
    si.denominazione                                     AS esito,
    'sys_importazioni_visure_cciaa'::text                AS tabella_origine,
    i.id                                                  AS record_origine_id,
    i.created_at                                          AS created_at
FROM sys_importazioni_visure_cciaa i
LEFT JOIN cat_stati_importazione_visure si ON si.id = i.stato_importazione_id

UNION ALL

SELECT
    md5(i.id::text || '-conferma')::uuid                 AS evento_id,
    i.azienda_id                                         AS azienda_id,
    'CONFERMA_VISURA'::text                              AS tipologia,
    i.confermata_at::date                                AS data,
    'Aggiornamento del consulente'::text                 AS origine,
    'Completato e confermato'::text                      AS esito,
    'sys_importazioni_visure_cciaa'::text                AS tabella_origine,
    i.id                                                  AS record_origine_id,
    i.confermata_at                                       AS created_at
FROM sys_importazioni_visure_cciaa i
WHERE i.confermata_at IS NOT NULL

UNION ALL

SELECT
    v.id                                                 AS evento_id,
    v.azienda_id                                         AS azienda_id,
    'VARIAZIONE_SEDE'::text                              AS tipologia,
    v.data_variazione                                    AS data,
    COALESCE(cov.denominazione, 'Registro Imprese')      AS origine,
    cev.denominazione                                    AS esito,
    'ana_variazioni_sede_legale'::text                   AS tabella_origine,
    v.id                                                  AS record_origine_id,
    v.created_at                                          AS created_at
FROM ana_variazioni_sede_legale v
LEFT JOIN cat_origini_aggiornamento_impresa cov ON cov.id = v.origine_id
LEFT JOIN cat_esiti_pratiche_camerali cev ON cev.id = v.esito_id

UNION ALL

SELECT
    t.id                                                 AS evento_id,
    t.azienda_id                                         AS azienda_id,
    'TRASFERIMENTO_QUOTE'::text                          AS tipologia,
    t.data_trasferimento                                 AS data,
    COALESCE(cot.denominazione, 'Registro Imprese')      AS origine,
    cet.denominazione                                    AS esito,
    'ana_trasferimenti_quote'::text                      AS tabella_origine,
    t.id                                                  AS record_origine_id,
    t.created_at                                          AS created_at
FROM ana_trasferimenti_quote t
LEFT JOIN cat_origini_aggiornamento_impresa cot ON cot.id = t.origine_id
LEFT JOIN cat_esiti_pratiche_camerali cet ON cet.id = t.esito_id
;

COMMENT ON VIEW vw_ana_cronologia_aggiornamenti_impresa IS
    'Cronologia unificata degli eventi di "Aggiornamento impresa" (Correzione 24 §7): pratiche camerali, importazioni/conferme di visure, variazioni di sede legale, trasferimenti di quote.';

COMMIT;
