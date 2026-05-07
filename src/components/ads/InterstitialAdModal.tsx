import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { AdsterraBanner } from "./AdsterraBanner";

interface InterstitialAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  countdownSeconds?: number;
}

export function InterstitialAdModal({ 
  isOpen, 
  onClose, 
  countdownSeconds = 5 
}: InterstitialAdModalProps) {
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(countdownSeconds);
      setCanClose(false);
      return;
    }

    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanClose(true);
    }

    return () => clearTimeout(timer);
  }, [isOpen, countdown, countdownSeconds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-card/80 border border-border shadow-2xl rounded-2xl p-6 flex flex-col items-center shadow-primary/10">
        
        {canClose ? (
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-muted/50 text-foreground rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
           <div className="absolute top-3 right-3 px-3 py-1 bg-muted/50 text-foreground text-xs font-mono rounded-full flex items-center">
             Teruskan dalam {countdown}
           </div>
        )}

        <h3 className="text-foreground font-semibold mb-4 text-center text-sm">Pesan Sponsor Singkat</h3>
        
        {/* Kontainer Iklan Banner 300x250 */}
        <div className="w-[300px] h-[250px] bg-black/40 rounded-xl overflow-hidden flex items-center justify-center ring-1 ring-border shadow-inner">
          <AdsterraBanner idWeb="35836314ba45252fb775ef568345515c" width={300} height={250} />
        </div>

        <p className="text-muted-foreground text-xs mt-4 text-center">
          Iklan ini membantu kami menjaga server tetap hidup. Terima kasih dukungannya!
        </p>
      </div>
    </div>
  );
}
