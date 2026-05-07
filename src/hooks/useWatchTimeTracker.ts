import { useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export function useWatchTimeTracker(isPlaying: boolean) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const bufferedTimeRef = useRef(0); // in seconds

  useEffect(() => {
    if (isPlaying && auth.currentUser) {
      timerRef.current = setInterval(() => {
        bufferedTimeRef.current += 1;
        
        // Every 60 seconds of playback, sync to firestore
        if (bufferedTimeRef.current >= 60) {
          syncWatchTime(auth.currentUser!.uid, Math.floor(bufferedTimeRef.current / 60));
          bufferedTimeRef.current = bufferedTimeRef.current % 60;
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Final sync on pause/stop if there's any buffered time >= 10s (optional small granularity)
      if (bufferedTimeRef.current >= 10 && auth.currentUser) {
         // sync less than a minute if we want, but user asked for 3 hours per day
         // let's stick to minute granularity for simplicity in firestore
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying]);
}

async function syncWatchTime(userId: string, minutesToAdd: number) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const docRef = doc(db, "users", userId, "daily_stats", today);
    
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      await setDoc(docRef, {
        watchTimeMinutes: (data.watchTimeMinutes || 0) + minutesToAdd,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } else {
      await setDoc(docRef, {
        date: today,
        watchTimeMinutes: minutesToAdd,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error syncing watch time:", error);
  }
}
