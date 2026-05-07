import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Lock, PlayCircle, Loader2, Coins } from "lucide-react";

interface RewardUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: () => void;
  onUnlockWithCoins?: () => void;
  directLinkUrl?: string;
  episodeName: string;
  coinsBalance?: number;
  unlockCost?: number;
}

export function RewardUnlockModal({ 
  isOpen, 
  onClose, 
  onUnlocked,
  onUnlockWithCoins,
  directLinkUrl = "https://www.profitablecpmratenetwork.com/rht0emcwih?key=a1b66a02b8f0353bfff9eb2d291362d7", // Direct Link Adsterra
  episodeName,
  coinsBalance = 0,
  unlockCost = 10
}: RewardUnlockModalProps) {
  const [isWatching, setIsWatching] = useState(false);
  const [countdown, setCountdown] = useState(15); // Wajib tunggu 15 detik setelah klik

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isWatching && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isWatching && countdown === 0) {
      // Sukses menonton iklan / membuang waktu di tab lain
      setIsWatching(false);
      setCountdown(15);
      onUnlocked();
      onClose();
    }
    return () => clearTimeout(timer);
  }, [isWatching, countdown, onUnlocked, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setIsWatching(false);
      setCountdown(15);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleWatchAd = () => {
    // Buka iklan (Direct Link) di tab baru
    window.open(directLinkUrl, "_blank", "noopener,noreferrer");
    
    // Mulai proses countdown penghitungan "telah menonton"
    setIsWatching(true);
  };

  const handleCoinUnlock = () => {
    if (onUnlockWithCoins && coinsBalance >= unlockCost) {
      onUnlockWithCoins();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card border border-border shadow-2xl rounded-3xl p-6 text-center shadow-primary/20 relative overflow-hidden">
        {/* Ornamen Latar */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8" />
          </div>
          
          <h2 className="text-xl font-bold mb-2">Episode Terkunci</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Anda harus menonton pesan sponsor singkat atau menukarkan koin untuk membuka kunci <strong>{episodeName}</strong>.
          </p>

          {!isWatching ? (
             <div className="flex flex-col gap-3 w-full">
               <Button className="w-full font-bold h-12 rounded-xl text-md" onClick={handleWatchAd}>
                 <PlayCircle className="w-5 h-5 mr-2" />
                 Tonton Iklan (Gratis)
               </Button>

               {onUnlockWithCoins && (
                 <Button 
                   variant="outline" 
                   className="w-full font-bold h-12 rounded-xl text-md" 
                   onClick={handleCoinUnlock}
                   disabled={coinsBalance < unlockCost}
                 >
                   <Coins className="w-5 h-5 mr-2 text-yellow-500" />
                   Buka dengan {unlockCost} Koin 
                   <span className="font-normal text-xs ml-1 opacity-70">({coinsBalance})</span>
                 </Button>
               )}

               <Button variant="ghost" onClick={onClose} className="text-muted-foreground w-full">
                 Kembali
               </Button>
             </div>
          ) : (
             <div className="flex flex-col items-center justify-center space-y-4 py-4 w-full">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
               <p className="text-sm font-medium">
                 Menunggu konfirmasi sponsor...
               </p>
               <div className="w-full bg-secondary rounded-full h-2 mt-4 overflow-hidden relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${((15 - countdown) / 15) * 100}%` }}
                  ></div>
               </div>
               <p className="text-xs text-muted-foreground font-mono">
                 00:{countdown.toString().padStart(2, '0')}
               </p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
