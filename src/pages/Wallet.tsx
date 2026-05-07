import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile, UserProfile, requestWithdrawal, getWithdrawals, WithdrawalRequest } from "@/lib/userService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Coins, ChevronLeft, Wallet, AlertCircle, Loader2, ArrowRightLeft, Landmark, History, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Conversion rate: 1000 Coins = Rp 5000 (1 Coin = Rp 5)
const COIN_TO_IDR_RATE = 5;

// Minimum withdrawal amount
const MIN_WITHDRAWAL_COINS = 30000;

export function WalletPage() {
  const [user, loading] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [withdrawAmountCoins, setWithdrawAmountCoins] = useState<number>(0);
  const [withdrawMethod, setWithdrawMethod] = useState<string>("dana");
  const [accountNumber, setAccountNumber] = useState<string>("");
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const amountIdr = withdrawAmountCoins * COIN_TO_IDR_RATE;

  async function loadData() {
    if (user) {
      try {
        setDataLoading(true);
        const [prof, hist] = await Promise.all([
          getUserProfile(user.uid),
          getWithdrawals(user.uid)
        ]);
        setProfile(prof);
        setWithdrawals(hist);
        
        // Auto-select max coins to withdraw if over min threshold initially
        if (prof && prof.coins !== undefined && prof.coins >= MIN_WITHDRAWAL_COINS && withdrawAmountCoins === 0) {
            setWithdrawAmountCoins(prof.coins);
        }
      } catch (e) {
        console.error("Failed to load wallet data", e);
      } finally {
        setDataLoading(false);
      }
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    
    setErrorMsg("");
    setSuccessMsg("");
    
    if (withdrawAmountCoins < MIN_WITHDRAWAL_COINS) {
      setErrorMsg(`Minimal penarikan adalah ${MIN_WITHDRAWAL_COINS} koin.`);
      return;
    }
    
    if (withdrawAmountCoins > (profile.coins || 0)) {
      setErrorMsg("Koin tidak mencukupi.");
      return;
    }
    
    if (!accountNumber || accountNumber.trim().length < 5) {
      setErrorMsg("Mohon masukkan nomor rekening / e-wallet yang valid.");
      return;
    }
    
    setSubmitting(true);
    try {
      const success = await requestWithdrawal(
        user.uid, 
        profile.coins || 0, 
        withdrawAmountCoins, 
        amountIdr, 
        withdrawMethod, 
        accountNumber
      );
      
      if (success) {
        setSuccessMsg("Permintaan penarikan berhasil dibuat. Mohon tunggu proses pencairan.");
        setWithdrawAmountCoins(0);
        setAccountNumber("");
        await loadData();
      } else {
        setErrorMsg("Gagal melakukan penarikan. Silakan coba lagi.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan sistem.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatIdr = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };
  
  const formatDate = (ts: any) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <h2 className="text-2xl font-bold">Harap Login</h2>
        <p className="text-muted-foreground text-center">Login untuk mengakses dompet Anda.</p>
        <Link to="/auth">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-y-auto w-full pb-20 p-4 md:p-8">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Dompet & Tarik Dana</h1>
        </div>
        
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 border-0 text-white shadow-xl shadow-indigo-500/20 overflow-hidden relative">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          
          <CardContent className="p-6 md:p-8 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-indigo-100 font-medium mb-1 flex items-center gap-2">
                   <Wallet className="w-4 h-4" />
                   Saldo Saat Ini
                </p>
                <div className="flex items-end gap-3">
                  <h2 className="text-4xl md:text-5xl font-black drop-shadow-sm">
                    {dataLoading ? <Loader2 className="w-8 h-8 animate-spin inline" /> : formatIdr((profile?.coins || 0) * COIN_TO_IDR_RATE)}
                  </h2>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="font-semibold text-sm">{dataLoading ? '...' : (profile?.coins || 0)} Koin</span>
              </div>
            </div>
            
            <div className="bg-black/20 p-4 rounded-2xl border border-white/10 text-sm space-y-2 backdrop-blur-sm shadow-inner w-full md:w-auto">
               <div className="text-indigo-100 font-semibold mb-2 flex items-center gap-2">
                 <ArrowRightLeft className="w-4 h-4" />
                 Kurs Konversi
               </div>
               <div className="flex justify-between gap-4">
                 <span>1 Koin</span>
                 <span className="font-bold">Rp 5</span>
               </div>
               <div className="flex justify-between gap-4">
                 <span>1.000 Koin</span>
                 <span className="font-bold">Rp 5.000</span>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Landmark className="w-5 h-5 text-primary" />
              Tarik Tunai
            </CardTitle>
            <CardDescription>Cairkan koin kamu menjadi saldo e-wallet atau bank.</CardDescription>
          </CardHeader>
          <CardContent>
            {successMsg && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-3 rounded-lg flex items-start gap-3 mb-6 font-medium text-sm">
                 <CheckCircle2 className="w-5 h-5 shrink-0" />
                 <p>{successMsg}</p>
              </div>
            )}
            
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-start gap-3 mb-6 font-medium text-sm">
                 <AlertCircle className="w-5 h-5 shrink-0" />
                 <p>{errorMsg}</p>
              </div>
            )}
            
            <form onSubmit={handleWithdraw} className="space-y-5">
               <div className="space-y-2">
                 <Label htmlFor="amount">Jumlah Koin yang ditarik</Label>
                 <div className="relative">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-muted-foreground">
                      <Coins className="w-4 h-4 text-yellow-500" />
                   </div>
                   <Input 
                     id="amount" 
                     className="pl-10 text-lg font-bold" 
                     type="number" 
                     min={MIN_WITHDRAWAL_COINS} 
                     max={profile?.coins || 0}
                     value={withdrawAmountCoins || ""}
                     onChange={(e) => setWithdrawAmountCoins(parseInt(e.target.value) || 0)}
                     placeholder={`Min. ${MIN_WITHDRAWAL_COINS}`}
                     disabled={submitting}
                   />
                   <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                     <span className="text-sm font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                       ~ {formatIdr(amountIdr)}
                     </span>
                   </div>
                 </div>
                 <p className="text-xs text-muted-foreground">Minimal penarikan {MIN_WITHDRAWAL_COINS} koin ({formatIdr(MIN_WITHDRAWAL_COINS * COIN_TO_IDR_RATE)}). Koin saat ini: {profile?.coins || 0}.</p>
               </div>
               
               <div className="space-y-2 pt-2">
                 <Label>Metode Penarikan</Label>
                 <Select value={withdrawMethod} onValueChange={setWithdrawMethod} disabled={submitting}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih Metode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dana">DANA</SelectItem>
                      <SelectItem value="gopay">GoPay</SelectItem>
                      <SelectItem value="ovo">OVO</SelectItem>
                      <SelectItem value="shopeepay">ShopeePay</SelectItem>
                      <SelectItem value="bca">Transfer Bank BCA</SelectItem>
                      <SelectItem value="mandiri">Transfer Bank Mandiri</SelectItem>
                      <SelectItem value="bni">Transfer Bank BNI</SelectItem>
                      <SelectItem value="bri">Transfer Bank BRI</SelectItem>
                    </SelectContent>
                 </Select>
               </div>
               
               <div className="space-y-2 pt-2">
                 <Label htmlFor="account">Nomor Rekening / No. HP E-Wallet</Label>
                 <Input 
                   id="account" 
                   value={accountNumber}
                   onChange={e => setAccountNumber(e.target.value)}
                   disabled={submitting}
                   placeholder="Contoh: 081234567890" 
                 />
               </div>
               
               <Button type="submit" disabled={submitting || withdrawAmountCoins < MIN_WITHDRAWAL_COINS || withdrawAmountCoins > (profile?.coins || 0)} className="w-full mt-4 bg-primary text-primary-foreground font-bold shadow-md hover:shadow-lg transition-shadow">
                 {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                 Request Penarikan {formatIdr(amountIdr)}
               </Button>
            </form>
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card className="bg-card border-border/50 shadow-sm mt-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Riwayat Penarikan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             {dataLoading ? (
               <div className="p-8 flex justify-center">
                 <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
               </div>
             ) : withdrawals.length > 0 ? (
               <div className="divide-y divide-border/50">
                 {withdrawals.map((w) => (
                   <div key={w.id} className="p-4 flex flex-wrap items-center justify-between gap-4 bg-card hover:bg-secondary/30 transition-colors">
                     <div className="space-y-1 w-full sm:w-auto flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base">{formatIdr(w.amountIdr)}</span>
                          <span className="text-xs font-medium bg-secondary text-muted-foreground px-2 py-0.5 rounded border border-border">
                            {w.amountCoins} Koin
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 font-medium uppercase">{w.method} - {w.accountNumber}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(w.createdAt)}</p>
                     </div>
                     <div className="flex items-center">
                        {w.status === 'pending' ? (
                          <div className="flex items-center gap-2 text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 text-xs font-bold uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5" />
                            Pending
                          </div>
                        ) : w.status === 'completed' ? (
                          <div className="flex items-center gap-2 text-green-600 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20 text-xs font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Berhasil
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 text-xs font-bold uppercase tracking-wider">
                            <XCircle className="w-3.5 h-3.5" />
                            Ditolak
                          </div>
                        )}
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="p-8 text-center text-muted-foreground">
                 Belum ada riwayat penarikan.
               </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
