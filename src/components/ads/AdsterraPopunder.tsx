import { useEffect } from "react";

interface AdsterraPopunderProps {
  idWeb?: string; // Adsterra Popunder Script ID
}

export function AdsterraPopunder({ idWeb = "YOUR_POPUNDER_ID" }: AdsterraPopunderProps) {
  useEffect(() => {
    // Memasikan script hanya di-inject sekali
    const existingScript = document.querySelector(`script[src*="${idWeb}"]`);
    if (existingScript) return;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `//www.highperformanceformat.com/${idWeb}/invoke.js`; // Sesuaikan domain yang diberikan oleh Adsterra
    script.async = true;

    document.head.appendChild(script);

    return () => {
      // Optional: membersihkan script ketika komponen di unmount 
      // Namun untuk popunder biasanya dibiarkan aktif secara global
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [idWeb]);

  // Komponen ini tidak me-render apapun secara visual (Invisible)
  return null;
}
