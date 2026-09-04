import { cn } from "@/lib/utils";

/** Iniziali della persona in un cerchio colorato (prototipo §9.2 tabella
 * Persone, §10.1 header scheda). Colore derivato dal nome così la stessa
 * persona ha sempre lo stesso colore, senza doverlo memorizzare. */
export function PersonAvatar({ nome, cognome, size = "sm" }: { nome: string; cognome: string; size?: "sm" | "lg" }) {
  const iniziali = `${nome.charAt(0)}${cognome.charAt(0)}`.toUpperCase();
  const palette = ["bg-blue-100 text-blue-700", "bg-green-100 text-green-700", "bg-amber-100 text-amber-700", "bg-purple-100 text-purple-700", "bg-pink-100 text-pink-700"];
  const indice = (nome.charCodeAt(0) + cognome.charCodeAt(0)) % palette.length;

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        size === "lg" ? "size-12 text-lg" : "size-8 text-xs",
        palette[indice],
      )}
    >
      {iniziali}
    </span>
  );
}
