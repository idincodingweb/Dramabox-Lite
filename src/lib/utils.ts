import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProxyImageUrl(url?: string) {
  if (!url) return undefined;
  return url;
}

export function getDisplayAvatarUrl(url?: string | null) {
  if (!url) return undefined;
  return url;
}

export function getProxyVideoUrl(url?: string) {
  if (!url) return undefined;
  if (url.includes('.m3u8')) {
    return url;
  }
  return `/api/proxy-video?url=${encodeURIComponent(url)}`;
}

export function parsePlayCount(playCountStr: string | undefined): number {
  if (!playCountStr) return 0;
  let num = parseFloat(playCountStr);
  if (isNaN(num)) return 0;
  if (playCountStr.toUpperCase().includes('M')) {
     num *= 1000000;
  } else if (playCountStr.toUpperCase().includes('K')) {
     num *= 1000;
  } else if (playCountStr.toUpperCase().includes('B')) {
     num *= 1000000000;
  }
  return num;
}

let audioCtx: AudioContext | null = null;

export function setupGlobalClickSound() {
  if (typeof window === 'undefined') return;
  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    // Attempting to trigger on any logical clickable element
    const isInteractive = target.closest('button') || 
                          target.closest('a') || 
                          target.closest('[role="button"]') ||
                          target.closest('[role="menuitem"]') ||
                          target.closest('[role="tab"]') ||
                          target.closest('.cursor-pointer') || 
                          target.closest('.lucide') || 
                          (target.tagName.toLowerCase() === 'input' && ((target as HTMLInputElement).type === 'submit' || (target as HTMLInputElement).type === 'button'));
                          
    if (isInteractive) {
      playClickSound();
    }
  };
  
  // Register click on capturing phase to catch it early
  window.removeEventListener('click', handleClick, true);
  window.addEventListener('click', handleClick, true);
}

export function playClickSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // start
    oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05); // end
    
    // Smooth envelope
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.05);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.05);
  } catch (e) {
    console.error("Audio block", e);
  }
}
