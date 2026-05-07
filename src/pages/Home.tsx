import { useEffect, useState } from "react";
import { getDramaList } from "@/services/api";
import { Drama } from "@/types";
import { Hero } from "@/components/Hero";
import { DramaCarousel } from "@/components/DramaCarousel";
import { Loader2, Heart, Award, Coins, X } from "lucide-react";
import { getProxyImageUrl } from "@/lib/utils";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { AdsterraPopunder } from "@/components/ads/AdsterraPopunder";
import { Link } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";

export function HomePage() {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);
  const [showPromoAlert, setShowPromoAlert] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getDramaList();
      const validDramas = data.filter(d => d && d.bookId);
      setDramas(validDramas);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="pb-20">
        <div className="p-4 md:p-8 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-[auto] md:grid-rows-3 gap-4 md:h-[600px] xl:h-[700px]">
            {/* Hero Skeleton */}
            <div className="col-span-1 md:col-span-2 row-span-1 md:row-span-2 bg-secondary rounded-3xl relative overflow-hidden">
               <Skeleton className="w-full h-full" />
            </div>
            
            {/* Recommendation Skeleton hidden mobile */}
            <div className="col-span-1 row-span-1 bg-secondary rounded-3xl p-6 hidden md:flex flex-col justify-between">
               <Skeleton className="w-10 h-10 rounded-2xl" />
               <div className="mt-4 space-y-2">
                 <Skeleton className="h-6 w-3/4" />
                 <Skeleton className="h-4 w-1/2" />
               </div>
            </div>

            {/* Quick Stats Skeleton hidden mobile */}
            <div className="col-span-1 row-span-1 bg-secondary rounded-3xl p-6 hidden md:block">
               <Skeleton className="h-4 w-1/2 mb-4" />
               <div className="space-y-4 text-xs">
                 <Skeleton className="h-2 w-full" />
                 <Skeleton className="h-2 w-4/5" />
               </div>
            </div>

            {/* Vertical Skeleton */}
            <div className="col-span-1 row-span-2 bg-secondary rounded-3xl hidden md:block">
               <Skeleton className="w-full h-full" />
            </div>

            {/* Bottom Grid Items Skeletons */}
            <div className="col-span-1 row-span-1 bg-secondary rounded-3xl hidden md:block">
               <Skeleton className="w-full h-full" />
            </div>
            <div className="col-span-1 md:col-span-2 row-span-1 bg-secondary rounded-3xl p-6">
               <Skeleton className="h-6 w-1/3 mb-2" />
               <Skeleton className="h-4 w-2/3 mb-4" />
               <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-8 mt-4 px-4 md:px-8">
           <Skeleton className="h-8 w-48 mb-4" />
           <div className="flex gap-4 overflow-hidden">
             {[1,2,3,4,5].map(i => (
               <Skeleton key={i} className="w-[120px] md:w-[160px] aspect-[2/3] rounded-xl shrink-0" />
             ))}
           </div>
        </div>
      </div>
    );
  }

  if (!dramas.length) return null;

  const heroDrama = dramas[0];
  const hotDramas = dramas.slice(1, 15);
  const newReleases = dramas.slice(15, 30);
  const topPicks = dramas.slice(30, 45);
  
  return (
    <div className="pb-20">
      <AdsterraPopunder idWeb="YOUR_POPUNDER_ID" />
      
      {(!user && showPromoAlert) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowPromoAlert(false)}
              className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 z-10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <Link to="/auth" className="block group">
              <div className="w-full h-48 bg-muted flex items-center justify-center relative overflow-hidden group">
                <img 
                  src="https://raw.githubusercontent.com/idincodingweb/perkakas/main/memek_data/Buatkan_desain_banner_iklan_berbentuk_202605061627.jpeg" 
                  alt="Promo Login" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <div className="p-5 text-center bg-card">
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-amber-500/20">
                  Klaim Bonus Rp 50.000
                </Button>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Bento Grid Section */}
      <div className="p-4 md:p-8 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-[auto] md:grid-rows-3 gap-4 md:h-[600px] xl:h-[700px]">
          
          <Hero drama={heroDrama} />

          {/* Card: Recommendation */}
          <div className="col-span-1 row-span-1 bg-secondary rounded-3xl p-6 border border-border flex flex-col justify-between hidden md:flex hover:ring-2 hover:ring-primary/20 transition-all">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right pl-2">For You</span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-lg leading-snug line-clamp-2">{hotDramas[0]?.bookName || "Sweet Revenge"}</h3>
              <p className="text-xs text-muted-foreground mt-1">Romance • Drama</p>
            </div>
          </div>

          {/* Card: Quick Stats */}
          <div className="col-span-1 row-span-1 bg-secondary rounded-3xl p-6 border border-border hidden md:block hover:ring-2 hover:ring-primary/20 transition-all">
            <h4 className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-4">
              <Award className="w-4 h-4" /> Weekly Ranking
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-muted italic">01</span>
                <div className="flex-1">
                  <div className="h-2 bg-background rounded-full w-full mb-1">
                     <div className="h-full bg-primary rounded-full w-[90%]"></div>
                  </div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1">{hotDramas[1]?.bookName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-muted italic">02</span>
                <div className="flex-1">
                  <div className="h-2 bg-background rounded-full w-full mb-1">
                     <div className="h-full bg-primary rounded-full w-[70%] text-transparent"></div>
                  </div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1">{hotDramas[2]?.bookName}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Large Vertical (1x2) */}
          <div className="col-span-1 row-span-2 relative rounded-3xl overflow-hidden group border border-border hidden md:block cursor-pointer">
            <div className="absolute inset-0 bg-secondary"></div>
            <div 
               className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
               style={{ backgroundImage: `url(${getProxyImageUrl(newReleases[0]?.cover)})` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-5 w-full z-10 text-center">
              <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 backdrop-blur-sm">HOT</span>
              <h3 className="font-bold mt-2 leading-tight line-clamp-2 text-white">{newReleases[0]?.bookName}</h3>
              <p className="text-[10px] text-slate-300 mt-1">Action • Thriller</p>
            </div>
          </div>

          {/* Bottom Grid Items */}
          <div className="col-span-1 row-span-1 relative rounded-3xl overflow-hidden group hidden md:block cursor-pointer">
             <div 
               className="absolute inset-0 bg-secondary bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
               style={{ backgroundImage: `url(${getProxyImageUrl(newReleases[1]?.cover)})` }}
             ></div>
             <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
             <div className="absolute inset-0 flex items-center justify-center p-4">
               <p className="text-white font-bold uppercase tracking-tighter text-center leading-tight drop-shadow-md">{newReleases[1]?.bookName}</p>
             </div>
          </div>
          
          <div className="col-span-1 md:col-span-2 row-span-1 relative rounded-3xl overflow-hidden group cursor-pointer">
             <div 
               className="absolute inset-0 bg-secondary bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
               style={{ backgroundImage: `url(${getProxyImageUrl(newReleases[2]?.cover)})` }}
             ></div>
             <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
             <div className="absolute inset-0 flex flex-col justify-end p-4">
               <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 backdrop-blur-sm w-fit">NEW</span>
               <p className="text-white font-bold tracking-tight leading-tight drop-shadow-md mt-1">{newReleases[2]?.bookName}</p>
             </div>
          </div>

        </div>
      </div>

      {/* Iklan Banner ditempatkan sebelum Carousel daftar drama agar terliat */}
      <div className="w-full flex justify-center px-4 md:px-8 mt-4">
        <AdsterraBanner idWeb="35836314ba45252fb775ef568345515c" width={300} height={250} />
      </div>

      <div className="space-y-4 sm:space-y-8 mt-4">
        <DramaCarousel title="Hot & Trending" dramas={hotDramas} />
        <DramaCarousel title="New Releases" dramas={newReleases} />
        <DramaCarousel title="Top Picks For You" dramas={topPicks} />
      </div>
    </div>
  );
}
