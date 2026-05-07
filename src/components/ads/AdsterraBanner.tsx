import { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";

interface AdsterraBannerProps {
  idWeb?: string; // Placement ID dari Adsterra
  width?: number; // Lebar banner, misal 320, 468, 728
  height?: number; // Tinggi banner, misal 50, 60, 90
  className?: string; // Custom styling
}

export function AdsterraBanner({
  idWeb = "YOUR_ADSTERRA_PLACEMENT_ID",
  width = 300,
  height = 250,
  className = "",
}: AdsterraBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Adsterra injects ads via script tags.
    // In React, dynamically injecting third party scripts that dump HTML using document.write (which some older ad networks do) 
    // or manipulate DOM unpredictably can be tricky.
    // This is a professional robust wrapper to safely inject the Adsterra code.

    if (!adRef.current) return;

    // Bersihkan kontainer jika re-render
    adRef.current.innerHTML = "";

    // Adsterra configuration script
    const confScript = document.createElement("script");
    confScript.type = "text/javascript";
    confScript.innerHTML = `
      atOptions = {
        'key' : '${idWeb}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    `;

    // Adsterra invoke script
    const invokeScript = document.createElement("script");
    invokeScript.type = "text/javascript";
    invokeScript.src = `//www.highperformanceformat.com/${idWeb}/invoke.js`;
    // We add async just to be safe, sometimes ad networks require it or we map it carefully
    invokeScript.async = true;

    adRef.current.appendChild(confScript);
    adRef.current.appendChild(invokeScript);

    return () => {
      if (adRef.current) {
        adRef.current.innerHTML = "";
      }
    };
  }, [idWeb, width, height]);

  return (
    <div className={`w-full flex flex-col items-center justify-center space-y-2 py-4 ${className}`}>
      {/* Container untuk Iklan */}
      <div 
        ref={adRef} 
        style={{ width, minHeight: height }} 
        className="bg-secondary/30 rounded flex items-center justify-center overflow-hidden border border-border/50 relative"
      >
        {/* Placeholder jika iklan belum termuat statis - Biasanya akan tertimpa oleh Iframe iklan */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-30 pointer-events-none">
           <span>Advertisement</span>
        </div>
      </div>
    </div>
  );
}
