import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy, limit, doc, updateDoc, serverTimestamp } from "firebase/firestore";

export interface DayStats {
  date: string;
  watchTimeMinutes: number;
}

export function useVipQuest() {
  const [stats, setStats] = useState<DayStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const GOAL_MINUTES = 180; // 3 hours
  const GOAL_DAYS = 7;

  useEffect(() => {
    async function fetchStats() {
      if (!auth.currentUser) return;
      
      setLoading(true);
      try {
        const statsRef = collection(db, "users", auth.currentUser.uid, "daily_stats");
        const q = query(statsRef, orderBy("date", "desc"), limit(GOAL_DAYS));
        const querySnapshot = await getDocs(q);
        
        const fetchedStats: DayStats[] = [];
        querySnapshot.forEach((doc) => {
          fetchedStats.push(doc.data() as DayStats);
        });
        
        setStats(fetchedStats);
        
        // Qualification check: must have GOAL_DAYS entries EACH >= GOAL_MINUTES
        // Note: they might be non-consecutive if we don't strictly require that, 
        // but usually "7 days" implies total or consecutive. 
        // User didn't specify consecutive, but "7 days" usually implies a total of 7 days meeting the goal.
        const eligibleDays = fetchedStats.filter(s => s.watchTimeMinutes >= GOAL_MINUTES);
        setIsEligible(eligibleDays.length >= GOAL_DAYS);
        
      } catch (error) {
        console.error("Error fetching VIP quest stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [auth.currentUser]);

  const claimVip = async () => {
    if (!auth.currentUser || !isEligible) return false;
    
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        isVip: true,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error claiming VIP:", error);
      return false;
    }
  };

  return { stats, loading, isEligible, GOAL_MINUTES, GOAL_DAYS, claimVip };
}
