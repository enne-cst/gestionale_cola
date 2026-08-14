"""Unit test delle invarianti pure del registro campo-per-campo (§7.2/§9.2/
§21 "Unit test" della specifica Anagrafica Aziendale). Copre solo funzioni e
strutture dati senza dipendenza da un database: `is_empty`, `valida_campo`,
la forma del catalogo finale (§28.1) e `stato_completamento`. La logica
transazionale (salvataggio, verifica, visibilità) richiede una sessione
Postgres reale e non è coperta qui: vedi il piano di verifica manuale nel
report di consegna.
"""

from app.core.registro_campi import (
    CAMPI_DERIVATI,
    CAMPO_LABEL,
    CAMPO_TIPO,
    CHIAVI_CAMPI,
    CHIAVI_CAMPI_SCRIVIBILI,
    GRUPPI_INFORMAZIONI_SOCIETARIE,
    is_empty,
    stato_completamento,
    valida_campo,
)
from app.models.anagrafica import AnaIdentificazioneCamerale


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


class TestCatalogo:
    def test_tre_gruppi(self):
        assert [g.key for g in GRUPPI_INFORMAZIONI_SOCIETARIE] == [
            "identificazione-camerale",
            "iscrizione-registro-imprese",
            "date",
        ]

    def test_quattordici_campi_totali(self):
        assert len(CHIAVI_CAMPI) == 14

    def test_composizione_gruppi(self):
        per_gruppo = {g.key: [c.key for c in g.campi] for g in GRUPPI_INFORMAZIONI_SOCIETARIE}
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

    def test_solo_sede_legale_e_derivato(self):
        assert CAMPI_DERIVATI == {"sede_legale"}
        assert "sede_legale" not in CHIAVI_CAMPI_SCRIVIBILI
        assert CHIAVI_CAMPI_SCRIVIBILI == CHIAVI_CAMPI - {"sede_legale"}

    def test_etichette_catalogo_finale(self):
        # Campione delle etichette normative §28.1 (non l'intero catalogo,
        # solo quelle rinominate rispetto alla prima versione del pilota).
        assert CAMPO_LABEL["stato_attivita"] == "Stato impresa"
        assert CAMPO_LABEL["data_atto_costitutivo"] == "Data costituzione"
        assert CAMPO_LABEL["sede_legale"] == "Sede legale"

    def test_tipi_giorno_mese(self):
        assert CAMPO_TIPO["termine_esercizio"] == "day-month"
        assert CAMPO_TIPO["inizio_esercizio"] == "day-month"


class TestValidaCampo:
    def test_valore_vuoto_sempre_valido(self):
        assert valida_campo("partita_iva", None) is None
        assert valida_campo("partita_iva", "") is None
        assert valida_campo("partita_iva", "   ") is None

    def test_partita_iva_valida(self):
        assert valida_campo("partita_iva", "12345678901") is None

    def test_partita_iva_invalida(self):
        assert valida_campo("partita_iva", "123") is not None
        assert valida_campo("partita_iva", "ABCDEFGHIJK") is not None

    def test_codice_fiscale_11_o_16(self):
        assert valida_campo("codice_fiscale", "12345678901") is None
        assert valida_campo("codice_fiscale", "RSSMRA85M01H501U") is None
        assert valida_campo("codice_fiscale", "CORTO") is not None

    def test_date_iso_valide_e_invalide(self):
        assert valida_campo("data_iscrizione", "2020-01-31") is None
        assert valida_campo("data_iscrizione", "31/01/2020") is not None
        assert valida_campo("data_ultimo_bilancio_approvato", "non-una-data") is not None

    def test_giorno_mese_valido(self):
        assert valida_campo("termine_esercizio", "31/12") is None
        assert valida_campo("inizio_esercizio", "01/01") is None
        assert valida_campo("termine_esercizio", "29/02") is None  # formato, non validita' calendario

    def test_giorno_mese_invalido(self):
        assert valida_campo("termine_esercizio", "32/12") is not None
        assert valida_campo("termine_esercizio", "12/31") is not None
        assert valida_campo("inizio_esercizio", "1/1") is not None

    def test_campo_senza_regola_specifica_sempre_valido_se_non_vuoto(self):
        assert valida_campo("numero_iscrizione", "qualsiasi valore") is None


class TestStatoCompletamento:
    def test_nessun_record_non_iniziata(self):
        assert stato_completamento(None) == "NOT_STARTED"

    def test_ragione_sociale_presente_completa(self):
        row = AnaIdentificazioneCamerale(ragione_sociale="Prova Srl")
        assert stato_completamento(row) == "COMPLETE"

    def test_solo_altri_campi_in_corso(self):
        row = AnaIdentificazioneCamerale(ragione_sociale=None, numero_rea="12345")
        assert stato_completamento(row) == "IN_PROGRESS"

    def test_record_vuoto_non_iniziata(self):
        row = AnaIdentificazioneCamerale()
        assert stato_completamento(row) == "NOT_STARTED"
