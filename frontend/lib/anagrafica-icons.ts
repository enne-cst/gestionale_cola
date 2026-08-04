import {
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarClock,
  Gavel,
  Landmark,
  MapPin,
  Phone,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Icona per categoria, usata nella tab bar del modulo Anagrafica Aziendale.
export const CATEGORIA_ICONE: Record<string, LucideIcon> = {
  "Informazioni societarie": Building2,
  Sedi: MapPin,
  Contatti: Phone,
  "Dati CCIAA": ScrollText,
};

// Icona per sezione, condivisa tra sidebar, header di pagina e card di
// anteprima nella panoramica, così restano coerenti ovunque compaiano.
export const SEZIONE_ICONE: Record<string, LucideIcon> = {
  "identificazione-camerale": Building2,
  "durata-societa-esercizi": CalendarClock,
  "attivita-esercitata": Briefcase,
  "capitale-sociale": Landmark,
  "iscrizioni-registro-imprese": ScrollText,
  "codici-ateco": BadgeCheck,
  "amministrazione-controllo": Gavel,
  sedi: MapPin,
  contatti: Phone,
  "albi-ruoli-licenze": Award,
  soa: ShieldCheck,
  certificazioni: ShieldCheck,
  "addetti-visura": Users,
  "addetti-comune": Users,
};
