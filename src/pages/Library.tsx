import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { getFavorites, getWatchHistory, FavoriteItem, WatchHistoryItem } from "@/lib/userService";
import { Library, Heart, Search, Loader2, Clock, History } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getProxyImageUrl } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export function LibraryPage() {
  const [user, loading] = useAuthState(auth);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (user) {
        try {
          setDataLoading(true);
          const [favs, hist] = await Promise.all([
            getFavorites(user.uid),
            getWatchHistory(user.uid)
          ]);
          setFavorites(favs);
          setHistory(hist);
        } catch (e) {
          console.error("Failed to load library data", e);
        } finally {
          setDataLoading(false);
        }
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 w-full p-4 md:p-8 bg-background pb-20 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="flex flex-col space-y-2">
                <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center bg-background text-foreground space-y-4">
        <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-4 text-muted-foreground">
          <Heart className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold">Harap Login</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Login untuk melihat favorit dan riwayat tontonan Anda.
        </p>
        <Link to="/auth">
          <Button size="lg" className="mt-4 rounded-full px-8">
            Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full p-4 md:p-8 bg-background pb-20 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 border-b border-border/50 pb-4">
          <div className="bg-primary/20 p-2 rounded-lg text-primary">
             <Library className="w-6 h-6" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">My Library</h1>
        </div>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              Riwayat
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="w-4 h-4" />
              Favorit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            {dataLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="flex flex-col space-y-2">
                    <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : history.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {history.map((hist) => (
                    <Link to={`/drama/${hist.dramaId}?chap=${hist.lastWatchedChapterId}`} key={hist.dramaId} className="group flex flex-col space-y-2">
                       <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-secondary relative">
                          <img src={getProxyImageUrl(hist.cover)} alt={hist.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                             <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded w-max">Lanjut Eps {hist.lastWatchedChapterName || '?'}</div>
                          </div>
                          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                             <Clock className="w-3 h-3" />
                             <span>Eps {hist.lastWatchedChapterName || '?'}</span>
                          </div>
                       </div>
                       <h3 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {hist.title || "Unknown Title"}
                       </h3>
                    </Link>
                 ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                 <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center">
                    <History className="w-10 h-10 text-muted-foreground/50" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold">Belum ada tontonan</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Drama yang Anda tonton akan otomatis tersimpan di sini.</p>
                 </div>
                 <Link to="/">
                   <Button className="mt-4 font-bold rounded-full">Jelajahi Drama</Button>
                 </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {dataLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="flex flex-col space-y-2">
                    <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : favorites.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {favorites.map((fav) => (
                    <Link to={`/drama/${fav.dramaId}`} key={fav.dramaId} className="group flex flex-col space-y-2">
                       <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-secondary relative">
                          <img src={getProxyImageUrl(fav.cover)} alt={fav.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                             <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded w-max">Tonton Lagi</div>
                          </div>
                       </div>
                       <h3 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {fav.title || "Unknown Title"}
                       </h3>
                    </Link>
                 ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                 <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center">
                    <Search className="w-10 h-10 text-muted-foreground/50" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold">Favorit kosong</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Jelajahi koleksi kami dan tekan ikon hati untuk menyimpan drama favorit Anda di sini.</p>
                 </div>
                 <Link to="/">
                   <Button className="mt-4 font-bold rounded-full">Explore Drama</Button>
                 </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
