"""Unit test delle invarianti pure del registro campo-per-campo (§7.2/§9.2/
§21 "Unit test" della specifica Anagrafica Aziendale). Copre solo funzioni e
strutture dati senza dipendenza da un database: `is_empty`, `valida_campo`,
la forma dei cataloghi di sezione e `stato_completamento`. La logica
transazionale (salvataggio, verifica, visibilità) richiede una sessione
Postgres reale e non è coperta qui: vedi il piano di verifica manuale nel
report di consegna.
"""

from uuid import uuid4

from app.core.registro_campi import (
    SEZIONE_AMMINISTRAZIONE_CONTROLLO,
    SEZIONE_ATTIVITA_ECONOMICA,
    SEZIONE_CAPITALE_SOCIALE,
    SEZIONE_DURATA_SOCIETA_ESERCIZI,
    SEZIONE_ELENCO_SOCI_ESTREMI,
    SEZIONE_INFORMAZIONI_SOCIETARIE,
    SEZIONE_ORGANI_CONTROLLO,
    SEZIONE_SEDE,
    SEZIONE_STATUTO,
    SEZIONE_UNITA_LOCALI,
    SEZIONI,
    _indice,
    is_empty,
    stato_completamento,
    valida_campo,
)
from app.models.anagrafica import (
    AnaAmministrazioneControllo,
    AnaCapitaleSociale,
    AnaDurataSocietaEsercizi,
    AnaIdentificazioneCamerale,
    AnaOrganiControllo,
    AnaUnitaLocaliRiepilogo,
)


class TestIsEmpty:
    def test_none_e_vuoto(self):
        assert is_empty(None) is True

    def test_stringa_vuota_e_vuota(self):
        assert is_empty("") is True

    def test_soli_spazi_e_vuoto(self):
        assert is_empty("   ") is True

    def test_valore_valorizzato_non_e_vuoto(self):
        assert is_empty("Prova Srl") is False

    def test_zero_come_stringa_non_e_vuoto(self):
        # A differenza del numero 0/booleano false della specifica generale
        # (§7.2), qui tutti i campi sono testuali/data: "0" come stringa e'
        # un valore inserito dall'utente, non deve sparire.
        assert is_empty("0") is False


class TestCatalogoInformazioniSocietarie:
    def test_gruppi(self):
        # Migrazioni 0025-0031 (mappatura CCIAA, decisioni D-E2/D-M/D-P):
        # aggiunti "trasferimento-provincia", "impresa-in-cifre" e
        # "attivita-sintesi" (quest'ultimo solo il derivato codice_nace) ai
        # 3 gruppi originali del catalogo finale PARTE II §28.1.
        assert [g.key for g in SEZIONE_INFORMAZIONI_SOCIETARIE.gruppi] == [
            "identificazione-camerale",
            "iscrizione-registro-imprese",
            "date",
            "trasferimento-provincia",
            "impresa-in-cifre",
            "attivita-sintesi",
        ]

    def test_ventidue_campi_totali(self):
        # 14 del catalogo finale + 3 (trasferimento provincia) + 4 (impresa
        # in cifre) + 1 (codice_nace derivato) = 22.
        assert len(_indice(SEZIONE_INFORMAZIONI_SOCIETARIE).chiavi) == 22

    def test_composizione_gruppi(self):
        per_gruppo = {g.key: [c.key for c in g.campi] for g in SEZIONE_INFORMAZIONI_SOCIETARIE.gruppi}
        assert per_gruppo["identificazione-camerale"] == [
            "ragione_sociale",
            "forma_giuridica",
            "codice_fiscale",
            "partita_iva",
        ]
        assert per_gruppo["iscrizione-registro-imprese"] == [
            "numero_rea",
            "numero_iscrizione",
            "provincia_rea",
            "data_iscrizione",
            "sede_legale",
            "stato_attivita",
        ]
        assert per_gruppo["date"] == [
            "data_atto_costitutivo",
            "termine_esercizio",
            "inizio_esercizio",
            "data_ultimo_bilancio_approvato",
        ]

    def test_campi_derivati(self):
        # "Sede legale" (da ana_sedi) e "Codice NACE" (dalla riga ATECO
        # prevalente/più recente, decisione D-P): entrambi leggibili ma non
        # scrivibili da questa sezione.
        indice = _indice(SEZIONE_INFORMAZIONI_SOCIETARIE)
        assert indice.derivate == {"sede_legale", "codice_nace"}
        assert indice.scrivibili == indice.chiavi - {"sede_legale", "codice_nace"}

    def test_etichette_catalogo_finale(self):
        # Campione delle etichette normative §28.1 (non l'intero catalogo,
        # solo quelle rinominate rispetto alla prima versione del pilota).
        label = _indice(SEZIONE_INFORMAZIONI_SOCIETARIE).label
        assert label["stato_attivita"] == "Stato impresa"
        assert label["data_atto_costitutivo"] == "Data costituzione"
        assert label["sede_legale"] == "Sede legale"

    def test_tipi_giorno_mese(self):
        tipo = _indice(SEZIONE_INFORMAZIONI_SOCIETARIE).tipo
        assert tipo["termine_esercizio"] == "day-month"
        assert tipo["inizio_esercizio"] == "day-month"


class TestSezioniRegistrate:
    def test_dieci_sezioni_registrate(self):
        assert set(SEZIONI) == {
            "informazioni-societarie",
            "capitale-sociale",
            "durata-societa-esercizi",
            "amministrazione-controllo",
            "organi-controllo",
            "elenco-soci-estremi",
            "sede",
            "statuto",
            "attivita-economica",
            "unita-locali",
        }

    def test_ogni_sezione_indicizza_se_stessa(self):
        for chiave, sezione in SEZIONI.items():
            assert sezione.section_key == chiave

    def test_catalogo_capitale_sociale(self):
        indice = _indice(SEZIONE_CAPITALE_SOCIALE)
        assert indice.chiavi == {"valuta", "capitale_deliberato", "capitale_sottoscritto", "capitale_versato"}
        assert indice.derivate == set()

    def test_catalogo_durata_societa_esercizi(self):
        indice = _indice(SEZIONE_DURATA_SOCIETA_ESERCIZI)
        assert indice.chiavi == {"data_termine_societa", "scadenza_primo_esercizio", "scadenza_esercizi_successivi"}

    def test_catalogo_amministrazione_controllo(self):
        # Correzione 05: campi della configurazione "Amministratore unico"
        # (numero componenti calcolato, durata in carica a catalogo con i
        # due condizionali, regime di rappresentanza). Correzione 06:
        # "numero_amministratori_in_carica" rivendicato per "Numero
        # componenti" del Consiglio di amministrazione (stesso campo,
        # nessuna chiave nuova) più due campi propri (modalità delle
        # decisioni, deleghe). Correzione 07: un campo proprio in più
        # (modalità di esercizio dei poteri) per l'Amministrazione
        # pluripersonale congiuntiva, "numero_amministratori_in_carica" e
        # durata_carica_tipo/regime_rappresentanza riusati (nessuna chiave
        # nuova per questi tre). Correzione 08: ultima configurazione
        # dell'organo, "Amministrazione pluripersonale disgiuntiva" — riusa
        # "numero_amministratori_in_carica", durata_carica_tipo/
        # regime_rappresentanza e "modalita_esercizio_poteri" (nessuna
        # chiave nuova per questi quattro), un solo campo proprio in più
        # (gestione dell'opposizione).
        indice = _indice(SEZIONE_AMMINISTRAZIONE_CONTROLLO)
        assert indice.chiavi == {
            "organo_amministrativo_in_carica",
            "numero_componenti_organo",
            "durata_in_carica_organo",
            "durata_carica_tipo",
            "numero_minimo_amministratori",
            "regime_rappresentanza",
            "durata_carica_numero_esercizi",
            "durata_carica_data_scadenza",
            "modalita_decisioni_consiglio",
            "deleghe_consiglio",
            "modalita_esercizio_poteri",
            "gestione_opposizione",
            "numero_amministratori_in_carica",
            "numero_sindaci_organi_controllo",
            "numero_titolari_cariche",
        }
        # "Numero componenti" è calcolato (mai un inserimento manuale, §
        # punto 4): esplicitamente derivato ed escluso dai campi scrivibili.
        assert "numero_componenti_organo" in indice.derivate
        assert "numero_componenti_organo" not in indice.scrivibili
        # § Correzione 06 punto 4: "Numero componenti" del Consiglio deve
        # accettare solo interi positivi (>= 1), a differenza degli altri
        # campi numerici della sezione (>= 0 di default).
        assert indice.minimi.get("numero_amministratori_in_carica") == 1
        assert "numero_titolari_cariche" not in indice.minimi

    def test_catalogo_organi_controllo(self):
        # Correzione 11: campo principale "assetto_controllo_in_carica" (a
        # catalogo, cat_assetti_controllo) più "numero_componenti" (per le
        # configurazioni non ancora definite) e "titolo_nomina" (a
        # catalogo, condiviso da tutte le configurazioni con un organo).
        # Correzione 13: prima configurazione definita, "Sindaco unico" —
        # "numero_componenti_organo" (derivato, sincronizzato con la
        # tabella) rimpiazza "numero_componenti" per questo assetto, più
        # "funzioni_organo_interno"/"revisione_legale_affidata_a" (a
        # catalogo) e "durata_incarico_tipo" (a catalogo) con i suoi due
        # campi condizionali "durata_incarico_data_bilancio"/
        # "durata_incarico_descrizione".
        # Correzione 14: seconda configurazione definita, "Collegio
        # sindacale" — "numero_componenti_collegio" (derivato) rimpiazza
        # "numero_componenti" per questo assetto, "sindaci_effettivi" (a
        # scelta fissa, non catalogo) e "sindaci_supplenti" (derivato,
        # costante) sono propri; funzioni/revisione/durata sono condivisi
        # con "Sindaco unico" (nessuna chiave nuova per quei tre).
        # Correzione 15: terza configurazione definita, "Revisore legale
        # persona fisica" — "numero_componenti_revisore" (derivato,
        # sincronizzato con la tabella come "Sindaco unico") rimpiazza
        # "numero_componenti" per questo assetto; "Funzioni dell'organo
        # interno" resta condizionato solo a Sindaco unico/Collegio
        # sindacale (nessun organo interno qui), mentre
        # "revisione_legale_affidata_a"/"durata_incarico_tipo" si estendono
        # anche a questo assetto (nessuna chiave nuova per quei due).
        # Correzione 16: quarta configurazione definita, "Società di
        # revisione legale" — stesso identico schema di "Revisore legale
        # persona fisica", "numero_componenti_societa" (derivato, per il
        # titolare persona giuridica) è l'unica chiave propria.
        # Correzione 17: quinta configurazione definita, "Sindaco unico +
        # revisore esterno" — "numero_componenti_sindaco_revisore"
        # (derivato, costante "2") è l'unica chiave propria; "Funzioni
        # dell'organo interno" torna ad applicarsi (organo interno presente,
        # a differenza di Revisore legale persona fisica/Società di
        # revisione legale) e "revisione_legale_affidata_a"/
        # "durata_incarico_tipo" si estendono anche a questo assetto
        # (nessuna chiave nuova per quei tre).
        # Correzione 18: sesta configurazione definita, "Collegio sindacale
        # + revisore esterno" — "numero_componenti_collegio_revisore"
        # (derivato, sindaci_effettivi + 3) è l'unica chiave propria;
        # "sindaci_effettivi"/"sindaci_supplenti" si estendono anche a
        # questo assetto (nessuna chiave nuova, stesso campo di Correzione
        # 14).
        indice = _indice(SEZIONE_ORGANI_CONTROLLO)
        assert indice.chiavi == {
            "assetto_controllo_in_carica",
            "numero_componenti_organo",
            "numero_componenti_collegio",
            "numero_componenti_revisore",
            "numero_componenti_societa",
            "numero_componenti_sindaco_revisore",
            "numero_componenti_collegio_revisore",
            "numero_componenti",
            "sindaci_effettivi",
            "sindaci_supplenti",
            "funzioni_organo_interno",
            "revisione_legale_affidata_a",
            "titolo_nomina",
            "durata_incarico_tipo",
            "durata_incarico_data_bilancio",
            "durata_incarico_descrizione",
        }
        assert indice.derivate == {
            "numero_componenti_organo",
            "numero_componenti_collegio",
            "sindaci_supplenti",
            "numero_componenti_revisore",
            "numero_componenti_societa",
            "numero_componenti_sindaco_revisore",
            "numero_componenti_collegio_revisore",
        }
        # § Correzione 13/14/15/16/17/18 punto esplicito: "Numero
        # componenti" non è modificabile in nessuna delle sei configurazioni
        # definite, né lo è "Sindaci supplenti" (sempre 2, per definizione).
        assert "numero_componenti_organo" not in indice.scrivibili
        assert "numero_componenti_collegio" not in indice.scrivibili
        assert "numero_componenti_revisore" not in indice.scrivibili
        assert "numero_componenti_societa" not in indice.scrivibili
        assert "numero_componenti_sindaco_revisore" not in indice.scrivibili
        assert "numero_componenti_collegio_revisore" not in indice.scrivibili
        assert "sindaci_supplenti" not in indice.scrivibili
        # § Correzione 14: "Sindaci effettivi" è a scelta fissa (3 o 5), non
        # un catalogo — verificato sia il tipo che le opzioni esatte.
        assert indice.tipo["sindaci_effettivi"] == "scelta"
        assert indice.opzioni_fisse["sindaci_effettivi"] == (("3", "3"), ("5", "5"))
        assert "sindaci_effettivi" in indice.scrivibili

    def test_catalogo_elenco_soci_estremi(self):
        indice = _indice(SEZIONE_ELENCO_SOCI_ESTREMI)
        assert indice.chiavi == {
            "numero_soci",
            "data_riferimento",
            "data_deposito",
            "numero_protocollo",
            "capitale_sociale_dichiarato",
        }
        assert indice.derivate == {"numero_soci", "capitale_sociale_dichiarato"}

    def test_catalogo_sede(self):
        indice = _indice(SEZIONE_SEDE)
        assert indice.chiavi == {
            "indirizzo_sede_legale",
            "comune",
            "provincia",
            "cap",
            "nazione",
            "pec",
            "partita_iva",
            "codice_fiscale",
            "numero_rea",
            "camera_commercio_competente",
            "provincia_provenienza",
            "numero_rea_precedente",
        }
        assert indice.derivate == set()

    def test_catalogo_statuto(self):
        indice = _indice(SEZIONE_STATUTO)
        assert indice.chiavi == {
            "denominazione",
            "registro_imprese",
            "data_iscrizione",
            "forma_giuridica",
            "data_atto_costitutivo",
            "data_termine_societa",
            "scadenza_primo_esercizio",
            "scadenza_esercizi_successivi",
            "giorni_proroga_approvazione_bilancio",
            "sistema_amministrazione_adottato",
            "controllo_contabile",
            "organi_amministrativi_previsti",
        }
        assert indice.derivate == set()

    def test_catalogo_attivita_economica(self):
        # Correzione 19 (prima parte, card "Attività, albi, ruoli e
        # licenze"): sezione singleton "Attività economica", estende
        # ana_attivita_esercitata (migrazione 004) invece di una nuova
        # tabella — vedi commento sopra SEZIONE_ATTIVITA_ECONOMICA. I tre
        # campi ATECO/ATECORI/NACE e "stato_attivita" sono a catalogo
        # (ciascuno con il proprio catalogo dedicato, tutti vuoti finché non
        # popolati da un import/analisi separati); i quattro campi
        # booleani sono tri-stato Sì/No/Non indicato.
        indice = _indice(SEZIONE_ATTIVITA_ECONOMICA)
        assert indice.chiavi == {
            "stato_attivita",
            "data_decorrenza_attivita",
            "descrizione_attivita_esercitata",
            "attivita_sede_legale",
            "data_inizio_attivita_sede",
            "codice_ateco_2025",
            "codice_atecori",
            "codice_nace_2_1",
            "presenza_attivita_import_export",
            "contratto_rete",
            "albi_ruoli_licenze_presenti",
            "registri_ambientali_presenti",
        }
        assert indice.derivate == set()
        assert indice.tipo["stato_attivita"] == "catalogo"
        assert indice.tipo["codice_ateco_2025"] == "catalogo"
        assert indice.tipo["presenza_attivita_import_export"] == "boolean"
        assert indice.tipo["contratto_rete"] == "boolean"
        assert indice.tipo["albi_ruoli_licenze_presenti"] == "boolean"
        assert indice.tipo["registri_ambientali_presenti"] == "boolean"

    def test_catalogo_unita_locali(self):
        # Correzione 23 (card "Sedi secondarie e unità locali"): sezione
        # singleton di un solo campo scrivibile (numero dichiarato in
        # visura) più un campo derivato (numero effettivo, mai salvato,
        # calcolato da `_numero_unita_locali_effettivo`) — la tabella delle
        # righe vive fuori dal motore campo-per-campo, in
        # `app.core.unita_locali`.
        indice = _indice(SEZIONE_UNITA_LOCALI)
        assert indice.chiavi == {"numero_unita_locali_dichiarato", "numero_unita_locali"}
        assert indice.derivate == {"numero_unita_locali"}
        assert indice.scrivibili == {"numero_unita_locali_dichiarato"}
        assert indice.tipo["numero_unita_locali_dichiarato"] == "number"
        assert indice.tipo["numero_unita_locali"] == "number"

    def test_totale_applicabile_su_tutte_le_sezioni(self):
        # Stessa somma che `valuta_qualita`/`riepilogo_sezioni` usano per
        # `totalApplicable` (22 + 4 + 3 + 15 + 14 + 5 + 12 + 12, il quarto per
        # "amministrazione-controllo": 6 campi originari, 11 dopo la
        # correzione 05 ("Amministratore unico"), 13 dopo la correzione 06
        # ("Consiglio di amministrazione", +2 campi propri), 14 dopo la
        # correzione 07 ("Amministrazione pluripersonale congiuntiva", +1
        # campo proprio), 15 dopo la correzione 08 ("Amministrazione
        # pluripersonale disgiuntiva", +1 campo proprio, ultima
        # configurazione dell'organo), il quinto per "organi-controllo"
        # (Correzione 11: 3 campi, Correzione 13 "Sindaco unico": +6 campi
        # propri = 9, Correzione 14 "Collegio sindacale": +3 campi propri
        # "numero_componenti_collegio"/"sindaci_effettivi"/
        # "sindaci_supplenti" = 12, Correzione 15 "Revisore legale persona
        # fisica": +1 campo proprio "numero_componenti_revisore" = 13,
        # Correzione 16 "Società di revisione legale": +1 campo proprio
        # "numero_componenti_societa" = 14, Correzione 17 "Sindaco unico +
        # revisore esterno": +1 campo proprio
        # "numero_componenti_sindaco_revisore" = 15, Correzione 18
        # "Collegio sindacale + revisore esterno": +1 campo proprio
        # "numero_componenti_collegio_revisore" = 16), il penultimo per
        # "elenco-soci-estremi" dopo la correzione 035, gli ultimi due per
        # "sede"/"statuto", pilota su ana_sede_rev2/ana_statuto_rev2, +12
        # per "attivita-economica" (Correzione 19, prima parte), +2 per
        # "unita-locali" (Correzione 23: 1 campo scrivibile + 1 derivato,
        # la tabella delle righe vive fuori dal motore campo-per-campo): un
        # cambiamento qui e' un promemoria per aggiornare quel numero
        # consapevolmente.
        assert sum(len(_indice(s).chiavi) for s in SEZIONI.values()) == 103


class TestValidaCampo:
    def test_valore_vuoto_sempre_valido(self):
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "partita_iva", None) is None
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "partita_iva", "") is None
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "partita_iva", "   ") is None

    def test_partita_iva_valida(self):
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "partita_iva", "12345678901") is None

    def test_partita_iva_invalida(self):
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "partita_iva", "123") is not None
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "partita_iva", "ABCDEFGHIJK") is not None

    def test_codice_fiscale_11_o_16(self):
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "codice_fiscale", "12345678901") is None
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "codice_fiscale", "RSSMRA85M01H501U") is None
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "codice_fiscale", "CORTO") is not None

    def test_date_iso_valide_e_invalide(self):
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "data_iscrizione", "2020-01-31") is None
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "data_iscrizione", "31/01/2020") is not None
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "data_ultimo_bilancio_approvato", "non-una-data") is not None

    def test_giorno_mese_valido(self):
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "termine_esercizio", "31/12") is None
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "inizio_esercizio", "01/01") is None
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "termine_esercizio", "29/02") is None  # formato, non validita' calendario

    def test_giorno_mese_invalido(self):
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "termine_esercizio", "32/12") is not None
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "termine_esercizio", "12/31") is not None
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "inizio_esercizio", "1/1") is not None

    def test_campo_senza_regola_specifica_sempre_valido_se_non_vuoto(self):
        assert valida_campo(SEZIONE_INFORMAZIONI_SOCIETARIE, "numero_iscrizione", "qualsiasi valore") is None

    def test_importo_valido_e_negativo(self):
        assert valida_campo(SEZIONE_CAPITALE_SOCIALE, "capitale_deliberato", "10000.00") is None
        assert valida_campo(SEZIONE_CAPITALE_SOCIALE, "capitale_deliberato", "-1") is not None
        assert valida_campo(SEZIONE_CAPITALE_SOCIALE, "capitale_deliberato", "non-un-numero") is not None

    def test_valuta_iso_a_tre_lettere(self):
        assert valida_campo(SEZIONE_CAPITALE_SOCIALE, "valuta", "EUR") is None
        assert valida_campo(SEZIONE_CAPITALE_SOCIALE, "valuta", "eur") is not None
        assert valida_campo(SEZIONE_CAPITALE_SOCIALE, "valuta", "EURO") is not None

    def test_numero_intero_valido_e_negativo(self):
        assert valida_campo(SEZIONE_AMMINISTRAZIONE_CONTROLLO, "numero_amministratori_in_carica", "3") is None
        assert valida_campo(SEZIONE_AMMINISTRAZIONE_CONTROLLO, "numero_amministratori_in_carica", "-1") is not None
        assert valida_campo(SEZIONE_AMMINISTRAZIONE_CONTROLLO, "numero_amministratori_in_carica", "tre") is not None


class TestStatoCompletamento:
    def test_nessun_record_non_iniziata(self):
        assert stato_completamento(SEZIONE_INFORMAZIONI_SOCIETARIE, None) == "NOT_STARTED"

    def test_ragione_sociale_presente_completa(self):
        row = AnaIdentificazioneCamerale(ragione_sociale="Prova Srl")
        assert stato_completamento(SEZIONE_INFORMAZIONI_SOCIETARIE, row) == "COMPLETE"

    def test_solo_altri_campi_in_corso(self):
        row = AnaIdentificazioneCamerale(ragione_sociale=None, numero_rea="12345")
        assert stato_completamento(SEZIONE_INFORMAZIONI_SOCIETARIE, row) == "IN_PROGRESS"

    def test_record_vuoto_non_iniziata(self):
        row = AnaIdentificazioneCamerale()
        assert stato_completamento(SEZIONE_INFORMAZIONI_SOCIETARIE, row) == "NOT_STARTED"

    def test_sezione_senza_campo_guida_completa_se_qualcosa_e_compilato(self):
        # Capitale sociale non ha un campo guida unico (§ commento del
        # catalogo): un solo importo valorizzato basta per "COMPLETE",
        # stessa regola gia' applicata da page.tsx per questa sezione.
        row = AnaCapitaleSociale(capitale_deliberato=None, capitale_versato=10000)
        assert stato_completamento(SEZIONE_CAPITALE_SOCIALE, row) == "COMPLETE"

    def test_sezione_senza_campo_guida_vuota_non_iniziata(self):
        row = AnaCapitaleSociale()
        assert stato_completamento(SEZIONE_CAPITALE_SOCIALE, row) == "NOT_STARTED"

    def test_durata_societa_esercizi_completa_con_un_solo_campo(self):
        row = AnaDurataSocietaEsercizi(scadenza_esercizi_successivi="31/12")
        assert stato_completamento(SEZIONE_DURATA_SOCIETA_ESERCIZI, row) == "COMPLETE"

    def test_amministrazione_controllo_usa_organo_come_campo_guida(self):
        # Correzione 04: "organo_amministrativo_in_carica" è ora un campo a
        # catalogo, la colonna di dominio è la chiave esterna
        # `organo_amministrativo_id` (mai la denominazione come testo).
        completa = AnaAmministrazioneControllo(organo_amministrativo_id=uuid4())
        assert stato_completamento(SEZIONE_AMMINISTRAZIONE_CONTROLLO, completa) == "COMPLETE"

        # § richiesta esplicita (31/08/2026, seguito): "numero_amministratori_
        # in_carica" è ora `derived=True` (solo per escluderlo dal PATCH
        # generico della sezione, si scrive tramite un endpoint dedicato —
        # vedi il commento sulla sua `CampoDef`), quindi non conta più come
        # "campo scrivibile compilato" qui: usa un altro campo scrivibile
        # (`durata_in_carica_organo`) per lo stesso controllo generico.
        in_corso = AnaAmministrazioneControllo(organo_amministrativo_id=None, durata_in_carica_organo="a tempo indeterminato")
        assert stato_completamento(SEZIONE_AMMINISTRAZIONE_CONTROLLO, in_corso) == "IN_PROGRESS"

    def test_organi_controllo_usa_assetto_come_campo_guida(self):
        # Correzione 11: stesso meccanismo di "organo_amministrativo_in_carica"
        # (§ sopra), ma per il campo principale della sezione "Sindaci".
        completa = AnaOrganiControllo(assetto_controllo_id=uuid4())
        assert stato_completamento(SEZIONE_ORGANI_CONTROLLO, completa) == "COMPLETE"

        in_corso = AnaOrganiControllo(assetto_controllo_id=None, numero_componenti=3)
        assert stato_completamento(SEZIONE_ORGANI_CONTROLLO, in_corso) == "IN_PROGRESS"

    def test_unita_locali_usa_numero_dichiarato_come_campo_guida(self):
        # Correzione 23: unico campo scrivibile della sezione, quindi
        # IN_PROGRESS non è raggiungibile qui (non c'è un secondo campo
        # scrivibile da compilare senza quello guida) — stesso limite già
        # noto per "numero_amministratori_in_carica"/"numero_soci"
        # (§ commento sopra), qui però perché non esiste alcun altro campo,
        # non perché sia `derived=True`.
        completa = AnaUnitaLocaliRiepilogo(numero_unita_locali_dichiarato=3)
        assert stato_completamento(SEZIONE_UNITA_LOCALI, completa) == "COMPLETE"

        vuota = AnaUnitaLocaliRiepilogo(numero_unita_locali_dichiarato=None)
        assert stato_completamento(SEZIONE_UNITA_LOCALI, vuota) == "NOT_STARTED"
