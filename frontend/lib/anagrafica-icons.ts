import { Briefcase, Building2, CalendarClock, Landmark, MapPin, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Icona per sezione, condivisa tra sidebar, header di pagina e card di
// anteprima nella panoramica, così restano coerenti ovunque compaiano.
export const SEZIONE_ICONE: Record<string, LucideIcon> = {
  "identificazione-camerale": Building2,
  "durata-societa-esercizi": CalendarClock,
  "attivita-esercitata": Briefcase,
  "capitale-sociale": Landmark,
  sedi: MapPin,
  contatti: Phone,
};
