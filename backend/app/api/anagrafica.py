"""Router del modulo Anagrafica Aziendale.

Copre le sotto-risorse già presenti a schema (dati estratti dalla CCIA +
sedi/contatti, cap. 3.2.1 del documento di progetto). Le sezioni
Organizzazione e Altre informazioni (cap. 3.2.2/3.2.3: turni, outsourcing,
subappaltatori, fornitori, assicurazioni, compliance, contenzioso...) non
hanno ancora tabelle a schema e restano fuori da questo router.
"""

from fastapi import APIRouter

from app.crud.generic import (
    register_list_crud,
    register_list_crud_with_children,
    register_singleton_crud,
    register_singleton_crud_with_children,
)
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
    AnaIdentificazioneCamerale,
    AnaIscrizioneRegistroImprese,
    AnaSede,
    AnaSistemaAmministrazione,
    AnaSoa,
    AnaSoaCategoria,
    QualAmministratoreCarica,
    QualAmministratoreDelegato,
    QualComponenteConsiglioAmministrazione,
    QualDirettoreTecnicoSoa,
    QualElencoSoci,
    QualResponsabileFer,
    QualRevisoreLegale,
    QualSindaco,
    QualSocio,
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
    AmministratoreCaricaCreate,
    AmministratoreCaricaRead,
    AmministratoreCaricaUpdate,
    AmministratoreDelegatoCreate,
    AmministratoreDelegatoRead,
    AmministratoreDelegatoUpdate,
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
    ComponenteCdaCreate,
    ComponenteCdaRead,
    ComponenteCdaUpdate,
    ContattoCreate,
    ContattoRead,
    ContattoUpdate,
    DirettoreTecnicoSoaCreate,
    DirettoreTecnicoSoaRead,
    DirettoreTecnicoSoaUpdate,
    DurataSocietaEserciziRead,
    DurataSocietaEserciziUpsert,
    ElencoSociRead,
    ElencoSociUpsert,
    IdentificazioneCameraleRead,
    IdentificazioneCameraleUpsert,
    IscrizioneRegistroImpreseCreate,
    IscrizioneRegistroImpreseRead,
    IscrizioneRegistroImpreseUpdate,
    ResponsabileFerCreate,
    ResponsabileFerRead,
    ResponsabileFerUpdate,
    RevisoreLegaleCreate,
    RevisoreLegaleRead,
    RevisoreLegaleUpdate,
    SedeCreate,
    SedeRead,
    SedeUpdate,
    SindacoCreate,
    SindacoRead,
    SindacoUpdate,
    SistemaAmministrazioneRead,
    SoaCategoriaRead,
    SoaCreate,
    SoaRead,
    SoaUpdate,
    SocioCreate,
    SocioRead,
    SocioUpdate,
)

MODULO = "Anagrafica Aziendale"
TAGS = ["Anagrafica Aziendale"]

router = APIRouter(prefix="/api/anagrafica")

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
    path="/elenco-soci",
    tags=TAGS,
    modulo=MODULO,
    model=QualElencoSoci,
    read_schema=ElencoSociRead,
    upsert_schema=ElencoSociUpsert,
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
    path="/soci",
    tags=TAGS,
    modulo=MODULO,
    model=QualSocio,
    read_schema=SocioRead,
    create_schema=SocioCreate,
    update_schema=SocioUpdate,
)

register_list_crud(
    router,
    path="/amministratori-cariche",
    tags=TAGS,
    modulo=MODULO,
    model=QualAmministratoreCarica,
    read_schema=AmministratoreCaricaRead,
    create_schema=AmministratoreCaricaCreate,
    update_schema=AmministratoreCaricaUpdate,
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

register_list_crud(
    router,
    path="/sedi",
    tags=TAGS,
    modulo=MODULO,
    model=AnaSede,
    read_schema=SedeRead,
    create_schema=SedeCreate,
    update_schema=SedeUpdate,
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

register_list_crud(
    router,
    path="/responsabili-fer",
    tags=TAGS,
    modulo=MODULO,
    model=QualResponsabileFer,
    read_schema=ResponsabileFerRead,
    create_schema=ResponsabileFerCreate,
    update_schema=ResponsabileFerUpdate,
)

register_list_crud(
    router,
    path="/sindaci",
    tags=TAGS,
    modulo=MODULO,
    model=QualSindaco,
    read_schema=SindacoRead,
    create_schema=SindacoCreate,
    update_schema=SindacoUpdate,
)

register_list_crud(
    router,
    path="/revisori-legali",
    tags=TAGS,
    modulo=MODULO,
    model=QualRevisoreLegale,
    read_schema=RevisoreLegaleRead,
    create_schema=RevisoreLegaleCreate,
    update_schema=RevisoreLegaleUpdate,
)

register_list_crud(
    router,
    path="/direttori-tecnici-soa",
    tags=TAGS,
    modulo=MODULO,
    model=QualDirettoreTecnicoSoa,
    read_schema=DirettoreTecnicoSoaRead,
    create_schema=DirettoreTecnicoSoaCreate,
    update_schema=DirettoreTecnicoSoaUpdate,
)

register_list_crud(
    router,
    path="/amministratori-delegati",
    tags=TAGS,
    modulo=MODULO,
    model=QualAmministratoreDelegato,
    read_schema=AmministratoreDelegatoRead,
    create_schema=AmministratoreDelegatoCreate,
    update_schema=AmministratoreDelegatoUpdate,
)

register_list_crud(
    router,
    path="/componenti-cda",
    tags=TAGS,
    modulo=MODULO,
    model=QualComponenteConsiglioAmministrazione,
    read_schema=ComponenteCdaRead,
    create_schema=ComponenteCdaCreate,
    update_schema=ComponenteCdaUpdate,
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
