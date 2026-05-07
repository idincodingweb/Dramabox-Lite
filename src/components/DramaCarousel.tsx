import { Drama } from "@/types";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { Badge } from "./ui/badge";
import { AspectRatio } from "./ui/aspect-ratio";
import { Play } from "lucide-react";
import { getProxyImageUrl } from "@/lib/utils";

interface DramaCarouselProps {
  title: string;
  dramas: Drama[];
}

export function DramaCarousel({ title, dramas }: DramaCarouselProps) {
  if (!dramas?.length) return null;

  return (
    <div className="w-full py-6 space-y-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <div className="hidden sm:block">
          {/* We rely on Carousel buttons, but could place custom ones here */}
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {dramas.map((drama) => (
              <CarouselItem key={drama.bookId} className="pl-2 md:pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6">
                <Link to={`/drama/${drama.bookId}`} className="group block space-y-3">
                  <div className="relative overflow-hidden rounded-xl border border-border/50 bg-secondary/50">
                    <AspectRatio ratio={3 / 4}>
                      <img 
                        src={getProxyImageUrl(drama.cover)} 
                        alt={drama.bookName}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <Play className="w-6 h-6 ml-1 text-white fill-white" />
                        </div>
                      </div>
                    </AspectRatio>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                      {drama.bookName}
                    </h3>
                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                       <span>{drama.playCount} views</span>
                       {drama.chapterCount && (
                         <>
                           <span>•</span>
                           <span>{drama.chapterCount} EP</span>
                         </>
                       )}
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex -left-4 bg-background/80 hover:bg-background" />
          <CarouselNext className="hidden sm:flex -right-4 bg-background/80 hover:bg-background" />
        </Carousel>
      </div>
    </div>
  );
}
