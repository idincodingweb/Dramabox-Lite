import { Drama } from "@/types";
import { Link } from "react-router-dom";
import { Play, Plus } from "lucide-react";
import { getProxyImageUrl } from "@/lib/utils";

interface HeroProps {
  drama: Drama;
  className?: string;
}

export function Hero({ drama, className = "" }: HeroProps) {
  const bgImage = getProxyImageUrl(drama?.coverWap || drama?.cover);

  if (!drama) return null;

  return (
    <div className={`col-span-2 row-span-2 relative rounded-3xl overflow-hidden group ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10"></div>
      <div className="absolute inset-0 bg-muted animate-pulse group-hover:hidden"></div>
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
        style={{ backgroundImage: `url(${bgImage})` }} 
      ></div>
      <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2 py-1 bg-primary text-primary-foreground text-[10px] font-black rounded uppercase tracking-tighter">
            Trending #1
          </span>
          {drama.chapterCount && (
             <span className="px-2 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-bold rounded uppercase">
               {drama.chapterCount} Episodes
             </span>
          )}
        </div>
        <h2 className="text-4xl font-black mb-2 leading-tight uppercase text-white drop-shadow-md line-clamp-2">
          {drama.bookName}
        </h2>
        <p className="text-slate-300 text-sm mb-6 max-w-sm line-clamp-2">
          {drama.introduction}
        </p>
        <div className="flex gap-3">
          <Link to={`/drama/${drama.bookId}`}>
            <button className="px-6 py-2.5 bg-white text-slate-950 font-bold rounded-xl flex items-center gap-2 hover:bg-primary transition-colors hover:text-primary-foreground">
              <Play className="w-5 h-5 fill-current" />
              Watch Now
            </button>
          </Link>
          <button className="p-2.5 bg-white/10 backdrop-blur-md text-white rounded-xl border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
             <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
