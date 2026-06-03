import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [hidden, setHidden] = useState(() => localStorage.getItem("tiamo:pwa-dismissed") === "1");

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!evt || hidden) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 glass-card rounded-2xl p-4 flex items-start gap-3 page-enter">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0">
        <Download className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-bold text-sm font-display">Instalá TIAMO POS</h4>
        <p className="text-xs text-zinc-400 mt-0.5">Como app nativa en tu tablet o celular</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={async () => {
              await evt.prompt();
              const r = await evt.userChoice;
              if (r.outcome === "accepted") setHidden(true);
              setEvt(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-red-500 to-red-700 text-white text-xs font-bold"
          >Instalar</button>
          <button
            onClick={() => { setHidden(true); localStorage.setItem("tiamo:pwa-dismissed", "1"); }}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 text-xs"
          >Más tarde</button>
        </div>
      </div>
      <button onClick={() => setHidden(true)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
    </div>
  );
}
