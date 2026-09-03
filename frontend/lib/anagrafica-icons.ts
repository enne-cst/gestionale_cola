import {
  Award,
  BadgeCheck,
  Briefcase,
  Building,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Clock4,
  FileWarning,
  Gauge,
  Gavel,
  HandCoins,
  Handshake,
  HardHat,
  History,
  Landmark,
  MapPin,
  Network,
  Phone,
  PiggyBank,
  Scale,
  ScrollText,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Truck,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Icona per ciascuna delle 10 card della griglia "Dati CCIAA" (§6.3 del
// protocollo), chiavi = CciaaVistaKey più "capitale-sociale" (card semplice,
// apre direttamente la sezione a registro con lo stesso nome). "sintesi" non
// è più tra queste (§ Correzione 25: è una funzione del banner, non una
// card — vedi VisualizzaSintesiButton).
export const CCIAA_CARD_ICONE: Record<string, LucideIcon> = {
  sede: MapPin,
  statuto: Building2,
  "capitale-sociale": Landmark,
  soci: Handshake,
  amministratori: Gavel,
  sindaci: ShieldCheck,
  "attivita-albi": Briefcase,
  "personale-occupazione": Users,
  "sedi-secondarie": Building,
  "aggiornamento-impresa": History,
};

// Icona per categoria, usata nella tab bar del modulo Anagrafica Aziendale.
export const CATEGORIA_ICONE: Record<string, LucideIcon> = {
  "Informazioni societarie": Building2,
  Sedi: MapPin,
  Contatti: Phone,
  "Dati CCIAA": ScrollText,
  Organizzazione: Network,
  Trend: TrendingUp,
  Assicurazioni: Shield,
  "Altre informazioni": FileWarning,
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

  // Organizzazione (ISO 9001)
  "contratto-lavoro": ScrollText,
  "posizioni-assicurative-previdenziali": ShieldAlert,
  "fondi-interprofessionali": PiggyBank,
  "dati-generali": Users,
  "ripartizione-organico": Gauge,
  "turni-lavoro": Clock4,
  outsourcing: Handshake,
  subappaltatori: HardHat,
  "fornitori-materiali": Truck,
  "lavoratori-autonomi": UserCog,

  // Trend (ISO 9001)
  "indicatori-economici": HandCoins,
  "variazioni-organico": TrendingUp,

  // Assicurazioni (ISO 9001)
  assicurazioni: Shield,

  // Altre informazioni (ISO 9001)
  "contratti-rete": Network,
  "compliance-trasparenza": ClipboardCheck,
  "procedimenti-legali": Scale,
  "visite-enti-controllo": FileWarning,
};
