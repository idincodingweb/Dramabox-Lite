import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDisplayAvatarUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Camera, Check, Shield, Bell, CreditCard, PlayCircle, User, Key, Smartphone, AlertTriangle, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useVipQuest } from "@/hooks/useVipQuest";
import { Progress } from "@/components/ui/progress";

export function SettingsPage() {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pwdResetSent, setPwdResetSent] = useState(false);
  const [appLanguage, setAppLanguage] = useState("en");
  const [autoplay, setAutoplay] = useState(true);
  const [cellularPlay, setCellularPlay] = useState(true);
  const [quality, setQuality] = useState("auto");
  const [notifNewReleases, setNotifNewReleases] = useState(true);
  const [notifNewsletters, setNotifNewsletters] = useState(true);
  const [notifSpecialOffers, setNotifSpecialOffers] = useState(false);
  const [deviceId, setDeviceId] = useState("");

  const { stats, loading: questLoading, isEligible, GOAL_MINUTES, GOAL_DAYS, claimVip } = useVipQuest();
  const [isClaiming, setIsClaiming] = useState(false);
  const [isVip, setIsVip] = useState(false);

  // Avatar state
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      // Fetch current VIP status from firestore
      import("@/lib/userService").then(({ getUserProfile }) => {
        getUserProfile(user.uid).then(profile => {
          if (profile?.isVip) setIsVip(true);
          if (profile?.deviceId) setDeviceId(profile.deviceId);
          if (profile?.settings) {
            if (profile.settings.language) setAppLanguage(profile.settings.language);
            if (profile.settings.autoplay !== undefined) setAutoplay(profile.settings.autoplay);
            if (profile.settings.cellularPlay !== undefined) setCellularPlay(profile.settings.cellularPlay);
            if (profile.settings.quality) setQuality(profile.settings.quality);
            if (profile.settings.notifNewReleases !== undefined) setNotifNewReleases(profile.settings.notifNewReleases);
            if (profile.settings.notifNewsletters !== undefined) setNotifNewsletters(profile.settings.notifNewsletters);
            if (profile.settings.notifSpecialOffers !== undefined) setNotifSpecialOffers(profile.settings.notifSpecialOffers);
          }
        });
      });
    }
  }, [user]);

  const saveSettings = async (updates: any) => {
    if (!user) return;
    try {
      const { db } = await import("@/lib/firebase");
      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
      const userRef = doc(db, "users", user.uid);
      
      const currentSettings = {
        language: appLanguage,
        autoplay,
        cellularPlay,
        quality,
        notifNewReleases,
        notifNewsletters,
        notifSpecialOffers
      };

      await updateDoc(userRef, {
        settings: { ...currentSettings, ...updates },
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const handleClaimVip = async () => {
    setIsClaiming(true);
    const success = await claimVip();
    if (success) {
      setIsVip(true);
      alert("Selamat! Anda sekarang adalah member VIP Gratis.");
    } else {
      alert("Gagal mengklaim VIP. Silakan coba lagi nanti.");
    }
    setIsClaiming(false);
  };

  const eligibleDaysCount = stats.filter(s => s.watchTimeMinutes >= GOAL_MINUTES).length;
  const progressPercentage = (eligibleDaysCount / GOAL_DAYS) * 100;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Maks 2MB");
      return;
    }
    
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Do not reset the ref value here immediately as it might interfere,
    // let it be, we use the state avatarFile anyway.
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setSuccess(false);
    
    try {
      let finalPhotoUrl = user.photoURL;

      if (avatarFile && avatarPreview) {
        const webhookUrl = import.meta.env.VITE_GAS_WEBHOOK_URL;
        if (webhookUrl) {
          const base64data = avatarPreview.split(',')[1];
          try {
            const response = await fetch(webhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "text/plain;charset=utf-8"
              },
              body: JSON.stringify({
                action: "uploadAvatar",
                file: {
                  filename: avatarFile.name,
                  mimeType: avatarFile.type,
                  base64: base64data
                }
              })
            });
            const result = await response.json();
            if (result.status === "success" && result.url) {
              finalPhotoUrl = result.url;
            } else {
              console.error("Upload failed in GAS", result);
              finalPhotoUrl = avatarPreview; // fallback
            }
          } catch (uploadError) {
             console.error("GAS network error, falling back to base64", uploadError);
             // fallback to base64 string
             // Note: Firebase Auth has length limits on photoURL, but we try anyway.
             finalPhotoUrl = avatarPreview;
          }
        } else {
          // No GAS webhook, fallback to base64
          finalPhotoUrl = avatarPreview;
        }
      } else if (avatarPreview === null && avatarFile === null && user.photoURL) {
        // Did they remove the avatar? If we support removal via state:
        // Wait, their code implements removal by un-setting the local state. But if it was already set, we probably want to leave it alone unless they explicitly deleted it.
        // If we want to support explicit deletion, we'd need another flag. For now, if avatarPreview is null but they didn't explicitly delete it from Firebase, leave finalPhotoUrl as user.photoURL.
        // To implement deletion properly we'd need a separate flag. The UI code below shows "Remove avatar" which sets avatarPreview to null.
        // Actually, their provided code shows previewing what's coming next.
      }

      await updateProfile(user, {
        displayName: displayName,
        photoURL: finalPhotoUrl
      });
      
      const webhookUrl = import.meta.env.VITE_GAS_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify({
            action: "syncUser",
            user: {
              uid: user.uid,
              email: user.email,
              displayName: displayName || "",
              photoURL: finalPhotoUrl || ""
            }
          })
        }).catch(e => console.error("GAS sync failed", e));
      }

      setSuccess(true);
      setAvatarFile(null);
      setAvatarPreview(null);
      setTimeout(() => {
        setSuccess(false);
        // Force reload so other components like Navbar pick up the new photoURL/displayName, since updateProfile doesn't trigger onAuthStateChanged
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setPwdResetSent(true);
      setTimeout(() => setPwdResetSent(false), 5000);
    } catch (error) {
      console.error("Error sending password reset:", error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 bg-background/50">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-20">
        <div className="flex items-start md:items-center gap-2 md:gap-4">
          <Button nativeButton={false} variant="ghost" size="icon" render={<Link to="/profile" />} className="rounded-full hover:bg-secondary shrink-0 mt-0.5 md:mt-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-0.5 md:mt-1">Manage your account settings and preferences.</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="w-full md:w-64 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="flex flex-row md:flex-col h-auto w-max md:w-full bg-transparent p-1 md:p-0 items-center md:items-start justify-start space-x-2 md:space-x-0 md:space-y-1 pb-2 md:pb-0 border-b md:border-b-0 border-border/50 md:border-transparent">
              <TabsTrigger value="general" className="w-auto md:w-full justify-start gap-2 md:gap-3 px-4 py-2.5 md:py-3 data-[state=active]:bg-secondary data-[state=active]:text-foreground text-muted-foreground hover:bg-secondary/50 rounded-full md:rounded-xl transition-all shrink-0">
                <User className="w-4 h-4 md:w-5 md:h-5" /> General
              </TabsTrigger>
              <TabsTrigger value="subscription" className="w-auto md:w-full justify-start gap-2 md:gap-3 px-4 py-2.5 md:py-3 data-[state=active]:bg-secondary data-[state=active]:text-foreground text-muted-foreground hover:bg-secondary/50 rounded-full md:rounded-xl transition-all shrink-0">
                <CreditCard className="w-4 h-4 md:w-5 md:h-5" /> Subscription
              </TabsTrigger>
              <TabsTrigger value="playback" className="w-auto md:w-full justify-start gap-2 md:gap-3 px-4 py-2.5 md:py-3 data-[state=active]:bg-secondary data-[state=active]:text-foreground text-muted-foreground hover:bg-secondary/50 rounded-full md:rounded-xl transition-all shrink-0">
                <PlayCircle className="w-4 h-4 md:w-5 md:h-5" /> Playback
              </TabsTrigger>
              <TabsTrigger value="notifications" className="w-auto md:w-full justify-start gap-2 md:gap-3 px-4 py-2.5 md:py-3 data-[state=active]:bg-secondary data-[state=active]:text-foreground text-muted-foreground hover:bg-secondary/50 rounded-full md:rounded-xl transition-all shrink-0">
                <Bell className="w-4 h-4 md:w-5 md:h-5" /> Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="w-auto md:w-full justify-start gap-2 md:gap-3 px-4 py-2.5 md:py-3 data-[state=active]:bg-secondary data-[state=active]:text-foreground text-muted-foreground hover:bg-secondary/50 rounded-full md:rounded-xl transition-all shrink-0">
                <Shield className="w-4 h-4 md:w-5 md:h-5" /> Security
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 space-y-6">
            <TabsContent value="general" className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm border-none shadow-none md:border-solid md:shadow-sm">
                <CardHeader>
                  <CardTitle>Profile Details</CardTitle>
                  <CardDescription>
                    Update your personal information and how it appears to others.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSave}>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-8 items-start">
                      <div className="relative group cursor-pointer shrink-0 mx-auto sm:mx-0" onClick={() => fileInputRef.current?.click()}>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleAvatarSelect} 
                        />
                        <Avatar className={`w-28 h-28 border-4 border-background shadow-xl ${isSaving ? 'opacity-50' : ''}`}>
                          <AvatarImage src={avatarPreview || getDisplayAvatarUrl(user.photoURL)} alt={displayName || 'User'} />
                          <AvatarFallback className="text-3xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold">
                            {displayName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {isSaving ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                            <Camera className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-medium uppercase tracking-wider">Change</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-5 w-full">
                        <div className="space-y-2 text-left">
                          <Label htmlFor="email" className="text-muted-foreground font-medium">Email Address</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            value={user.email || ""} 
                            disabled 
                            className="bg-secondary/30 border-border/50 text-muted-foreground font-medium"
                          />
                        </div>
                        <div className="space-y-2 text-left">
                          <Label htmlFor="displayName" className="font-medium">Display Name</Label>
                          <Input 
                            id="displayName" 
                            value={displayName} 
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your name"
                            required
                            className="bg-background/50 focus-visible:ring-primary/50"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t border-border/50 pt-6">
                    <Button type="submit" disabled={isSaving || (displayName === user.displayName && !avatarFile)} className="gap-2 px-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : success ? (
                        <>
                          <Check className="w-4 h-4" />
                          Saved Successfully
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Language & Region</CardTitle>
                  <CardDescription>
                    Choose your preferred language for the interface.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-medium">App Language</Label>
                    <Select value={appLanguage} onValueChange={(val) => { setAppLanguage(val); saveSettings({ language: val }); }}>
                      <SelectTrigger className="w-full md:w-[300px]">
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English (US)</SelectItem>
                        <SelectItem value="id">Bahasa Indonesia</SelectItem>
                        <SelectItem value="zh">Chinese (Simplified)</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="ko">Korean</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription" className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <Card className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-indigo-500/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                  <CreditCard className="w-32 h-32" />
                </div>
                <CardHeader>
                  <CardTitle>Member Status</CardTitle>
                  <CardDescription>
                    {isVip ? "You are a Premium VIP Member." : "Current Plan: Free Tier"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isVip ? (
                    <div className="flex items-center gap-4 p-5 rounded-2xl bg-primary/20 border border-primary/30">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                        <Shield className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-primary">VIP Premium</h3>
                        <p className="text-sm opacity-80">Nikmati tontonan tanpa iklan dan kualitas HD.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50">
                      <div>
                        <h3 className="font-bold text-lg">Free Tier</h3>
                        <p className="text-sm text-muted-foreground">Ad-supported viewing, basic resolution.</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">$0</p>
                        <p className="text-xs text-muted-foreground">/ month</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                {!isVip && (
                  <CardFooter className="pt-2 flex flex-col gap-4">
                    <Separator className="bg-border/50" />
                    <div className="w-full space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <Clock className="w-4 h-4 text-primary" />
                           <h4 className="font-bold text-sm">Free VIP Quest</h4>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{eligibleDaysCount}/{GOAL_DAYS} Days</span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Tonton minimum {GOAL_MINUTES / 60} jam per hari selama {GOAL_DAYS} hari untuk mendapatkan VIP Premium Gratis!
                      </p>

                      <Progress value={progressPercentage} className="h-2 bg-secondary" />
                      
                      {isEligible ? (
                        <Button 
                          onClick={handleClaimVip}
                          disabled={isClaiming}
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-full py-6 text-lg animate-pulse"
                        >
                          {isClaiming ? "Claiming..." : "KLAIM VIP GRATIS SEKARANG!"}
                        </Button>
                      ) : (
                        <Button variant="outline" disabled className="w-full border-dashed border-2 rounded-full py-6">
                           Belum Memenuhi Syarat
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                )}
              </Card>
              
              {!isVip && (
                <Card className="bg-secondary/20 border-border/50">
                   <CardHeader className="pb-3">
                     <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Quest Progress</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-3">
                     {questLoading ? (
                       <div className="flex justify-center p-4">
                         <Loader2 className="w-6 h-6 animate-spin" />
                       </div>
                     ) : stats.length === 0 ? (
                       <p className="text-sm text-center py-4 text-muted-foreground">Mulai menonton drama hari ini untuk memulai quest!</p>
                     ) : (
                       stats.map((day) => (
                         <div key={day.date} className="flex items-center justify-between text-sm py-1">
                           <span className="font-mono">{day.date}</span>
                           <div className="flex items-center gap-2">
                             <span className={day.watchTimeMinutes >= GOAL_MINUTES ? "text-green-500 font-bold" : "text-muted-foreground"}>
                               {Math.floor(day.watchTimeMinutes / 60)}j {day.watchTimeMinutes % 60}m
                             </span>
                             {day.watchTimeMinutes >= GOAL_MINUTES ? (
                               <Check className="w-4 h-4 text-green-500" />
                             ) : (
                               <Clock className="w-4 h-4 text-muted-foreground opacity-50" />
                             )}
                           </div>
                         </div>
                       ))
                     )}
                   </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="playback" className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Video Preferences</CardTitle>
                  <CardDescription>
                    Customize how you watch your favorite dramas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">Autoplay Next Episode</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically play the next episode when current one ends.
                      </p>
                    </div>
                    <Switch 
                      checked={autoplay} 
                      onCheckedChange={(val) => { setAutoplay(val); saveSettings({ autoplay: val }); }} 
                    />
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">Play over Cellular</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow video playback on mobile data networks.
                      </p>
                    </div>
                    <Switch 
                      checked={cellularPlay} 
                      onCheckedChange={(val) => { setCellularPlay(val); saveSettings({ cellularPlay: val }); }} 
                    />
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Default Video Quality</Label>
                    <Select value={quality} onValueChange={(val) => { setQuality(val); saveSettings({ quality: val }); }}>
                      <SelectTrigger className="w-full md:w-[300px]">
                        <SelectValue placeholder="Select Quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto (Recommended)</SelectItem>
                        <SelectItem value="1080p">1080p HD</SelectItem>
                        <SelectItem value="720p">720p</SelectItem>
                        <SelectItem value="480p">Data Saver (480p)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Notification System</CardTitle>
                  <CardDescription>
                    Control what alerts you receive.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">New Releases</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when new episodes of your favorites drop.
                      </p>
                    </div>
                    <Switch 
                      checked={notifNewReleases} 
                      onCheckedChange={(val) => { setNotifNewReleases(val); saveSettings({ notifNewReleases: val }); }} 
                    />
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">Email Newsletters</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive recommendations and weekly roundups via email.
                      </p>
                    </div>
                    <Switch 
                      checked={notifNewsletters} 
                      onCheckedChange={(val) => { setNotifNewsletters(val); saveSettings({ notifNewsletters: val }); }} 
                    />
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">Special Offers</Label>
                      <p className="text-sm text-muted-foreground">
                        Notifications about premium discounts and deals.
                      </p>
                    </div>
                    <Switch 
                      checked={notifSpecialOffers} 
                      onCheckedChange={(val) => { setNotifSpecialOffers(val); saveSettings({ notifSpecialOffers: val }); }} 
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Security & Access</CardTitle>
                  <CardDescription>
                    Manage your credentials and attached devices.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/50 bg-secondary/20">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Key className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Password</h4>
                        <p className="text-sm text-muted-foreground">
                          {user.providerData[0]?.providerId === 'google.com' 
                            ? "You log in via Google. Password changes are handled by Google."
                            : "Change your account password securely."}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handlePasswordReset}
                      disabled={user.providerData[0]?.providerId === 'google.com' || pwdResetSent}
                    >
                      {pwdResetSent ? "Email Sent" : "Reset Password"}
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/50 bg-secondary/20">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Connected Device</h4>
                        <p className="text-[10px] font-mono opacity-50 mb-1">{deviceId || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">Manage device signed into your account.</p>
                      </div>
                    </div>
                    <Button variant="outline">Manage</Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button variant="destructive" className="rounded-full font-semibold">Delete Account</Button>
                </CardContent>
              </Card>
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </div>
  );
}

