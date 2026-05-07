import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, logout } from "@/lib/firebase";
import { getUserProfile, getWatchHistory, UserProfile, WatchHistoryItem, claimDailyCheckIn, submitReferralCode } from "@/lib/userService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDisplayAvatarUrl, getProxyImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Coins, Settings, LogOut, Clock, Heart, ChevronRight, Loader2, PlayCircle, CalendarCheck, Landmark, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { DailyCoinAdModal } from "@/components/ads/DailyCoinAdModal";
import { logActivityToGAS } from "@/lib/analytics";

export function ProfilePage() {
  const [user, loading] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Claim Coins State
  const [claiming, setClaiming] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);

  // Referral State
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [submittingReferral, setSubmittingReferral] = useState(false);
  const [referralMessage, setReferralMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  async function loadData() {
    if (user) {
      try {
        setDataLoading(true);
        const [prof, hist] = await Promise.all([
          getUserProfile(user.uid),
          getWatchHistory(user.uid)
        ]);
        setProfile(prof);
        setHistory(hist);
      } catch (e) {
        console.error("Failed to load profile data", e);
      } finally {
        setDataLoading(false);
      }
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  const invokeAdModal = () => {
    if (!user || claiming || isCheckedInToday()) return;
    setShowAdModal(true);
  };

  const handleClaimCoinsSuccess = async () => {
    if (!user || claiming) return;
    setClaiming(true);
    setShowAdModal(false);
    try {
      const success = await claimDailyCheckIn(user.uid, profile?.checkInStreak || 0, profile?.coins || 0);
      if (success) {
        logActivityToGAS(user.uid, "claim_daily_coin", `Streak: ${(profile?.checkInStreak || 0) + 1}`).catch(console.error);
        await loadData();
      } else {
        alert("Gagal klaim koin hari ini. Coba lagi nanti.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat klaim koin. Silakan coba lagi.");
    } finally {
      setClaiming(false);
    }
  };

  const isCheckedInToday = () => {
    if (!profile?.lastCheckIn) return false;
    const lastDate = profile.lastCheckIn.toDate ? profile.lastCheckIn.toDate() : new Date(profile.lastCheckIn);
    const today = new Date();
    return lastDate.toDateString() === today.toDateString();
  };

  const handleReferralSubmit = async () => {
    if (!user || !profile) return;
    if (!referralCodeInput.trim()) return;
    setSubmittingReferral(true);
    setReferralMessage(null);
    try {
      const result = await submitReferralCode(user.uid, referralCodeInput.trim(), profile);
      setReferralMessage({ type: result.success ? 'success' : 'error', text: result.message });
      if (result.success) {
        setReferralCodeInput("");
        logActivityToGAS(user.uid, "submit_referral", `Referred by: ${referralCodeInput}`).catch(console.error);
        await loadData();
      }
    } catch (err) {
       console.error(err);
       setReferralMessage({ type: 'error', text: 'Terjadi kesalahan jaringan' });
    } finally {
      setSubmittingReferral(false);
    }
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
        <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-4 text-muted-foreground">
          <Settings className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold">Please sign in</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Sign in to view your profile, watch history, and manage your coins and subscriptions.
        </p>
        <Link to="/auth">
          <Button size="lg" className="mt-4 rounded-full px-8">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
          {profile?.isVip && (
             <div className="absolute top-0 right-0 bg-amber-500 text-white font-bold text-xs py-1 px-8 rotate-45 translate-x-6 mt-4 drop-shadow-md">
               VIP
             </div>
          )}
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-xl">
            <AvatarImage src={getDisplayAvatarUrl(user.photoURL)} alt={user.displayName || 'User'} />
            <AvatarFallback className="text-3xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold">
              {user.displayName?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{user.displayName || 'User'}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex justify-center md:justify-start gap-3 mt-4">
              <div className="bg-secondary/50 px-4 py-2 rounded-xl flex items-center gap-2 border border-border/50">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-sm">{profile?.coins || 0} Koin</span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-auto flex flex-col justify-center gap-3 mt-4 md:mt-0">
             <Link to="/wallet" className="w-full">
               <Button variant="outline" className="w-full border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-400 font-semibold gap-2">
                 <Landmark className="w-4 h-4" />
                 Tarik Dana / Dompet
               </Button>
             </Link>
          </div>
        </div>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Daily Check-in Card (Gamification) */}
          <Card className="col-span-1 md:col-span-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-8 h-8 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Misi Check-in Harian</h3>
                  <p className="text-sm text-muted-foreground break-words">Login setiap hari berturut-turut untuk koin gratis. Hari ke-{((profile?.checkInStreak || 0) % 7) + 1}</p>
                </div>
              </div>
              <Button 
                onClick={invokeAdModal}
                disabled={isCheckedInToday() || claiming}
                className={`rounded-full px-8 shrink-0 ${isCheckedInToday() ? 'bg-secondary text-muted-foreground' : 'bg-primary text-primary-foreground'}`}
              >
                {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : isCheckedInToday() ? "Sudah Diklaim" : "Klaim Koin"}
              </Button>
            </CardContent>
          </Card>

          <DailyCoinAdModal 
             isOpen={showAdModal}
             onClose={() => setShowAdModal(false)}
             onAdCompleted={handleClaimCoinsSuccess}
             rewardCoins={10 + ((profile?.checkInStreak || 0) * 5)}
          />

          {/* Referral Card */}
          <Card className="col-span-1 md:col-span-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <Users className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Sistem Kode Referral</h3>
                      <p className="text-sm text-muted-foreground break-words">Bagikan kode Anda ke teman dan dapatkan koin gratis 50 Koin setiap kali ada yang mendaftar menggunakan kode Anda.</p>
                    </div>
                  </div>
                  
                  <div className="bg-background/80 rounded-lg p-4 border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                     <div className="w-full">
                       <p className="text-xs text-muted-foreground font-semibold mb-1">Kode Referral Anda</p>
                       <p className="font-mono text-xl font-bold tracking-widest text-emerald-500 select-all">{profile?.referralCode || '----'}</p>
                     </div>
                     <div className="text-right whitespace-nowrap w-full sm:w-auto">
                        <p className="text-xs text-muted-foreground mb-1">Teman Diundang</p>
                        <p className="font-bold text-lg">{profile?.referralCount || 0} Orang</p>
                     </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-3 p-4 bg-background/50 rounded-xl border border-border/50">
                   <h4 className="font-semibold text-sm">Punya Kode Referral?</h4>
                   {profile?.referredBy ? (
                      <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-center">
                         <p className="text-sm font-semibold text-emerald-600">Anda sudah menggunakan kode referral.</p>
                      </div>
                   ) : (
                      <div className="space-y-3">
                         <div className="flex flex-col sm:flex-row gap-2">
                           <Input 
                             placeholder="Masukkan Kode Referral Teman" 
                             className="uppercase font-mono tracking-widest"
                             value={referralCodeInput}
                             onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                             disabled={submittingReferral}
                           />
                           <Button 
                              onClick={handleReferralSubmit} 
                              disabled={submittingReferral || !referralCodeInput.trim()}
                           >
                             {submittingReferral ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Klaim'}
                           </Button>
                         </div>
                         {referralMessage && (
                           <p className={`text-xs font-semibold ${referralMessage.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                             {referralMessage.text}
                           </p>
                         )}
                      </div>
                   )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-2 bg-card/50 backdrop-blur border-border/50 overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-primary" />
                Recent Watch History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {dataLoading ? (
                 <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                 </div>
              ) : history.length > 0 ? (
                  <div className="flex overflow-x-auto gap-4 p-4 pb-6 snap-x hide-scrollbar">
                    {history.map((item) => (
                       <Link to={`/drama/${item.dramaId}${item.lastWatchedChapterId ? `?chap=${item.lastWatchedChapterId}` : ''}`} key={item.dramaId} className="flex flex-col gap-2 group w-[120px] shrink-0 snap-start">
                          <div className="w-[120px] aspect-[3/4] rounded-lg overflow-hidden bg-secondary shrink-0 relative shadow-md">
                             <img src={getProxyImageUrl(item.cover)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <PlayCircle className="w-8 h-8 text-white" />
                             </div>
                          </div>
                          <div className="flex flex-col">
                             <h4 className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">{item.title!}</h4>
                             <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{item.lastWatchedChapterName ? `Lanjut ${item.lastWatchedChapterName}` : 'EP 1'}</p>
                          </div>
                       </Link>
                    ))}
                  </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-secondary/80 flex items-center justify-center">
                     <Clock className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground text-sm">You haven't watched any dramas yet.</p>
                  <Link to="/">
                    <Button variant="outline" size="sm">
                      Explore Dramas
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="col-span-1 flex flex-col gap-4">
            <Link to="/library" className="group">
              <Card className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/80 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">My Library & Favorites</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </CardContent>
              </Card>
            </Link>

            <Link to="/settings" className="group">
              <Card className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/80 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Account Settings</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </CardContent>
              </Card>
            </Link>

            <button onClick={logout} className="group w-full text-left">
              <Card className="bg-destructive/5 border-destructive/20 hover:bg-destructive/10 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <LogOut className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-destructive">Log Out</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-destructive/50 group-hover:text-destructive transition-colors" />
                </CardContent>
              </Card>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
