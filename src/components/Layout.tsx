import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass, Flame, Library, Gift, Search, Bell, User, Loader2, Ban } from "lucide-react";
import { useAuthState, useSignOut } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDisplayAvatarUrl } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [user, loading] = useAuthState(auth);
  const [signOut] = useSignOut(auth);
  const [isSuspended, setIsSuspended] = useState(false);
  
  const isDramaPage = location.pathname.startsWith("/drama/");

  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists() && doc.data().isSuspended) {
          setIsSuspended(true);
        } else {
          setIsSuspended(false);
        }
      });
      return () => unsub();
    }
  }, [user]);

  useEffect(() => {
    // Request notification permission if supported
    if ("Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }

    // Simulate an incoming marketing notification after 15 seconds
    const timer = setTimeout(() => {
      sendPushNotification("Diskon Spesial VIP", "Dapatkan cashback 50% untuk langganan pertamamu hari ini juga!");
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  const sendPushNotification = (title: string, body: string) => {
    // 1. In-app toast 
    toast.message(title, {
       description: body,
    });
    
    // 2. Real Web Push using browser native if granted
    if ("Notification" in window && Notification.permission === "granted") {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body,
            icon: "/favicon.svg"
          });
        }).catch(() => {
          // Fallback if SW fails
          new Notification(title, { body, icon: "/favicon.svg" });
        });
      } else {
        new Notification(title, {
          body,
          icon: "/favicon.svg" // Placeholder icon
        });
      }
    }
  };

  const manuallyTriggerPush = () => {
    if ("Notification" in window) {
      if (Notification.permission === "default" || Notification.permission === "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            sendPushNotification("Akses Diberikan!", "Kamu akan menerima update episode terbaru di sini.");
          } else {
            toast.error("Izin notifikasi ditolak", { description: "Nyalakan izin di pengaturan browser untuk mendapat notifikasi."});
          }
        });
      } else {
        sendPushNotification("Cek Update Terbaru!", "Episode baru telah tayang. Segera tonton sebelum ketinggalan.");
      }
    } else {
      toast.error("Browser tidak mendukung notifikasi");
    }
  };

  if (isSuspended) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-black text-white p-4">
        <div className="max-w-md w-full bg-red-950/20 border border-red-500/50 p-8 rounded-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <Ban className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-red-500">Akun Ditangguhkan</h1>
          <p className="text-muted-foreground whitespace-pre-wrap">
            Sistem kami mendeteksi adanya aktivitas mencurigakan (Fraud / Penuyulan) dari akun Anda.
            {'\n\n'}
            Akun ini telah ditangguhkan secara permanen dan tidak dapat digunakan lagi.
          </p>
          <Button variant="destructive" className="w-full" onClick={() => signOut()}>
            Keluar
          </Button>
        </div>
      </div>
    );
  }

  if (isDramaPage) {
    return (
      <div className="bg-black w-full h-[100dvh] text-foreground relative overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border flex flex-col p-6 shrink-0 z-20 bg-background hidden md:flex">
        <Link to="/" className="flex items-center gap-2 mb-10 group">
          <div className="w-8 h-8 bg-gradient-to-tr from-primary to-rose-600 rounded-lg flex items-center justify-center font-bold text-black shadow-lg shadow-primary/20">
            D
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground group-hover:to-foreground transition-all leading-tight">
              DRAMABOX LITE
            </span>
          </div>
        </Link>
        
        <nav className="space-y-6 flex-1">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2">Menu</p>
            <Link 
              to="/" 
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${location.pathname === "/" ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Compass className="w-5 h-5" />
              <span className="font-medium">Discovery</span>
            </Link>
            <Link 
              to="/popular" 
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${location.pathname === "/popular" ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Flame className="w-5 h-5" />
              <span className="font-medium">Popular</span>
            </Link>
            <Link 
              to="/library" 
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${location.pathname === "/library" ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Library className="w-5 h-5" />
              <span className="font-medium">Library</span>
            </Link>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2">Personal</p>
            <Link 
              to="/profile" 
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${location.pathname === "/profile" ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">{user ? "Profile" : "Sign In"}</span>
            </Link>
            <Link 
              to="#" 
              className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Gift className="w-5 h-5" />
              <span className="font-medium font-mono text-sm uppercase">840 Coins</span>
            </Link>
          </div>
        </nav>

        <div className="mt-auto p-4 bg-secondary/50 rounded-2xl border border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Daily Bonus</p>
          <div className="w-full bg-secondary h-1.5 rounded-full mb-3 overflow-hidden">
            <div className="bg-primary w-3/4 h-full rounded-full"></div>
          </div>
          <button className="w-full py-2 bg-primary text-primary-foreground font-bold rounded-lg text-sm uppercase tracking-tight hover:brightness-110 transition-all">
            Claim Rewards
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-md sticky top-0 z-10 border-b md:border-none border-border">
          
          <div className="flex items-center gap-4 md:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-primary to-rose-600 rounded-lg flex items-center justify-center font-bold text-black shadow-lg">
                D
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground transition-all leading-tight">
                  DRAMABOX LITE
                </span>
              </div>
            </Link>
          </div>

          <div className="relative w-full max-w-md hidden sm:block">
            <input 
              type="text" 
              placeholder="Search for dramas, tags, or actors..." 
              className="w-full bg-secondary border border-border rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all text-foreground placeholder:text-muted-foreground" 
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-3" />
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <button onClick={manuallyTriggerPush} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors" title="Test Push Notification">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0 relative">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-background/95 backdrop-blur-xl border-t border-border z-50">
        <div className="flex items-center justify-around h-16 px-2">
          <Link to="/" className={`flex flex-col items-center justify-center space-y-1 w-16 h-full ${location.pathname === "/" ? "text-primary" : "text-muted-foreground"}`}>
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-medium">Discovery</span>
          </Link>
          <Link to="/popular" className={`flex flex-col items-center justify-center space-y-1 w-16 h-full ${location.pathname === "/popular" ? "text-primary" : "text-muted-foreground"} hover:text-primary transition-colors`}>
            <Flame className="w-5 h-5" />
            <span className="text-[10px] font-medium">Popular</span>
          </Link>
          <Link to="/search" className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-primary text-black transform -translate-y-4 shadow-lg shadow-primary/25 border-4 border-background">
            <Search className="w-5 h-5" />
          </Link>
          <Link to="/library" className={`flex flex-col items-center justify-center space-y-1 w-16 h-full ${location.pathname === "/library" ? "text-primary" : "text-muted-foreground"} hover:text-primary transition-colors`}>
            <Library className="w-5 h-5" />
            <span className="text-[10px] font-medium">Library</span>
          </Link>
          <Link to={user ? "/profile" : "/auth"} className={`flex flex-col items-center justify-center space-y-1 w-16 h-full ${location.pathname === "/profile" ? "text-primary" : "text-muted-foreground"} hover:text-primary transition-colors`}>
            {user ? (
               <Avatar className="w-6 h-6 border-2 border-background">
                 <AvatarImage src={getDisplayAvatarUrl(user.photoURL)} />
                 <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold text-[10px]">
                   {user.displayName?.charAt(0) || 'U'}
                 </AvatarFallback>
               </Avatar>
            ) : (
              <User className="w-5 h-5" />
            )}
            <span className="text-[10px] font-medium">{user ? 'Me' : 'Sign In'}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
