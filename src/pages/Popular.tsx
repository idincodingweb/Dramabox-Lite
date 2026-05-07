import React, { useEffect, useState } from "react";
import { Flame, Play, Eye } from "lucide-react";
import { getDramaList } from "@/services/api";
import { getPopularDramaStats } from "@/lib/userService";
import { Drama } from "@/types";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { getProxyImageUrl } from "@/lib/utils";

export function PopularPage() {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPopular() {
      setLoading(true);
      try {
        const [allDramas, popularStats] = await Promise.all([
          getDramaList(),
          getPopularDramaStats(30)
        ]);

        // Create a map of drama ID to stats
        const statsMap = new Map<string, any>();
        popularStats.forEach((stat: any) => {
          statsMap.set(stat.dramaId, stat);
        });

        // Import the boost function logic or use the stats if available
        // Since we can't easily import the private boostStats from userService.ts here
        // let's just make sure we fetch all dramas and if stats don't exist, we fallback
        // But getPopularDramaStats already uses boostStats. 
        // The problem is only dramas that have AT LEAST 1 REAL VIEW are in popularStats.

        // Actually, we can just call getDramaStats for each if we want, but that's slow.
        // Let's just calculate the fake base in the component if stats are missing.
        const calculateBaseViews = (id: string) => {
           let hash = 0;
           for (let i = 0; i < id.length; i++) {
             hash = ((hash << 5) - hash) + id.charCodeAt(i);
             hash |= 0; 
           }
           return 12000 + (Math.abs(hash) % 77000);
        };

        const processedDramas = allDramas.map(drama => {
          const stats = statsMap.get(drama.bookId);
          return {
            ...drama,
            views: stats ? stats.views : calculateBaseViews(drama.bookId)
          };
        }).sort((a, b) => (b.views || 0) - (a.views || 0));

        setDramas(processedDramas.slice(0, 30));
      } catch (error) {
        console.error("Error loading popular dramas:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPopular();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <Flame className="w-8 h-8 text-rose-500 animate-pulse" />
          <h1 className="text-2xl font-bold">Terpopuler Hari Ini</h1>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
          <Flame className="w-8 h-8 text-rose-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Terpopuler Hari Ini</h1>
          <p className="text-sm text-muted-foreground">Drama paling banyak ditonton saat ini</p>
        </div>
      </div>

      {dramas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
             <Flame className="w-16 h-16 mb-4" />
             <p>Belum ada data drama populer.</p>
          </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {dramas.map((drama, index) => (
            <Link 
              key={drama.bookId} 
              to={`/drama/${drama.bookId}`}
              className="group relative flex flex-col gap-3 transition-transform hover:scale-[1.02]"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lg group-hover:shadow-primary/20">
                <img 
                  src={getProxyImageUrl(drama.coverWap || drama.cover)} 
                  alt={drama.bookName}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/40 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <Play className="w-6 h-6 text-primary-foreground fill-current" />
                   </div>
                </div>
                
                {/* Popularity Rank Badge */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10 uppercase tracking-widest">
                  #{index + 1}
                </div>

                {/* View Count Overlay */}
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10">
                   <Eye className="w-3 h-3 text-primary" />
                   {(drama as any).views > 0 ? (drama as any).views.toLocaleString() : "0"}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">{drama.bookName}</h3>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{drama.introduction}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
