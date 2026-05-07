import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Drama } from "@/types";
import { getDramaList } from "@/services/api";
import { getProxyImageUrl, parsePlayCount } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function RecommendDramas({ currentDramaId, tags }: { currentDramaId: string, tags?: string[] }) {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getDramaList();
        
        let filtered = data.filter(d => d.bookId !== currentDramaId);
        
        // Filter by shared tags if any
        if (tags && tags.length > 0) {
           const withSharedTags = filtered.map(d => {
             const sharedCount = d.tagNames ? d.tagNames.filter(t => tags.includes(t)).length : 0;
             return { ...d, sharedCount };
           }).filter(d => d.sharedCount > 0);
           
           if (withSharedTags.length > 0) {
              withSharedTags.sort((a, b) => {
                 if (a.sharedCount !== b.sharedCount) return b.sharedCount - a.sharedCount;
                 return parsePlayCount(b.playCount) - parsePlayCount(a.playCount);
              });
              filtered = withSharedTags;
           } else {
              filtered.sort((a, b) => parsePlayCount(b.playCount) - parsePlayCount(a.playCount));
           }
        } else {
           // just popular
           filtered.sort((a, b) => parsePlayCount(b.playCount) - parsePlayCount(a.playCount));
        }

        setDramas(filtered.slice(0, 10)); // Top 10 recommendations
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentDramaId, tags]);

  if (loading) {
    return (
      <div className="mt-8">
        <h3 className="font-semibold mb-4 text-lg">You May Also Like</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
           {[1,2,3,4,5].map(i => (
             <Skeleton key={i} className="w-[140px] aspect-[3/4] rounded-xl shrink-0" />
           ))}
        </div>
      </div>
    );
  }

  if (dramas.length === 0) return null;

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h3 className="font-semibold mb-4 text-lg">Mungkin Anda Juga Suka</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {dramas.map((drama) => (
          <Link key={drama.bookId} to={`/drama/${drama.bookId}`} className="group block space-y-2 w-[120px] md:w-[140px] shrink-0">
            <div className="relative overflow-hidden rounded-xl border border-border/50 bg-secondary/50">
              <AspectRatio ratio={3 / 4}>
                <img 
                  src={getProxyImageUrl(drama.cover)} 
                  alt={drama.bookName}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <Play className="w-5 h-5 ml-1 text-white fill-white" />
                  </div>
                </div>
              </AspectRatio>
            </div>
            <h3 className="font-semibold text-xs leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {drama.bookName}
            </h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
