import { useState } from "react";
import { Download, MessageCircle, Settings2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  downloadCsv,
  openWhatsApp,
  rowsToWhatsAppText,
  getWhatsAppNumber,
  setWhatsAppNumber,
  type Row,
} from "@/lib/export-utils";

interface RecordExportBarProps {
  title: string;
  rows: Row[];
  filename: string;
  subtitle?: string;
  className?: string;
}

export function RecordExportBar({
  title,
  rows,
  filename,
  subtitle,
  className,
}: RecordExportBarProps) {
  const { toast } = useToast();
  const [openSettings, setOpenSettings] = useState(false);
  const [phone, setPhone] = useState(getWhatsAppNumber());
  const [saved, setSaved] = useState(false);

  const handleDownload = () => {
    if (rows.length === 0) {
      toast({ title: "Sin datos", description: "No hay registros para descargar", variant: "destructive" });
      return;
    }
    downloadCsv(filename, rows);
    toast({ title: "Descarga iniciada", description: `${rows.length} registros · ${filename}.csv` });
  };

  const handleWhatsApp = () => {
    if (rows.length === 0) {
      toast({ title: "Sin datos", description: "No hay registros para enviar", variant: "destructive" });
      return;
    }
    const num = getWhatsAppNumber();
    if (!num) {
      setOpenSettings(true);
      toast({
        title: "Configura un número",
        description: "Define el número de WhatsApp destino",
        variant: "destructive",
      });
      return;
    }
    const text = rowsToWhatsAppText(title, rows, { subtitle });
    openWhatsApp(text);
  };

  const handleSavePhone = () => {
    setWhatsAppNumber(phone.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    toast({ title: "Número guardado", description: phone.trim() || "(vacío)" });
  };

  const currentNumber = getWhatsAppNumber();

  return (
    <>
      <div className={`flex items-center gap-2 ${className ?? ""}`}>
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-[1.04] active:scale-[0.97] text-white"
          style={{
            background: "linear-gradient(135deg,rgba(59,130,246,0.18),rgba(59,130,246,0.08))",
            borderColor: "rgba(59,130,246,0.35)",
            boxShadow: "0 4px 16px rgba(59,130,246,0.18)",
          }}
          title="Descargar CSV"
          data-testid="button-export-csv"
        >
          <Download className="w-3.5 h-3.5" />
          CSV
        </button>
        <button
          type="button"
          onClick={handleWhatsApp}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-[1.04] active:scale-[0.97] text-white"
          style={{
            background: "linear-gradient(135deg,rgba(34,197,94,0.22),rgba(34,197,94,0.10))",
            borderColor: "rgba(34,197,94,0.4)",
            boxShadow: "0 4px 16px rgba(34,197,94,0.22)",
          }}
          title="Enviar a WhatsApp"
          data-testid="button-export-whatsapp"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={() => setOpenSettings(true)}
          className="flex items-center justify-center w-9 h-9 rounded-xl border transition-all hover:scale-[1.06] text-zinc-400 hover:text-white"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
          title={currentNumber ? `WhatsApp: ${currentNumber}` : "Configurar WhatsApp"}
          data-testid="button-export-settings"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <Dialog open={openSettings} onOpenChange={setOpenSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              Configurar WhatsApp
            </DialogTitle>
            <DialogDescription>
              Define el número al que se enviarán los reportes y registros del panel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Número con código de país
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 573001234567"
                className="bg-white/5 border-white/10 text-white font-mono h-12 text-lg"
                data-testid="input-whatsapp-number"
              />
              <p className="text-[10px] text-zinc-600 mt-1.5">
                Sin "+" ni espacios. Ej: <span className="font-mono text-emerald-400">573001234567</span> (Colombia)
              </p>
            </div>
            <Button
              onClick={handleSavePhone}
              className="w-full h-11 font-bold"
              style={{
                background: saved
                  ? "linear-gradient(135deg,#22c55e,#16a34a)"
                  : "linear-gradient(135deg,#FF2D2D,#CC0000)",
              }}
              data-testid="button-save-whatsapp"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 mr-2" /> Guardado
                </>
              ) : (
                "Guardar Número"
              )}
            </Button>
            {currentNumber && (
              <div
                className="rounded-xl p-3 border text-xs"
                style={{
                  background: "rgba(34,197,94,0.06)",
                  borderColor: "rgba(34,197,94,0.18)",
                }}
              >
                <span className="text-zinc-400">Actual: </span>
                <span className="font-mono font-bold text-emerald-400">{currentNumber}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
