"""Unit test delle invarianti pure del registro campo-per-campo (§7.2/§9.2/
§21 "Unit test" della specifica Anagrafica Aziendale). Copre solo funzioni e
strutture dati senza dipendenza da un database: `is_empty`, `valida_campo`,
la forma dei cataloghi di sezione e `stato_completamento`. La logica
transazionale (salvataggio, verifica, visibilità) richiede una sessione
Postgres reale e non è coperta qui: vedi il piano di verifica manuale nel
report di consegna.
"""

from app.core.registro_campi import (
    SEZIONE_AMMINISTRAZIONE_CONTROLLO,
    SEZIONE_CAPITALE_SOCIALE,
    SEZIONE_DURATA_SOCIETA_ESERCIZI,
    SEZIONE_ELENCO_SOCI_ESTREMI,
    SEZIONE_INFORMAZIONI_SOCIETARIE,
    SEZIONE_SEDE,
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
    def test_sei_sezioni_registrate(self):
        assert set(SEZIONI) == {
            "informazioni-societarie",
            "capitale-sociale",
            "durata-societa-esercizi",
            "amministrazione-controllo",
            "elenco-soci-estremi",
            "sede",
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
        indice = _indice(SEZIONE_AMMINISTRAZIONE_CONTROLLO)
        assert indice.chiavi == {
            "organo_amministrativo_in_carica",
            "durata_in_carica_organo",
            "numero_minimo_amministratori",
            "numero_amministratori_in_carica",
            "numero_sindaci_organi_controllo",
            "numero_titolari_cariche",
        }

    def test_catalogo_elenco_soci_estremi(self):
        indice = _indice(SEZIONE_ELENCO_SOCI_ESTREMI)
        assert indice.chiavi == {
            "data_riferimento",
            "data_atto",
            "data_deposito",
            "data_protocollo",
            "numero_protocollo",
            "capitale_sociale_dichiarato",
        }
        assert indice.derivate == set()

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

    def test_totale_applicabile_su_tutte_le_sezioni(self):
        # Stessa somma che `valuta_qualita`/`riepilogo_sezioni` usano per
        # `totalApplicable` (22 + 4 + 3 + 6 + 6 + 12, l'ultimo per "sede",
        # pilota su ana_sede_rev2): un cambiamento qui e' un promemoria per
        # aggiornare quel numero consapevolmente.
        assert sum(len(_indice(s).chiavi) for s in SEZIONI.values()) == 53


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
        completa = AnaAmministrazioneControllo(organo_amministrativo_in_carica="Amministratore unico")
        assert stato_completamento(SEZIONE_AMMINISTRAZIONE_CONTROLLO, completa) == "COMPLETE"

        in_corso = AnaAmministrazioneControllo(organo_amministrativo_in_carica=None, numero_amministratori_in_carica=1)
        assert stato_completamento(SEZIONE_AMMINISTRAZIONE_CONTROLLO, in_corso) == "IN_PROGRESS"
