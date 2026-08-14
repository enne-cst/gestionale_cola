"""Modelli SQLAlchemy per le sezioni dell'Anagrafica Aziendale soggette
all'abbonamento ISO 9001 (documento di progetto, cap. 4.2.2 "Organizzazione,
Trend e Assicurazioni" e 4.2.3 "Altre informazioni").

Mappano le tabelle già create dalle migrazioni SQL in
`database_struttura/Mod. Anagrafica Aziendale/Sezioni ISO 9001/` (eseguite
dalla revisione Alembic 0008). Tenute separate da `app.models.anagrafica`
(le sezioni base, sempre visibili) per rendere immediato distinguere cosa è
sotto abbonamento da cosa non lo è.

I codici sezione (`sys_elementi.codice`) usati da `sezione=` nella
registrazione delle rotte (vedi `app/api/anagrafica.py`) sono elencati nel
commento di ciascuna classe."""

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, ForeignKeyConstraint, Integer, Numeric, SmallInteger, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _id_col() -> Mapped[uuid.UUID]:
    return mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


def _azienda_fk() -> Mapped[uuid.UUID]:
    return mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_aziende.id"))


# ===========================================================================
# Cataloghi (cat_stati_*, cat_frequenze_*): id, codice, denominazione,
# ordine_visualizzazione, attivo — nessun timestamp, popolati dalle stesse
# migrazioni SQL che creano la tabella operativa collegata.
# ===========================================================================


class _CatalogoBase:
    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(30), unique=True)
    denominazione: Mapped[str] = mapped_column(String(100))
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)


class CatStatoIscrizioneFondo(_CatalogoBase, Base):
    __tablename__ = "cat_stati_iscrizione_fondo"


class CatStatoOutsourcing(_CatalogoBase, Base):
    __tablename__ = "cat_stati_outsourcing"


class CatStatoSubappaltatori(_CatalogoBase, Base):
    __tablename__ = "cat_stati_subappaltatori"


class CatStatoFornitoriMateriali(_CatalogoBase, Base):
    __tablename__ = "cat_stati_fornitori_materiali"


class CatStatoLavoratoriAutonomi(_CatalogoBase, Base):
    __tablename__ = "cat_stati_lavoratori_autonomi"


class CatStatoAssicurazioni(_CatalogoBase, Base):
    __tablename__ = "cat_stati_assicurazioni"


class CatFrequenzaRinnovoAssicurazioni(_CatalogoBase, Base):
    __tablename__ = "cat_frequenze_rinnovo_assicurazioni"


class CatStatoProcedimentiLegali(_CatalogoBase, Base):
    __tablename__ = "cat_stati_procedimenti_legali"


# ===========================================================================
# Categoria Organizzazione
# ===========================================================================


# Sezione: ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO (singleton)
class AnaContrattoLavoro(Base):
    __tablename__ = "ana_contratti_lavoro"
    __table_args__ = (UniqueConstraint("azienda_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    ccnl_applicato: Mapped[str] = mapped_column(String(250))
    settore_ccnl: Mapped[str] = mapped_column(String(200))
    data_applicazione: Mapped[date]
    ccnl_precedente: Mapped[str | None] = mapped_column(String(250))
    note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# Sezione: ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI (singleton)
class AnaPosizioniAssicurativePrevidenziali(Base):
    __tablename__ = "ana_posizioni_assicurative_previdenziali"
    __table_args__ = (UniqueConstraint("azienda_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    numero_posizione_inps: Mapped[str] = mapped_column(String(50))
    sede_territoriale_inps: Mapped[str] = mapped_column(String(200))
    numero_posizione_inail: Mapped[str] = mapped_column(String(50))
    sede_territoriale_inail: Mapped[str] = mapped_column(String(200))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# Sezione: ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE (elenco)
class AnaFondoInterprofessionale(Base):
    __tablename__ = "ana_fondi_interprofessionali"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    fondo_interprofessionale: Mapped[str] = mapped_column(String(250))
    stato_iscrizione_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_stati_iscrizione_fondo.id")
    )
    data_adesione: Mapped[date]
    codice_fondo: Mapped[str | None] = mapped_column(String(100))
    data_recesso: Mapped[date | None]
    note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# Sezione: ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI (elenco, una riga per anno)
class AnaDatiGenerali(Base):
    __tablename__ = "ana_dati_generali"
    __table_args__ = (UniqueConstraint("azienda_id", "anno_riferimento"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    anno_riferimento: Mapped[int] = mapped_column(SmallInteger)

    numero_addetti: Mapped[int] = mapped_column(Integer)
    numero_dipendenti: Mapped[int] = mapped_column(Integer)
    numero_soci_lavoratori: Mapped[int] = mapped_column(Integer)
    organico_medio_annuo: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    eta_media: Mapped[Decimal] = mapped_column(Numeric(5, 2))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# Sezione: ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO (elenco, una riga per anno)
class AnaRipartizioneOrganico(Base):
    __tablename__ = "ana_ripartizione_organico"
    __table_args__ = (
        UniqueConstraint("azienda_id", "anno_riferimento"),
        ForeignKeyConstraint(
            ["azienda_id", "anno_riferimento"],
            ["ana_dati_generali.azienda_id", "ana_dati_generali.anno_riferimento"],
        ),
    )

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True))
    anno_riferimento: Mapped[int] = mapped_column(SmallInteger)

    numero_amministrativi: Mapped[int] = mapped_column(Integer)
    numero_project_manager: Mapped[int] = mapped_column(Integer)
    numero_tecnici: Mapped[int] = mapped_column(Integer)
    numero_preposti: Mapped[int] = mapped_column(Integer)
    numero_operativi: Mapped[int] = mapped_column(Integer)
    numero_dirigenti_sicurezza: Mapped[int] = mapped_column(Integer)
    numero_uomini: Mapped[int] = mapped_column(Integer)
    numero_donne: Mapped[int] = mapped_column(Integer)
    numero_italiani: Mapped[int] = mapped_column(Integer)
    numero_stranieri: Mapped[int] = mapped_column(Integer)
    numero_tempo_determinato: Mapped[int] = mapped_column(Integer)
    numero_tempo_indeterminato: Mapped[int] = mapped_column(Integer)
    numero_laureati: Mapped[int] = mapped_column(Integer)
    numero_diplomati: Mapped[int] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# Vista di sola lettura con le 14 percentuali calcolate (vw_ana_ripartizione_organico).
# Usata solo come `read_model=` nella registrazione della rotta: le scritture
# passano sempre da AnaRipartizioneOrganico (vedi app/crud/generic.py).
class VwAnaRipartizioneOrganico(Base):
    __tablename__ = "vw_ana_ripartizione_organico"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    azienda_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True))
    anno_riferimento: Mapped[int] = mapped_column(SmallInteger)

    numero_amministrativi: Mapped[int] = mapped_column(Integer)
    percentuale_amministrativi: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    numero_project_manager: Mapped[int] = mapped_column(Integer)
    percentuale_project_manager: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    numero_tecnici: Mapped[int] = mapped_column(Integer)
    percentuale_tecnici: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    numero_preposti: Mapped[int] = mapped_column(Integer)
    percentuale_preposti: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    numero_operativi: Mapped[int] = mapped_column(Integer)
    percentuale_operativi: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    numero_dirigenti_sicurezza: Mapped[int] = mapped_column(Integer)
    percentuale_dirigenti_sicurezza: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    numero_uomini: Mapped[int] = mapped_column(Integer)
    percentuale_uomini: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    numero_donne: Mapped[int] = mapped_column(Integer)
    percentuale_donne: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    numero_italiani: Mapped[int] = mapped_column(Integer)
    percentuale_italiani: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    numero_stranieri: Mapped[int] = mapped_column(Integer)
    percentuale_stranieri: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    numero_tempo_determinato: Mapped[int] = mapped_column(Integer)
    percentuale_tempo_determinato: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    numero_tempo_indeterminato: Mapped[int] = mapped_column(Integer)
    percentuale_tempo_indeterminato: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    numero_laureati: Mapped[int] = mapped_column(Integer)
    percentuale_laureati: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    numero_diplomati: Mapped[int] = mapped_column(Integer)
    percentuale_diplomati: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


# Sezione: ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO (singleton)
class AnaTurniLavoro(Base):
    __tablename__ = "ana_turni_lavoro"
    __table_args__ = (UniqueConstraint("azienda_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    presenza_turnazioni: Mapped[bool] = mapped_column(Boolean)
    tipologia_turno: Mapped[str | None] = mapped_column(String(200))
    numero_turni: Mapped[int | None] = mapped_column(SmallInteger)
    fasce_orarie: Mapped[str | None] = mapped_column(Text)
    rotazione_turni: Mapped[str | None] = mapped_column(Text)
    lavoro_notturno: Mapped[bool] = mapped_column(Boolean)
    lavoro_festivo: Mapped[bool] = mapped_column(Boolean)
    lavoro_ciclo_continuo: Mapped[bool] = mapped_column(Boolean)
    note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# Sezione: ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.OUTSOURCING (elenco)
class AnaOutsourcing(Base):
    __tablename__ = "ana_outsourcing"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    processo_attivita_affidata: Mapped[str] = mapped_column(Text)
    data_inizio: Mapped[date]
    data_fine: Mapped[date | None]
    stato_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_stati_outsourcing.id"))
    referente_interno: Mapped[str] = mapped_column(String(250))
    contratto_associato: Mapped[str] = mapped_column(String(250))
    note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# Sezione: ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI (elenco)
class AnaSubappaltatore(Base):
    __tablename__ = "ana_subappaltatori"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    ragione_sociale: Mapped[str] = mapped_column(String(250))
    codice_fiscale_partita_iva: Mapped[str] = mapped_column(String(30))
    categoria_lavori: Mapped[str] = mapped_column(String(250))
    data_inizio: Mapped[date]
    data_fine: Mapped[date | None]
    stato_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_stati_subappaltatori.id"))
    referente: Mapped[str] = mapped_column(String(250))
    documentazione_associata: Mapped[str | None] = mapped_column(Text)
    note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# Sezione: ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI (elenco)
class AnaFornitoreMateriali(Base):
    __tablename__ = "ana_fornitori_materiali"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    ragione_sociale: Mapped[str] = mapped_column(String(250))
    referente: Mapped[str] = mapped_column(String(250))
    telefono: Mapped[str] = mapped_column(String(50))
    email: Mapped[str] = mapped_column(String(254))
    categoria_merceologica: Mapped[str] = mapped_column(String(250))
    materiali_forniti: Mapped[str] = mapped_column(Text)
    data_inizio_collaborazione: Mapped[date]
    stato_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_stati_fornitori_materiali.id"))
    contratto: Mapped[str | None] = mapped_column(Text)
    certificazioni: Mapped[str | None] = mapped_column(Text)
    schede_tecniche_sicurezza: Mapped[str | None] = mapped_column(Text)
    altri_documenti: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# Sezione: ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI (elenco)
class AnaLavoratoreAutonomo(Base):
    __tablename__ = "ana_lavoratori_autonomi"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    nominativo_ragione_sociale: Mapped[str] = mapped_column(String(250))
    codice_fiscale_partita_iva: Mapped[str] = mapped_column(String(30))
    mansione: Mapped[str] = mapped_column(String(250))
    attivita_svolta: Mapped[str] = mapped_column(Text)
    data_inizio_collaborazione: Mapped[date]
    data_fine_collaborazione: Mapped[date | None]
    stato_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_stati_lavoratori_autonomi.id")
    )
    documentazione_associata: Mapped[str | None] = mapped_column(Text)
    note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# Categoria Trend
# ===========================================================================


# Sezione: ANAGRAFICA_AZIENDALE.TREND.INDICATORI_ECONOMICI (elenco, una riga per anno)
class AnaIndicatoreEconomico(Base):
    __tablename__ = "ana_indicatori_economici"
    __table_args__ = (UniqueConstraint("azienda_id", "anno_riferimento"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    anno_riferimento: Mapped[int] = mapped_column(SmallInteger)

    fatturato: Mapped[Decimal] = mapped_column(Numeric(18, 2))
    obiettivo: Mapped[Decimal] = mapped_column(Numeric(18, 2))
    note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# Vista di sola lettura con lo scostamento calcolato (vw_ana_indicatori_economici).
class VwAnaIndicatoreEconomico(Base):
    __tablename__ = "vw_ana_indicatori_economici"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    azienda_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True))
    anno_riferimento: Mapped[int] = mapped_column(SmallInteger)

    fatturato: Mapped[Decimal] = mapped_column(Numeric(18, 2))
    obiettivo: Mapped[Decimal] = mapped_column(Numeric(18, 2))
    scostamento: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


# Sezione: ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO (elenco, una riga per anno)
class AnaVariazioneOrganico(Base):
    __tablename__ = "ana_variazioni_organico"
    __table_args__ = (
        UniqueConstraint("azienda_id", "anno_riferimento"),
        ForeignKeyConstraint(
            ["azienda_id", "anno_riferimento"],
            ["ana_dati_generali.azienda_id", "ana_dati_generali.anno_riferimento"],
        ),
    )

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True))
    anno_riferimento: Mapped[int] = mapped_column(SmallInteger)

    numero_nuove_assunzioni: Mapped[int] = mapped_column(Integer)
    numero_cessazioni: Mapped[int] = mapped_column(Integer)
    obiettivo_variazione_percentuale: Mapped[Decimal] = mapped_column(Numeric(7, 2))
    note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# Vista di sola lettura con organico e variazioni calcolate (vw_ana_variazioni_organico).
class VwAnaVariazioneOrganico(Base):
    __tablename__ = "vw_ana_variazioni_organico"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    azienda_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True))
    anno_riferimento: Mapped[int] = mapped_column(SmallInteger)

    organico_medio_annuo: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    incremento_decremento_personale_percentuale: Mapped[Decimal | None] = mapped_column(Numeric(9, 2))
    numero_nuove_assunzioni: Mapped[int] = mapped_column(Integer)
    numero_cessazioni: Mapped[int] = mapped_column(Integer)
    obiettivo_variazione_percentuale: Mapped[Decimal] = mapped_column(Numeric(7, 2))
    scostamento: Mapped[Decimal | None] = mapped_column(Numeric(9, 2))
    note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


# ===========================================================================
# Categoria Assicurazioni
# ===========================================================================


# Sezione: ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE (elenco)
class AnaAssicurazione(Base):
    __tablename__ = "ana_assicurazioni"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    tipologia_polizza: Mapped[str] = mapped_column(String(250))
    compagnia_assicurativa: Mapped[str] = mapped_column(String(250))
    numero_polizza: Mapped[str] = mapped_column(String(100))
    data_emissione: Mapped[date]
    data_decorrenza: Mapped[date]
    data_scadenza: Mapped[date]
    massimale: Mapped[Decimal] = mapped_column(Numeric(18, 2))
    stato_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_stati_assicurazioni.id"))
    contraente: Mapped[str] = mapped_column(String(250))
    referente: Mapped[str] = mapped_column(String(250))
    premio_assicurativo: Mapped[Decimal] = mapped_column(Numeric(18, 2))
    frequenza_rinnovo_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_frequenze_rinnovo_assicurazioni.id")
    )
    documentazione_associata: Mapped[str | None] = mapped_column(Text)
    note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# Categoria Altre informazioni
# ===========================================================================


# Sezione: ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE.CONTRATTI
# (due tabelle indipendenti, non parent/child: nessuna FK tra loro. Vedi
# app/api/anagrafica.py per come vengono registrate come due risorse
# separate sotto lo stesso codice sezione.)
class AnaContrattiRetePresenza(Base):
    __tablename__ = "ana_contratti_rete_presenza"
    __table_args__ = (UniqueConstraint("azienda_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    presenza: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class AnaContrattoRete(Base):
    __tablename__ = "ana_contratti_rete"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    numero_registrazione: Mapped[str] = mapped_column(String(100))
    numero_repertorio: Mapped[str] = mapped_column(String(100))
    nome_contratto: Mapped[str] = mapped_column(String(250))
    data_adesione: Mapped[date]
    data_cessazione: Mapped[date | None]
    note: Mapped[str | None] = mapped_column(Text)
    documentazione_associata: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# Sezione: ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA.DOCUMENTAZIONE (elenco)
class AnaComplianceTrasparenza(Base):
    __tablename__ = "ana_compliance_trasparenza"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    elemento: Mapped[str] = mapped_column(String(250))
    presenza: Mapped[bool] = mapped_column(Boolean, default=False)
    data_adozione: Mapped[date | None]
    dettagli_note: Mapped[str | None] = mapped_column(Text)
    documentazione_associata: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# Sezione: ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.PROCEDIMENTI_LEGALI (elenco)
class AnaProcedimentoLegale(Base):
    __tablename__ = "ana_procedimenti_legali"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    tipologia_procedimento: Mapped[str] = mapped_column(String(250))
    controparte: Mapped[str] = mapped_column(String(250))
    data_inizio: Mapped[date]
    data_conclusione: Mapped[date | None]
    stato_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_stati_procedimenti_legali.id"))
    esito: Mapped[str | None] = mapped_column(Text)
    note: Mapped[str | None] = mapped_column(Text)
    documentazione_associata: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# Sezione: ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.VISITE_ENTI_CONTROLLO (elenco)
class AnaVisitaEnteControllo(Base):
    __tablename__ = "ana_visite_enti_controllo"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    ente: Mapped[str] = mapped_column(String(250))
    tipologia_visita: Mapped[str] = mapped_column(String(250))
    data_visita: Mapped[date]
    esito: Mapped[str] = mapped_column(Text)
    prescrizioni: Mapped[str | None] = mapped_column(Text)
    verbale_documentazione: Mapped[str | None] = mapped_column(Text)
    note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
