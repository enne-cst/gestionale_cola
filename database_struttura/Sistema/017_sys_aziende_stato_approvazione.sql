
-- =======================================================
-- AZIENDE: stato di approvazione da parte del super admin
-- =======================================================
-- Un'azienda creata da un consulente resta "in_attesa" finché un super
-- admin non la approva: solo allora l'account admin aziendale può
-- accedere alla piattaforma (vedi backend/app/api/auth.py).

ALTER TABLE sys_aziende
    ADD COLUMN stato_approvazione VARCHAR(20) NOT NULL DEFAULT 'in_attesa'
    CHECK (stato_approvazione IN ('in_attesa', 'approvata', 'rifiutata'));
