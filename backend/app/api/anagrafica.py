"""Router del modulo Anagrafica Aziendale.

Copre le sotto-risorse sempre visibili (dati estratti dalla CCIA +
sedi/contatti, cap. 3.2.1 del documento di progetto) e le sezioni
Organizzazione, Trend, Assicurazioni e Altre informazioni (cap. 4.2.2/4.2.3),
soggette all'abbonamento ISO 9001: per queste ultime ogni registrazione passa
anche `sezione=<codice sys_elementi>`, che applica `require_sezione` in
aggiunta a `require_modulo` (vedi `app/core/sezioni.py` e
`app/crud/generic.py`)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.crud.generic import (
    register_list_crud,
    register_list_crud_with_children,
    register_singleton_crud,
    register_singleton_crud_with_children,
)
from app.database import Base, get_db
from app.models.anagrafica import (
    AnaAddettiComune,
    AnaAddettiComunePeriodo,
    AnaAddettiVisura,
    AnaAddettiVisuraPeriodo,
    AnaAlboRuoloLicenza,
    AnaAmministrazioneControllo,
    AnaAttivitaEsercitata,
    AnaCapitaleSociale,
    AnaCertificazione,
    AnaCertificazioneSettoreIAF,
    AnaCodiceAteco,
    AnaContatto,
    AnaDurataSocietaEsercizi,
    AnaElencoSociEstremi,
    AnaIdentificazioneCamerale,
    AnaIscrizioneRegistroImprese,
    AnaSede,
    AnaSedeAttivita,
    AnaSistemaAmministrazione,
    AnaSoa,
    AnaSoaCategoria,
)
from app.models.anagrafica_iso9001 import (
    AnaAssicurazione,
    AnaComplianceTrasparenza,
    AnaContrattiRetePresenza,
    AnaContrattoLavoro,
    AnaContrattoRete,
    AnaDatiGenerali,
    AnaFondoInterprofessionale,
    AnaFornitoreMateriali,
    AnaIndicatoreEconomico,
    AnaLavoratoreAutonomo,
    AnaOutsourcing,
    AnaPosizioniAssicurativePrevidenziali,
    AnaProcedimentoLegale,
    AnaRipartizioneOrganico,
    AnaSubappaltatore,
    AnaTurniLavoro,
    AnaVariazioneOrganico,
    AnaVisitaEnteControllo,
    CatFrequenzaRinnovoAssicurazioni,
    CatStatoAssicurazioni,
    CatStatoFornitoriMateriali,
    CatStatoIscrizioneFondo,
    CatStatoLavoratoriAutonomi,
    CatStatoOutsourcing,
    CatStatoProcedimentiLegali,
    CatStatoSubappaltatori,
    VwAnaIndicatoreEconomico,
    VwAnaRipartizioneOrganico,
    VwAnaVariazioneOrganico,
)
from app.schemas.anagrafica import (
    AddettiComuneCreate,
    AddettiComunePeriodoRead,
    AddettiComuneRead,
    AddettiComuneUpdate,
    AddettiVisuraCreate,
    AddettiVisuraPeriodoRead,
    AddettiVisuraRead,
    AddettiVisuraUpdate,
    AlboRuoloLicenzaCreate,
    AlboRuoloLicenzaRead,
    AlboRuoloLicenzaUpdate,
    AmministrazioneControlloRead,
    AmministrazioneControlloUpsert,
    AttivitaEsercitataRead,
    AttivitaEsercitataUpsert,
    CapitaleSocialeRead,
    CapitaleSocialeUpsert,
    CertificazioneCreate,
    CertificazioneRead,
    CertificazioneSettoreIafRead,
    CertificazioneUpdate,
    CodiceAtecoCreate,
    CodiceAtecoRead,
    CodiceAtecoUpdate,
    ContattoCreate,
    ContattoRead,
    ContattoUpdate,
    DurataSocietaEserciziRead,
    DurataSocietaEserciziUpsert,
    ElencoSociEstremiRead,
    ElencoSociEstremiUpsert,
    IdentificazioneCameraleRead,
    IdentificazioneCameraleUpsert,
    IscrizioneRegistroImpreseCreate,
    IscrizioneRegistroImpreseRead,
    IscrizioneRegistroImpreseUpdate,
    SedeAttivitaRead,
    SedeCreate,
    SedeRead,
    SedeUpdate,
    SistemaAmministrazioneRead,
    SoaCategoriaRead,
    SoaCreate,
    SoaRead,
    SoaUpdate,
)
from app.schemas.anagrafica_iso9001 import (
    AssicurazioneCreate,
    AssicurazioneRead,
    AssicurazioneUpdate,
    CatalogoRead,
    ComplianceTrasparenzaCreate,
    ComplianceTrasparenzaRead,
    ComplianceTrasparenzaUpdate,
    ContrattiRetePresenzaRead,
    ContrattiRetePresenzaUpsert,
    ContrattoLavoroRead,
    ContrattoLavoroUpsert,
    ContrattoReteCreate,
    ContrattoReteRead,
    ContrattoReteUpdate,
    DatiGeneraliCreate,
    DatiGeneraliRead,
    DatiGeneraliUpdate,
    FondoInterprofessionaleCreate,
    FondoInterprofessionaleRead,
    FondoInterprofessionaleUpdate,
    FornitoreMaterialiCreate,
    FornitoreMaterialiRead,
    FornitoreMaterialiUpdate,
    IndicatoreEconomicoCreate,
    IndicatoreEconomicoRead,
    IndicatoreEconomicoUpdate,
    LavoratoreAutonomoCreate,
    LavoratoreAutonomoRead,
    LavoratoreAutonomoUpdate,
    OutsourcingCreate,
    OutsourcingRead,
    OutsourcingUpdate,
    PosizioniAssicurativePrevidenzialiRead,
    PosizioniAssicurativePrevidenzialiUpsert,
    ProcedimentoLegaleCreate,
    ProcedimentoLegaleRead,
    ProcedimentoLegaleUpdate,
    RipartizioneOrganicoCreate,
    RipartizioneOrganicoRead,
    RipartizioneOrganicoUpdate,
    SubappaltatoreCreate,
    SubappaltatoreRead,
    SubappaltatoreUpdate,
    TurniLavoroRead,
    TurniLavoroUpsert,
    VariazioneOrganicoCreate,
    VariazioneOrganicoRead,
    VariazioneOrganicoUpdate,
    VisitaEnteControlloCreate,
    VisitaEnteControlloRead,
    VisitaEnteControlloUpdate,
)

MODULO = "Anagrafica Aziendale"
TAGS = ["Anagrafica Aziendale"]
TAGS_ISO9001 = ["Anagrafica Aziendale - ISO 9001"]

router = APIRouter(prefix="/api/anagrafica")

# Codici sezione (sys_elementi.codice, cap. 4.2.2/4.2.3 del documento di
# progetto): definiti una sola volta qui e passati a `sezione=` in ogni
# registrazione sotto, per evitare refusi tra stringhe duplicate.
SEZ_CONTRATTO_LAVORO = "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO"
SEZ_POSIZIONI_ASSICURATIVE_PREVIDENZIALI = "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI"
SEZ_FONDO_INTERPROFESSIONALE = "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE"
SEZ_DATI_GENERALI = "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI"
SEZ_RIPARTIZIONE_ORGANICO = "ANAGRAFICA_AZIENDALE.TREND.RIPARTIZIONE_ORGANICO"
SEZ_TURNI_LAVORO = "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO"
SEZ_OUTSOURCING = "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.OUTSOURCING"
SEZ_SUBAPPALTATORI = "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI"
SEZ_FORNITORI_MATERIALI = "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI"
SEZ_LAVORATORI_AUTONOMI = "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI"
SEZ_INDICATORI_ECONOMICI = "ANAGRAFICA_AZIENDALE.TREND.INDICATORI_ECONOMICI"
SEZ_VARIAZIONI_ORGANICO = "ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO"
SEZ_ASSICURAZIONI = "ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE"
# Le due tabelle dei contratti di rete (presenza + elenco) condividono lo
# stesso codice sezione: sono due risorse distinte, non un parent/child.
SEZ_CONTRATTI_RETE = "ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE.CONTRATTI"
SEZ_COMPLIANCE_TRASPARENZA = "ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA.DOCUMENTAZIONE"
SEZ_PROCEDIMENTI_LEGALI = "ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.PROCEDIMENTI_LEGALI"
SEZ_VISITE_ENTI_CONTROLLO = "ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.VISITE_ENTI_CONTROLLO"

# ---------------------------------------------------------------------------
# Singleton semplici (un solo record per azienda)
# ---------------------------------------------------------------------------

register_singleton_crud(
    router,
    path="/identificazione-camerale",
    tags=TAGS,
    modulo=MODULO,
    model=AnaIdentificazioneCamerale,
    read_schema=IdentificazioneCameraleRead,
    upsert_schema=IdentificazioneCameraleUpsert,
)

register_singleton_crud(
    router,
    path="/durata-societa-esercizi",
    tags=TAGS,
    modulo=MODULO,
    model=AnaDurataSocietaEsercizi,
    read_schema=DurataSocietaEserciziRead,
    upsert_schema=DurataSocietaEserciziUpsert,
)

register_singleton_crud(
    router,
    path="/attivita-esercitata",
    tags=TAGS,
    modulo=MODULO,
    model=AnaAttivitaEsercitata,
    read_schema=AttivitaEsercitataRead,
    upsert_schema=AttivitaEsercitataUpsert,
)

register_singleton_crud(
    router,
    path="/capitale-sociale",
    tags=TAGS,
    modulo=MODULO,
    model=AnaCapitaleSociale,
    read_schema=CapitaleSocialeRead,
    upsert_schema=CapitaleSocialeUpsert,
)

register_singleton_crud(
    router,
    path="/elenco-soci-estremi",
    tags=TAGS,
    modulo=MODULO,
    model=AnaElencoSociEstremi,
    read_schema=ElencoSociEstremiRead,
    upsert_schema=ElencoSociEstremiUpsert,
)

# ---------------------------------------------------------------------------
# Singleton con figli
# ---------------------------------------------------------------------------

register_singleton_crud_with_children(
    router,
    path="/amministrazione-controllo",
    tags=TAGS,
    modulo=MODULO,
    model=AnaAmministrazioneControllo,
    read_schema=AmministrazioneControlloRead,
    upsert_schema=AmministrazioneControlloUpsert,
    child_model=AnaSistemaAmministrazione,
    child_fk_field="amministrazione_controllo_id",
    children_attr="sistemi_amministrazione",
    child_read_schema=SistemaAmministrazioneRead,
)

# ---------------------------------------------------------------------------
# Liste semplici (più record per azienda)
# ---------------------------------------------------------------------------

register_list_crud(
    router,
    path="/iscrizioni-registro-imprese",
    tags=TAGS,
    modulo=MODULO,
    model=AnaIscrizioneRegistroImprese,
    read_schema=IscrizioneRegistroImpreseRead,
    create_schema=IscrizioneRegistroImpreseCreate,
    update_schema=IscrizioneRegistroImpreseUpdate,
)

register_list_crud(
    router,
    path="/codici-ateco",
    tags=TAGS,
    modulo=MODULO,
    model=AnaCodiceAteco,
    read_schema=CodiceAtecoRead,
    create_schema=CodiceAtecoCreate,
    update_schema=CodiceAtecoUpdate,
)

register_list_crud(
    router,
    path="/albi-ruoli-licenze",
    tags=TAGS,
    modulo=MODULO,
    model=AnaAlboRuoloLicenza,
    read_schema=AlboRuoloLicenzaRead,
    create_schema=AlboRuoloLicenzaCreate,
    update_schema=AlboRuoloLicenzaUpdate,
)

register_list_crud_with_children(
    router,
    path="/sedi",
    tags=TAGS,
    modulo=MODULO,
    model=AnaSede,
    read_schema=SedeRead,
    create_schema=SedeCreate,
    update_schema=SedeUpdate,
    child_model=AnaSedeAttivita,
    child_fk_field="sede_id",
    children_attr="attivita",
    child_read_schema=SedeAttivitaRead,
)

register_list_crud(
    router,
    path="/contatti",
    tags=TAGS,
    modulo=MODULO,
    model=AnaContatto,
    read_schema=ContattoRead,
    create_schema=ContattoCreate,
    update_schema=ContattoUpdate,
)

# ---------------------------------------------------------------------------
# Liste con figli
# ---------------------------------------------------------------------------

register_list_crud_with_children(
    router,
    path="/soa",
    tags=TAGS,
    modulo=MODULO,
    model=AnaSoa,
    read_schema=SoaRead,
    create_schema=SoaCreate,
    update_schema=SoaUpdate,
    child_model=AnaSoaCategoria,
    child_fk_field="soa_id",
    children_attr="categorie",
    child_read_schema=SoaCategoriaRead,
)

register_list_crud_with_children(
    router,
    path="/certificazioni",
    tags=TAGS,
    modulo=MODULO,
    model=AnaCertificazione,
    read_schema=CertificazioneRead,
    create_schema=CertificazioneCreate,
    update_schema=CertificazioneUpdate,
    child_model=AnaCertificazioneSettoreIAF,
    child_fk_field="certificazione_azienda_id",
    children_attr="settori_iaf",
    child_read_schema=CertificazioneSettoreIafRead,
)

register_list_crud_with_children(
    router,
    path="/addetti-visura",
    tags=TAGS,
    modulo=MODULO,
    model=AnaAddettiVisura,
    read_schema=AddettiVisuraRead,
    create_schema=AddettiVisuraCreate,
    update_schema=AddettiVisuraUpdate,
    child_model=AnaAddettiVisuraPeriodo,
    child_fk_field="rilevazione_addetti_id",
    children_attr="periodi",
    child_read_schema=AddettiVisuraPeriodoRead,
)

register_list_crud_with_children(
    router,
    path="/addetti-comune",
    tags=TAGS,
    modulo=MODULO,
    model=AnaAddettiComune,
    read_schema=AddettiComuneRead,
    create_schema=AddettiComuneCreate,
    update_schema=AddettiComuneUpdate,
    child_model=AnaAddettiComunePeriodo,
    child_fk_field="addetti_comune_id",
    children_attr="periodi",
    child_read_schema=AddettiComunePeriodoRead,
)

# ---------------------------------------------------------------------------
# Sezioni soggette all'abbonamento ISO 9001 (cap. 4.2.2 "Organizzazione,
# Trend e Assicurazioni" e 4.2.3 "Altre informazioni"). Ogni registrazione
# aggiunge `sezione=` rispetto alle sotto-risorse base sopra: la sezione
# resta raggiungibile solo se l'azienda ha una certificazione che la
# sblocca attiva (vedi app/core/sezioni.py), indipendentemente dal fatto che
# il modulo Anagrafica Aziendale, essendo base, sia sempre visibile.
# ---------------------------------------------------------------------------

# --- Categoria Organizzazione ---

register_singleton_crud(
    router,
    path="/contratto-lavoro",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_CONTRATTO_LAVORO,
    model=AnaContrattoLavoro,
    read_schema=ContrattoLavoroRead,
    upsert_schema=ContrattoLavoroUpsert,
)

register_singleton_crud(
    router,
    path="/posizioni-assicurative-previdenziali",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_POSIZIONI_ASSICURATIVE_PREVIDENZIALI,
    model=AnaPosizioniAssicurativePrevidenziali,
    read_schema=PosizioniAssicurativePrevidenzialiRead,
    upsert_schema=PosizioniAssicurativePrevidenzialiUpsert,
)

register_list_crud(
    router,
    path="/fondi-interprofessionali",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_FONDO_INTERPROFESSIONALE,
    model=AnaFondoInterprofessionale,
    read_schema=FondoInterprofessionaleRead,
    create_schema=FondoInterprofessionaleCreate,
    update_schema=FondoInterprofessionaleUpdate,
)

register_list_crud(
    router,
    path="/dati-generali",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_DATI_GENERALI,
    model=AnaDatiGenerali,
    read_schema=DatiGeneraliRead,
    create_schema=DatiGeneraliCreate,
    update_schema=DatiGeneraliUpdate,
)

register_singleton_crud(
    router,
    path="/turni-lavoro",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_TURNI_LAVORO,
    model=AnaTurniLavoro,
    read_schema=TurniLavoroRead,
    upsert_schema=TurniLavoroUpsert,
)

register_list_crud(
    router,
    path="/outsourcing",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_OUTSOURCING,
    model=AnaOutsourcing,
    read_schema=OutsourcingRead,
    create_schema=OutsourcingCreate,
    update_schema=OutsourcingUpdate,
)

register_list_crud(
    router,
    path="/subappaltatori",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_SUBAPPALTATORI,
    model=AnaSubappaltatore,
    read_schema=SubappaltatoreRead,
    create_schema=SubappaltatoreCreate,
    update_schema=SubappaltatoreUpdate,
)

register_list_crud(
    router,
    path="/fornitori-materiali",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_FORNITORI_MATERIALI,
    model=AnaFornitoreMateriali,
    read_schema=FornitoreMaterialiRead,
    create_schema=FornitoreMaterialiCreate,
    update_schema=FornitoreMaterialiUpdate,
)

register_list_crud(
    router,
    path="/lavoratori-autonomi",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_LAVORATORI_AUTONOMI,
    model=AnaLavoratoreAutonomo,
    read_schema=LavoratoreAutonomoRead,
    create_schema=LavoratoreAutonomoCreate,
    update_schema=LavoratoreAutonomoUpdate,
)

# --- Categoria Trend ---

register_list_crud(
    router,
    path="/ripartizione-organico",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_RIPARTIZIONE_ORGANICO,
    model=AnaRipartizioneOrganico,
    read_model=VwAnaRipartizioneOrganico,
    read_schema=RipartizioneOrganicoRead,
    create_schema=RipartizioneOrganicoCreate,
    update_schema=RipartizioneOrganicoUpdate,
)

register_list_crud(
    router,
    path="/indicatori-economici",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_INDICATORI_ECONOMICI,
    model=AnaIndicatoreEconomico,
    read_model=VwAnaIndicatoreEconomico,
    read_schema=IndicatoreEconomicoRead,
    create_schema=IndicatoreEconomicoCreate,
    update_schema=IndicatoreEconomicoUpdate,
)

register_list_crud(
    router,
    path="/variazioni-organico",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_VARIAZIONI_ORGANICO,
    model=AnaVariazioneOrganico,
    read_model=VwAnaVariazioneOrganico,
    read_schema=VariazioneOrganicoRead,
    create_schema=VariazioneOrganicoCreate,
    update_schema=VariazioneOrganicoUpdate,
)

# --- Categoria Assicurazioni ---

register_list_crud(
    router,
    path="/assicurazioni",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_ASSICURAZIONI,
    model=AnaAssicurazione,
    read_schema=AssicurazioneRead,
    create_schema=AssicurazioneCreate,
    update_schema=AssicurazioneUpdate,
)

# --- Categoria Altre informazioni ---

# ana_contratti_rete_presenza e ana_contratti_rete non hanno FK tra loro
# (vedi commento in app/models/anagrafica_iso9001.py): due risorse
# registrate separatamente, non un singleton-con-figli.
register_singleton_crud(
    router,
    path="/contratti-rete/presenza",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_CONTRATTI_RETE,
    model=AnaContrattiRetePresenza,
    read_schema=ContrattiRetePresenzaRead,
    upsert_schema=ContrattiRetePresenzaUpsert,
)

register_list_crud(
    router,
    path="/contratti-rete",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_CONTRATTI_RETE,
    model=AnaContrattoRete,
    read_schema=ContrattoReteRead,
    create_schema=ContrattoReteCreate,
    update_schema=ContrattoReteUpdate,
)

register_list_crud(
    router,
    path="/compliance-trasparenza",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_COMPLIANCE_TRASPARENZA,
    model=AnaComplianceTrasparenza,
    read_schema=ComplianceTrasparenzaRead,
    create_schema=ComplianceTrasparenzaCreate,
    update_schema=ComplianceTrasparenzaUpdate,
)

register_list_crud(
    router,
    path="/procedimenti-legali",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_PROCEDIMENTI_LEGALI,
    model=AnaProcedimentoLegale,
    read_schema=ProcedimentoLegaleRead,
    create_schema=ProcedimentoLegaleCreate,
    update_schema=ProcedimentoLegaleUpdate,
)

register_list_crud(
    router,
    path="/visite-enti-controllo",
    tags=TAGS_ISO9001,
    modulo=MODULO,
    sezione=SEZ_VISITE_ENTI_CONTROLLO,
    model=AnaVisitaEnteControllo,
    read_schema=VisitaEnteControlloRead,
    create_schema=VisitaEnteControlloCreate,
    update_schema=VisitaEnteControlloUpdate,
)

# ---------------------------------------------------------------------------
# Cataloghi di stato delle sezioni ISO 9001 (dropdown del frontend): un solo
# endpoint generico, non uno per catalogo, per non ripetere la stessa lettura
# otto volte (doc. cap. 2.3.6-2.3.7). Non applica `require_sezione`: sono
# valori di riferimento statici, non dati dell'azienda, quindi basta che
# l'azienda corrente sia risolvibile (get_current_azienda).
# ---------------------------------------------------------------------------

_CATALOGHI_ISO9001: dict[str, type[Base]] = {
    "stati-iscrizione-fondo": CatStatoIscrizioneFondo,
    "stati-outsourcing": CatStatoOutsourcing,
    "stati-subappaltatori": CatStatoSubappaltatori,
    "stati-fornitori-materiali": CatStatoFornitoriMateriali,
    "stati-lavoratori-autonomi": CatStatoLavoratoriAutonomi,
    "stati-assicurazioni": CatStatoAssicurazioni,
    "frequenze-rinnovo-assicurazioni": CatFrequenzaRinnovoAssicurazioni,
    "stati-procedimenti-legali": CatStatoProcedimentiLegali,
}


@router.get("/cataloghi/{nome}", response_model=list[CatalogoRead], tags=TAGS_ISO9001)
def elenco_catalogo(
    nome: str,
    db: Session = Depends(get_db),
    _ctx: AziendaContext = Depends(get_current_azienda),
):
    modello = _CATALOGHI_ISO9001.get(nome)
    if modello is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Catalogo non trovato")
    return db.scalars(
        select(modello).where(modello.attivo.is_(True)).order_by(modello.ordine_visualizzazione)
    ).all()
