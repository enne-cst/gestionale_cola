"""Router minimo del modulo Personale.

Espone solo l'anagrafica di base della persona (`per_persone`), necessaria
per selezionare o creare il nominativo da collegare alle qualifiche
dell'Anagrafica Aziendale (soci, amministratori, sindaci...). Il modulo
Personale completo (ruoli e incarichi, titoli di studio, DPI, formazione)
non è ancora sviluppato.

Nota sul gating: in `cat_moduli` "Personale" non è un modulo base (si
sblocca con un pacchetto), ma qui l'anagrafica minima della persona serve
solo da supporto alle qualifiche societarie dell'Anagrafica Aziendale, che
è invece un modulo base sempre disponibile. Per questo l'endpoint è
condizionato al modulo "Anagrafica Aziendale", non a "Personale": quando il
modulo Personale completo verrà sviluppato, questo endpoint andrà rivisto
insieme al resto di quel modulo.
"""

from fastapi import APIRouter

from app.crud.generic import register_list_crud
from app.models.personale import Persona
from app.schemas.personale import PersonaCreate, PersonaRead, PersonaUpdate

MODULO = "Anagrafica Aziendale"
TAGS = ["Personale"]

router = APIRouter(prefix="/api/personale")

register_list_crud(
    router,
    path="/persone",
    tags=TAGS,
    modulo=MODULO,
    model=Persona,
    read_schema=PersonaRead,
    create_schema=PersonaCreate,
    update_schema=PersonaUpdate,
)
