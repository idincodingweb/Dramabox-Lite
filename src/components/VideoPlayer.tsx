import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import Hls from "hls.js";

interface VideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, ...props }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(ref, () => videoRef.current!);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      let hls: Hls | null = null;

      if (src.includes(".m3u8")) {
        if (Hls.isSupported()) {
          hls = new Hls({
            startLevel: -1,
            debug: false,
          });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (props.autoPlay) {
              const playPromise = video.play();
              if (playPromise !== undefined) {
                playPromise.catch(() => console.log("Autoplay prevented"));
              }
            }
          });
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error("fatal network error encountered, try to recover");
                  hls?.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error("fatal media error encountered, try to recover");
                  hls?.recoverMediaError();
                  break;
                default:
                  hls?.destroy();
                  if (props.onError) props.onError({} as any);
                  break;
              }
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
          if (props.autoPlay) {
             video.addEventListener("loadedmetadata", () => {
               const playPromise = video.play();
               if (playPromise !== undefined) {
                 playPromise.catch(() => console.log("Autoplay prevented"));
               }
             });
          }
        }
      } else {
        video.src = src;
        if (props.autoPlay) {
           const playPromise = video.play();
           if (playPromise !== undefined) {
             playPromise.catch(() => console.log("Autoplay prevented"));
           }
        }
      }

      return () => {
        if (hls) {
          hls.destroy();
        }
      };
    }, [src, props.autoPlay]);

    return <video ref={videoRef} {...props} />;
  }
);

