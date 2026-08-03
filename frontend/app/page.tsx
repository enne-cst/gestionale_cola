// API_URL_INTERNAL: usato lato server (SSR, dentro il container Docker),
// punta al nome del servizio backend sulla rete Docker interna.
// NEXT_PUBLIC_API_URL: usato lato browser, punta alla porta pubblicata
// su localhost. Sono due URL diversi perche' "backend" non e' risolvibile
// dal browser dell'utente, solo dagli altri container.
async function getBackendStatus(): Promise<string> {
  const apiUrl = process.env.API_URL_INTERNAL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return "URL backend non configurato";

  try {
    const res = await fetch(`${apiUrl}/health`, { cache: "no-store" });
    return res.ok ? "ok" : `errore (HTTP ${res.status})`;
  } catch {
    return "non raggiungibile";
  }
}

export default async function Home() {
  const backendStatus = await getBackendStatus();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Gestionale Cola</h1>
      <p className="text-sm text-muted-foreground">
        Backend: <span className="font-mono">{backendStatus}</span>
      </p>
    </main>
  );
}
