import React, { useState, useEffect, useMemo } from "react";
import { Search, Loader2, Play, SlidersHorizontal } from "lucide-react";
import { getDramaList } from "@/services/api";
import { Drama } from "@/types";
import { Link } from "react-router-dom";
import { getProxyImageUrl, parsePlayCount } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { logActivityToGAS } from "@/lib/analytics";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);
  
  const [selectedTag, setSelectedTag] = useState<string>("Semua");
  const [sortBy, setSortBy] = useState<string>("populer");

  useEffect(() => {
    async function load() {
      const data = await getDramaList();
      const validDramas = data.filter(d => d && d.bookId);
      setDramas(validDramas);
      setLoading(false);
    }
    load();
  }, []);
  
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    dramas.forEach(d => {
      if (d.tagNames) d.tagNames.forEach(t => tags.add(t));
    });
    // Add top ones first, or just alphabetical
    const tagArray = Array.from(tags).sort();
    return ["Semua", ...tagArray];
  }, [dramas]);

  const filteredDramas = useMemo(() => {
    // If not searching, just show filtered default
    // Or normally we want to show everything if search is empty but a tag is selected
    if (!query.trim() && selectedTag === "Semua") return null;

    let result = [...dramas];
    
    if (query.trim()) {
      result = result.filter(d => {
        const matchTitle = d.bookName.toLowerCase().includes(query.toLowerCase());
        const matchTag = d.tagNames?.some(t => t.toLowerCase().includes(query.toLowerCase()));
        return matchTitle || matchTag;
      });
    }
    
    if (selectedTag !== "Semua") {
      result = result.filter(d => d.tagNames?.includes(selectedTag));
    }
    
    // Sort
    result.sort((a, b) => {
      if (sortBy === "populer") {
        return parsePlayCount(b.playCount) - parsePlayCount(a.playCount);
      } else if (sortBy === "judul") {
        return a.bookName.localeCompare(b.bookName);
      } else if (sortBy === "terbaru") {
        return a.bookId.localeCompare(b.bookId); // simple fallback since we don't have exactly reliable date
      }
      return 0;
    });

    return result;
  }, [query, dramas, selectedTag, sortBy]);

  const handleResultClick = (dramaName: string) => {
     logActivityToGAS(user?.uid, "search_select", dramaName).catch(console.error);
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground p-6 overflow-y-auto pb-20">
      <div className="relative w-full max-w-2xl mx-auto mt-4 shrink-0 flex flex-col gap-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Cari judul drama, aktor, genre..." 
            className="w-full bg-secondary border border-border rounded-full py-4 pl-12 pr-6 text-lg focus:outline-none focus:border-primary/50 transition-all text-foreground placeholder:text-muted-foreground shadow-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search className="w-6 h-6 text-muted-foreground absolute left-4 top-4" />
        </div>
        
        <div className="flex items-center justify-between flex-wrap gap-4 mt-2">
           <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full">
             {allTags.slice(0, 15).map(tag => (
               <Badge 
                 key={tag} 
                 variant={selectedTag === tag ? "default" : "secondary"}
                 className="cursor-pointer whitespace-nowrap px-4 py-1.5 text-sm rounded-full transition-colors"
                 onClick={() => setSelectedTag(tag)}
               >
                 {tag}
               </Badge>
             ))}
           </div>
           
           <div className="shrink-0 flex items-center gap-2">
             <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
             <Select value={sortBy} onValueChange={setSortBy}>
               <SelectTrigger className="w-[140px] h-9 border-border bg-background">
                 <SelectValue placeholder="Urutkan" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="populer">Terpopuler</SelectItem>
                 <SelectItem value="judul">A - Z</SelectItem>
                 <SelectItem value="terbaru">Terbaru</SelectItem>
               </SelectContent>
             </Select>
           </div>
        </div>
      </div>

      <div className="mt-8 max-w-5xl mx-auto w-full flex-1">
        {loading ? (
          <div>
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="flex flex-wrap gap-2">
              {[1,2,3,4,5].map(i => (
                <Skeleton key={i} className="h-10 w-24 rounded-full" />
              ))}
            </div>
          </div>
        ) : filteredDramas !== null ? (
          filteredDramas.length > 0 ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">Ditemukan {filteredDramas.length} drama</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredDramas.map((drama) => (
                  <Link key={drama.bookId} to={`/drama/${drama.bookId}`} onClick={() => handleResultClick(drama.bookName)} className="group block space-y-3">
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
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <Play className="w-6 h-6 ml-1 text-white fill-white" />
                          </div>
                        </div>
                      </AspectRatio>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 md:line-clamp-1 group-hover:text-primary transition-colors">
                        {drama.bookName}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground mt-20">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Tidak menemukan hasil yang cocok.</p>
            </div>
          )
        ) : (
          <div>
            <h3 className="font-semibold text-lg mb-4 text-foreground/80">Kategori Populer</h3>
            <div className="flex flex-wrap gap-2">
              {['CEO', 'Romansa', 'Balas Dendam', 'Pria Dominan', 'Pertukaran Jiwa'].map(tag => (
                <button key={tag} onClick={() => setSelectedTag(tag)} className="px-4 py-2 rounded-full border border-border bg-secondary hover:bg-secondary/80 focus:ring-2 focus:ring-primary/50 text-sm transition-colors">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
