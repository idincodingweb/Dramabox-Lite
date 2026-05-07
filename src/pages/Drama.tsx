import { useEffect, useState, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { getDramaList, getDramaEpisodes } from "@/services/api";
import { Drama, DramaEpisode } from "@/types";
import { Loader2, Play, Lock, ChevronLeft, AlertTriangle, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getProxyImageUrl, getProxyVideoUrl } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { VideoPlayer } from "@/components/VideoPlayer";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { AdsterraPopunder } from "@/components/ads/AdsterraPopunder";
import { RewardUnlockModal } from "@/components/ads/RewardUnlockModal";
import { InterstitialAdModal } from "@/components/ads/InterstitialAdModal";
import { EpisodeComments } from "@/components/EpisodeComments";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { saveWatchHistory, getWatchHistory, toggleFavorite, checkIsFavorite, getUserProfile, deductCoins, getDramaStats, updateDramaStats } from "@/lib/userService";
import { logActivityToGAS } from "@/lib/analytics";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { MessageCircle, ListVideo } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchTimeTracker } from "@/hooks/useWatchTimeTracker";

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Settings } from "lucide-react";
import { RecommendDramas } from "@/components/RecommendDramas";

export function DramaPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [drama, setDrama] = useState<Drama | null>(null);
  const [episodes, setEpisodes] = useState<DramaEpisode[]>([]);
  const [activeEpisode, setActiveEpisode] = useState<DramaEpisode | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  useWatchTimeTracker(isPlaying);

  const [selectedQuality, setSelectedQuality] = useState<string>("auto");

  // Ad and Unlock State
  const [unlockedEpisodes, setUnlockedEpisodes] = useState<Set<string>>(new Set());
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [episodeToUnlock, setEpisodeToUnlock] = useState<DramaEpisode | null>(null);
  const UNLOCK_COST = 10;

  // User State
  const [user] = useAuthState(auth);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [coinsBalance, setCoinsBalance] = useState(0);

  // Video Ref & History state
  const videoRef = useRef<HTMLVideoElement>(null);
  const initialTimeSet = useRef(false);
  const [savedTime, setSavedTime] = useState(0);

  // Interstitial Ad Logic
  const [showInterstitialModal, setShowInterstitialModal] = useState(false);
  const playCountRef = useRef(0);

  // Drama Stats
  const [dramaStats, setDramaStats] = useState({ views: 0, likes: 0, comments: 0, shares: 0 });

  useEffect(() => {
    if (activeEpisode) {
      playCountRef.current += 1;
      // Show interstitial every 3 episodes, but skip the very first load
      if (playCountRef.current > 1 && (playCountRef.current - 1) % 3 === 0 && !isVip) {
        setShowInterstitialModal(true);
      }
    }
  }, [activeEpisode?.chapterId, isVip]);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      
      const [listParams, eps] = await Promise.all([
        getDramaList(),
        getDramaEpisodes(id)
      ]);
      
      const foundDrama = listParams.find((d: Drama) => d.bookId === id) || null;
      setDrama(foundDrama);
      
      const validEps = Array.isArray(eps) ? eps : [];
      setEpisodes(validEps);
      
      let initialActiveEps = validEps.length > 0 ? validEps[0] : null;

      // check user history to auto-resume
      if (user) {
        const history = await getWatchHistory(user.uid);
        const prevWatch = history.find(h => h.dramaId === id);
        if (prevWatch) {
            const chapId = searchParams.get("chap") || prevWatch.lastWatchedChapterId;
            initialActiveEps = validEps.find(ep => String(ep.chapterId) === chapId) || initialActiveEps;
            setSavedTime(prevWatch.videoTime || 0);
        }
      } else {
        const chapId = searchParams.get("chap");
        if (chapId) {
          initialActiveEps = validEps.find(ep => String(ep.chapterId) === chapId) || initialActiveEps;
        }
      }

      if (initialActiveEps) {
        setActiveEpisode(initialActiveEps);
      }
      
      setLoading(false);
    }
    load();
  }, [id, user, searchParams]);

  useEffect(() => {
    if (id) {
       getDramaStats(id).then(stats => {
         setDramaStats(stats as any);
       });
    }
    if (user && id) {
      checkIsFavorite(user.uid, id).then(setIsFavorite);
      getUserProfile(user.uid).then(p => {
        if (p) {
          if (p.isVip) setIsVip(true);
          if (p.coins !== undefined) setCoinsBalance(p.coins);
        }
      });
    }
  }, [user, id]);

  const handleTimeUpdate = () => {
    if (videoRef.current && user && drama && activeEpisode) {
      const time = videoRef.current.currentTime;
      if (time > 0) {
        // Save history every 5 seconds to reduce firestore writes
        if (Math.floor(time) % 5 === 0) {
           saveWatchHistory(user.uid, drama, activeEpisode, time).catch(console.error);
        }
      }
    }
  };

  useEffect(() => {
    if (user && drama && activeEpisode) {
      // Just save the chapter change initially
      saveWatchHistory(user.uid, drama, activeEpisode, 0).then(() => {
         logActivityToGAS(user.uid, "watch_episode", `${drama.bookName} - ${activeEpisode.chapterName}`).catch(console.error);
      }).catch(console.error);
    }
  }, [user, drama, activeEpisode]);

  useEffect(() => {
    setVideoError(false);
    // Reset quality to auto on new episode
    setSelectedQuality("auto");
    initialTimeSet.current = false;
  }, [activeEpisode]);

  const handleVideoLoadedMetadata = () => {
     if (videoRef.current && savedTime > 0 && !initialTimeSet.current) {
        videoRef.current.currentTime = savedTime;
        initialTimeSet.current = true;
     }
  };

  const handleVideoEnded = () => {
    if (!episodes || !activeEpisode) return;
    const currentIdx = episodes.findIndex((ep: DramaEpisode) => ep.chapterId === activeEpisode.chapterId);
    if (currentIdx !== -1 && currentIdx < episodes.length - 1) {
      handleEpisodeClick(episodes[currentIdx + 1]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-4 pb-20 md:pt-16 bg-background relative">
        <div className="container mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <Skeleton className="h-4 w-24 mb-6" />
            <Skeleton className="w-full aspect-[9/16] md:aspect-video rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
            </div>
            <Skeleton className="h-24 w-full mt-4" />
          </div>
          <div className="w-full lg:w-96 flex flex-col shrink-0">
            <Skeleton className="h-[500px] lg:h-[calc(100vh-8rem)] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!drama) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Drama not found</h1>
        <Link to="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    );
  }

  // Get active video url
  let videoUrl = "";
  let availableQualities: { label: string; value: string; path: string }[] = [];
  
  if (activeEpisode && activeEpisode.cdnList && activeEpisode.cdnList.length > 0) {
    let allPaths: any[] = [];
    activeEpisode.cdnList.forEach(cdn => {
      if (cdn.videoPathList) {
        allPaths.push(...cdn.videoPathList);
      }
    });

    if (allPaths.length > 0) {
      const isExpired = (url: string) => {
        const match = url.match(/Expires=(\d+)/);
        if (match) {
          return parseInt(match[1]) * 1000 < Date.now();
        }
        return false;
      };
      
      const isEncrypted = (url: string) => url.includes('.encrypt.') || url.includes('encrypt=1');

      // Group paths by quality and pick the best one for each quality
      const qualityMap = new Map<number, any>();
      allPaths.forEach(p => {
        const q = p.quality;
        const currentBest = qualityMap.get(q);
        
        let score = (isExpired(p.videoPath) ? -100 : 0) + (isEncrypted(p.videoPath) ? -10 : 0);
        let currScore = currentBest ? ((isExpired(currentBest.videoPath) ? -100 : 0) + (isEncrypted(currentBest.videoPath) ? -10 : 0)) : -999;
        
        if (score > currScore) {
          qualityMap.set(q, p);
        }
      });

      const bestPaths = Array.from(qualityMap.values()).sort((a, b) => b.quality - a.quality);

      availableQualities = bestPaths.map(p => {
        let label = p.quality + "p";
        if (p.quality > 1000) label = "HD " + label;
        return { label, value: String(p.quality), path: p.videoPath };
      });
      
      if (selectedQuality === "auto" || !availableQualities.some(q => q.value === selectedQuality)) {
        // Find the best single path: preferably highest quality that isn't expired or encrypted. 
        // We already sorted by quality descending.
        // If the best quality is expired/encrypted, it is still the first element.
        // Let's try to find the highest quality that has score >= -10
        const topChoice = bestPaths.find(p => !isExpired(p.videoPath) && !isEncrypted(p.videoPath)) || bestPaths.find(p => !isExpired(p.videoPath)) || bestPaths[0];
        videoUrl = topChoice.videoPath;
      } else {
        const matchingPath = availableQualities.find(q => q.value === selectedQuality);
        if (matchingPath) {
          videoUrl = matchingPath.path;
        } else {
          videoUrl = bestPaths[0].videoPath;
        }
      }
    }
  }

  const proxiedVideoUrl = getProxyVideoUrl(videoUrl);
  const posterUrl = getProxyImageUrl(drama.coverWap || drama.cover);

  const changeEpisode = (ep: DramaEpisode) => {
    setSavedTime(0);
    setActiveEpisode(ep);
  };

  const handleEpisodeClick = (ep: DramaEpisode) => {
    // If VIP, instantly unlock
    if (isVip) {
       changeEpisode(ep);
       return;
    }

    if (ep.isCharge === 1 && !unlockedEpisodes.has(ep.chapterId)) {
      setEpisodeToUnlock(ep);
      setShowUnlockModal(true);
    } else {
      changeEpisode(ep);
    }
  };

  const handleUnlockSuccess = () => {
    if (episodeToUnlock) {
      setUnlockedEpisodes(prev => new Set(prev).add(episodeToUnlock.chapterId));
      changeEpisode(episodeToUnlock);
      
      if (user && drama) {
        logActivityToGAS(user.uid, "unlock_episode_with_ad", `${drama.bookName} - ${episodeToUnlock.chapterName}`).catch(console.error);
      }
      
      setEpisodeToUnlock(null);
    }
  };

  const handleUnlockWithCoins = async () => {
    if (!user || !episodeToUnlock) return;
    const success = await deductCoins(user.uid, coinsBalance, UNLOCK_COST);
    if (success) {
      setCoinsBalance(prev => prev - UNLOCK_COST);
      
      if (drama) {
         logActivityToGAS(user.uid, "unlock_episode_with_coins", `${drama.bookName} - ${episodeToUnlock.chapterName}`).catch(console.error);
      }

      setUnlockedEpisodes(prev => new Set(prev).add(episodeToUnlock.chapterId));
      changeEpisode(episodeToUnlock);
      setShowUnlockModal(false);
      setEpisodeToUnlock(null);
    } else {
       alert("Gagal menukarkan koin atau saldo tidak mencukupi.");
    }
  };

  const formatStat = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      alert("Silakan login untuk menyimpan ke favorit.");
      return;
    }
    const newVal = !isFavorite;
    setIsFavorite(newVal);
    await toggleFavorite(user.uid, drama, newVal);
    
    setDramaStats(prev => ({
      ...prev,
      likes: Math.max(0, prev.likes + (newVal ? 1 : -1))
    }));
    await updateDramaStats(drama.bookId, 'like', newVal ? 1 : -1);

    logActivityToGAS(user.uid, newVal ? "add_favorite" : "remove_favorite", drama.bookName).catch(console.error);
  };

  const handleShare = async () => {
    const shareData = {
      title: drama?.bookName,
      text: drama?.introduction ? `Tonton ${drama.bookName} - ${drama.introduction.substring(0, 50)}...` : `Tonton drama ${drama?.bookName} yang seru ini!`,
      url: window.location.href,
    };
    
    setDramaStats(prev => ({ ...prev, shares: prev.shares + 1 }));
    if (drama) {
      await updateDramaStats(drama.bookId, 'share', 1);
    }

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link berhasil disalin ke clipboard!");
      }
    } catch (e: any) {
      if (e.name !== 'AbortError' && !e.message?.toLowerCase().includes('cancel')) {
        console.error("Gagal membagikan:", e);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white w-full h-[100dvh] overflow-hidden touch-none flex flex-col items-center justify-center">
      <AdsterraPopunder idWeb="YOUR_POPUNDER_ID" />
      
      <InterstitialAdModal 
        isOpen={showInterstitialModal} 
        onClose={() => setShowInterstitialModal(false)} 
        countdownSeconds={5} 
      />

      <RewardUnlockModal 
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onUnlocked={handleUnlockSuccess}
        onUnlockWithCoins={handleUnlockWithCoins}
        episodeName={episodeToUnlock?.chapterName || ""}
        coinsBalance={coinsBalance}
        unlockCost={UNLOCK_COST}
      />

      {/* Top Left Navigation (Absolute, high z-index) */}
      <div className="absolute top-4 left-4 z-50">
        <Link to="/" className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/60 transition-colors border border-white/10 shadow-lg">
          <ChevronLeft className="w-6 h-6 text-white" />
        </Link>
      </div>

      {/* Main Video Container */}
      <div 
        className="relative w-full h-full md:max-w-[500px] flex items-center justify-center"
        onTouchStart={(e) => {
          if ((e.target as HTMLElement).closest('[role="dialog"]') || (e.target as HTMLElement).closest('[vaul-drawer]')) return;
          (e.currentTarget as any).touchStartY = e.touches[0].clientY;
          (e.currentTarget as any).touchStartX = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if ((e.target as HTMLElement).closest('[role="dialog"]') || (e.target as HTMLElement).closest('[vaul-drawer]')) return;
          const startY = (e.currentTarget as any).touchStartY || 0;
          const startX = (e.currentTarget as any).touchStartX || 0;
          const endY = e.changedTouches[0].clientY;
          const endX = e.changedTouches[0].clientX;
          const diffY = startY - endY;
          const diffX = startX - endX;

          if (Math.abs(diffY) > 80 && Math.abs(diffY) > Math.abs(diffX) * 1.5) {
            if (diffY > 80) {
              const idx = episodes.findIndex(ep => ep.chapterId === activeEpisode?.chapterId);
              if (idx !== -1 && idx < episodes.length - 1) {
                handleEpisodeClick(episodes[idx + 1]);
              }
            } else if (diffY < -80) {
              const idx = episodes.findIndex(ep => ep.chapterId === activeEpisode?.chapterId);
              if (idx > 0) {
                handleEpisodeClick(episodes[idx - 1]);
              }
            }
          }
        }}
      >
        {videoUrl && !videoError ? (
          <VideoPlayer
            key={proxiedVideoUrl}
            ref={videoRef}
            src={proxiedVideoUrl || ""}
            controls 
            autoPlay
            playsInline
            className="w-full h-full object-cover md:object-contain bg-black"
            poster={posterUrl}
            onEnded={handleVideoEnded}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => {
              setIsPlaying(true);
              if (drama) {
                updateDramaStats(drama.bookId, 'view', 1).catch(console.error);
              }
            }}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={handleVideoLoadedMetadata}
            onError={(e) => {
              console.error('Video error encountered');
              setVideoError(true);
            }}
          />
        ) : videoError ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/50 gap-4 bg-zinc-900 absolute inset-0">
            <AlertTriangle className="w-12 h-12 opacity-50 text-red-500" />
            <p className="text-center px-4">Maaf, video untuk episode ini tidak dapat diputar.</p>
            <div className="flex gap-4 mt-2">
              {episodes.indexOf(activeEpisode!) < episodes.length - 1 && (
                <Button 
                  onClick={() => {
                    const nextIdx = episodes.indexOf(activeEpisode!) + 1;
                    handleEpisodeClick(episodes[nextIdx]);
                  }}
                  variant="secondary"
                >
                   Putar Episode Selanjutnya
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/50 gap-4 bg-zinc-900 absolute inset-0">
            <Lock className="w-12 h-12 opacity-50" />
            <p>Episode Content Unavailable</p>
          </div>
        )}

        {/* Bottom Left Details Panel */}
        {!videoError && (
          <div className="absolute bottom-12 left-4 md:left-6 z-30 pointer-events-none max-w-[70%] text-left">
            <h1 className="text-xl md:text-2xl font-bold drop-shadow-md text-white mb-2 leading-tight">{drama?.bookName}</h1>
            <p className="text-sm font-medium opacity-100 drop-shadow-md bg-black/40 text-white inline-block px-3 py-1 rounded-lg border border-white/10 backdrop-blur-md">Episode {activeEpisode?.chapterName}</p>
            {drama?.introduction && (
              <p className="mt-3 text-xs opacity-90 drop-shadow-lg line-clamp-2 md:line-clamp-3 text-white pointer-events-auto max-w-sm">
                {drama.introduction}
              </p>
            )}
          </div>
        )}

        {/* Right Action Sidebar */}
        {!videoError && (
          <div className="absolute bottom-12 right-4 md:right-6 z-40 flex flex-col items-center gap-6">
            
            <button 
              onClick={handleFavoriteToggle} 
              className="group flex flex-col items-center justify-center gap-1 transition-transform active:scale-95"
            >
              <div className={"w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg " + (isFavorite ? "bg-rose-500/20 text-rose-500 border border-rose-500/50" : "bg-black/40 text-white border border-white/20")}>
                <Heart className={"w-5 h-5 transition-all " + (isFavorite ? "fill-current scale-110" : "")} />
              </div>
              <span className="text-[11px] font-medium drop-shadow-md text-white">{dramaStats.likes > 0 ? formatStat(dramaStats.likes) : "Suka"}</span>
            </button>
            
            <Drawer>
              <DrawerTrigger asChild>
                <button className="group flex flex-col items-center justify-center gap-1 transition-transform active:scale-95">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md text-white shadow-lg border border-white/20">
                    <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[11px] font-medium drop-shadow-md text-white">{dramaStats.comments > 0 ? formatStat(dramaStats.comments) : "Komen"}</span>
                </button>
              </DrawerTrigger>
              <DrawerContent className="bg-background text-foreground h-[80vh]">
                <DrawerHeader className="border-b border-border/50 pt-3 pb-3">
                  <DrawerTitle className="text-center font-bold">Komentar</DrawerTitle>
                </DrawerHeader>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" onTouchStart={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}>
                  {activeEpisode && drama && (
                    <EpisodeComments 
                      dramaId={drama.bookId} 
                      chapterId={String(activeEpisode.chapterId)} 
                      onCommentAdded={() => setDramaStats(prev => ({ ...prev, comments: prev.comments + 1 }))}
                    />
                  )}
                </div>
              </DrawerContent>
            </Drawer>

            <Drawer>
              <DrawerTrigger asChild>
                <button className="group flex flex-col items-center justify-center gap-1 transition-transform active:scale-95">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md text-white shadow-lg border border-white/20">
                    <ListVideo className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[11px] font-medium drop-shadow-md text-white">Eps</span>
                </button>
              </DrawerTrigger>
              <DrawerContent className="bg-background text-foreground max-h-[85vh]">
                <DrawerHeader className="shadow-sm z-10 sticky top-0 bg-background/95 backdrop-blur-sm pb-4 pt-3">
                  <DrawerTitle className="text-center font-bold">Daftar Episode</DrawerTitle>
                </DrawerHeader>
                <div className="flex-1 overflow-y-auto pb-6" onTouchStart={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}>
                   <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 p-4">
                    {episodes.map(ep => {
                      const isActive = activeEpisode?.chapterId === ep.chapterId;
                      const isLocked = ep.isCharge === 1 && !unlockedEpisodes.has(ep.chapterId) && !isVip;
                      
                      return (
                        <button
                          key={ep.chapterId}
                          onClick={() => handleEpisodeClick(ep)}
                          className={`
                            relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm md:text-base font-bold transition-all border shadow-sm
                            ${isActive ? "bg-primary text-primary-foreground border-transparent scale-105 z-10" : "bg-card hover:bg-secondary border-border"}
                            ${isLocked ? "bg-secondary/30 text-muted-foreground border-transparent opacity-70" : ""}
                          `}
                        >
                          {ep.chapterName}
                          {isLocked && (
                             <Lock className="w-3.5 h-3.5 absolute top-1 right-1 opacity-50" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>

            <button onClick={handleShare} className="group flex flex-col items-center justify-center gap-1 transition-transform active:scale-95">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md text-white shadow-lg border border-white/20">
                <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[11px] font-medium drop-shadow-md text-white font-mono">{dramaStats.shares > 0 ? formatStat(dramaStats.shares) : "Bagi"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
