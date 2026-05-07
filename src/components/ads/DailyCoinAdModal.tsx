import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle, Loader2, CalendarCheck } from "lucide-react";

interface DailyCoinAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdCompleted: () => void;
  directLinkUrl?: string;
  rewardCoins: number;
}

export function DailyCoinAdModal({ 
  isOpen, 
  onClose, 
  onAdCompleted,
  directLinkUrl = "https://www.profitablecpmratenetwork.com/rht0emcwih?key=a1b66a02b8f0353bfff9eb2d291362d7", // Direct Link Adsterra
  rewardCoins
}: DailyCoinAdModalProps) {
  const [isWatching, setIsWatching] = useState(false);
  const [countdown, setCountdown] = useState(15); // Wajib tunggu 15 detik setelah klik

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isWatching && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (isWatching && countdown === 0) {
      setIsWatching(false);
      onAdCompleted();
    }
    return () => clearTimeout(timer);
  }, [isWatching, countdown, onAdCompleted]);

  useEffect(() => {
    if (!isOpen) {
      setIsWatching(false);
      setCountdown(15);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleWatchAd = () => {
    // Buka tab baru ke Direct Link
    window.open(directLinkUrl, "_blank");
    setIsWatching(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card border border-border shadow-2xl rounded-3xl p-6 text-center shadow-primary/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
        
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
             <CalendarCheck className="w-8 h-8 text-amber-500" />
          </div>
          
          <h2 className="text-xl font-bold mb-2">Klaim {rewardCoins} Koin</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Tonton iklan sponsor singkat untuk mendapatkan {rewardCoins} koin gratis hari ini.
          </p>

          {!isWatching ? (
             <div className="w-full space-y-3">
               <Button className="w-full font-bold h-12 rounded-xl text-md" onClick={handleWatchAd}>
                 <PlayCircle className="w-5 h-5 mr-2" />
                 Tonton Iklan (15s)
               </Button>
               <Button variant="ghost" onClick={onClose} className="text-muted-foreground w-full">
                 Lain Kali
               </Button>
             </div>
          ) : (
            <div className="w-full flex flex-col items-center space-y-4 py-4">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
               <div className="text-center">
                 <p className="font-semibold text-lg text-primary">{countdown}s</p>
                 <p className="text-xs text-muted-foreground">Mohon tunggu, koin sedang disiapkan...</p>
               </div>
               <p className="text-[10px] text-muted-foreground/60 w-full text-center">Jangan tutup jendela ini sebelum waktu habis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
