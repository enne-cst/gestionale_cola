/*
===============================================================================
 MIGRAZIONE 009 - A32 (STATO VERIFICA CONSULENTE) DIVENTA FACOLTATIVA PER I
                   RUOLI CCIAA
===============================================================================

 Scopo
 -----
 La migrazione 007 aveva lasciato A32 "Stato verifica consulente" tra le
 poche caratteristiche ancora OBBLIGATORIA per i ruoli camerali (Socio,
 Amministratore, Amministratore Delegato, Componente CdA, Sindaco, Revisore
 Legale), perché all'epoca era l'unico modo per registrare la verifica del
 consulente su una riga-incarico: un valore di catalogo da compilare nel
 form insieme agli altri.

 L'utente ha chiesto (27/08/2026) che la verifica della riga-incarico abbia
 lo stesso trattamento del registro campo-per-campo (popup ancorato alla
 riga, nota, verificato da/il, concorrenza ottimistica) invece di essere un
 campo del form di compilazione — vedi `app/core/incarichi.py`
 (`applica_decisione_verifica_incarico`, riusa `sys_registro_stato_campi`/
 `sys_registro_audit`) e `frontend/components/registro/incarico-verification-popover.tsx`.
 A32 non è più mostrata nel form per questi ruoli
 (`frontend/lib/cciaa-incarichi-caratteristiche.ts`): se restasse
 OBBLIGATORIA, la creazione di un nuovo incarico fallirebbe con 422
 "caratteristica obbligatoria mancante".

 Non rimuove A32 dal catalogo condiviso né dalla relazione con questi
 ruoli (resta associata, solo non più obbligatoria): un futuro modulo
 Personale che non passi dal popup potrebbe ancora volerla come campo.
 Scopo solo per i 6 ruoli camerali coinvolti in questa sessione, non per
 l'intero catalogo (a differenza della 006, che l'aveva fatto per A02 su
 tutti i ruoli): gli altri ruoli del catalogo condiviso non sono toccati.

 Non modifica 004/007 (già applicate, per convenzione CLAUDE.md non vanno
 più toccate retroattivamente).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;

UPDATE rel_ruoli_caratteristiche AS rrc
SET obbligatorieta = 'FACOLTATIVA'
FROM cat_ruoli AS r, cat_caratteristiche_incarico AS c
WHERE rrc.ruolo_id = r.id
  AND rrc.caratteristica_id = c.id
  AND r.codice IN ('SOCIO', 'AMMINISTRATORE', 'AMMINISTRATORE_DELEGATO', 'COMPONENTE_CDA', 'SINDACO', 'REVISORE_LEGALE')
  AND c.codice = 'A32';

COMMIT;
