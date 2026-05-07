import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, updateDoc, increment, serverTimestamp, collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { updateDramaStats } from "@/lib/userService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Heart, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Comment {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string;
  text: string;
  likesCount: number;
  dramaId: string;
  chapterId: string;
  createdAt: any;
}

interface EpisodeCommentsProps {
  dramaId: string;
  chapterId: string;
  onCommentAdded?: () => void;
}

export function EpisodeComments({ dramaId, chapterId, onCommentAdded }: EpisodeCommentsProps) {
  const [user] = useAuthState(auth);
  const [comments, setComments] = useState<Comment[]>([]);
  const [fakeComments, setFakeComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Generate fake comments based on dramaId and chapterId
    let seed = 0;
    const strMatch = dramaId + chapterId;
    for (let i = 0; i < strMatch.length; i++) {
        seed += strMatch.charCodeAt(i);
    }
    const random = () => {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    const FAKE_COMMENTS = [
      "Wah parah seru banget ini!",
      "Dari kemaren nungguin yang ini, akhirnya!",
      "Aktingnya bagus banget, senyum-senyum sendiri nontonnya",
      "Gak nyangka ceritanya bakal plot twist begini.",
      "Eps selanjutnya kapan rilis? ga sabar woi😭",
      "Bagus sih, tapi agak sebel sama pemeran antagonisnya",
      "Salah satu drama pendek terbaik yang pernah gw tonton",
      "Visualnya manjain mata banget",
      "Jalan ceritanya cepet jadi nggak ngebosenin",
      "Bikin baper parah gila...",
      "Wah gila keren banget",
      "Baru nemu drama sebagus ini",
      "Nangis banget pas adegan ini 😭",
      "Endingnya bikin penasaran gilaa",
      "Dramanya recommended banget buat di tonton pas lagi santai",
      "Ngga kerasa udah marathon banyak eps aja",
      "Karakter utamanya pinter banget!",
      "Sumpah deg-degan banget euy nontonnya",
      "Soundtracknya juga asik banget, pas sama suasananya",
      "Semoga ada season 2 nya 🙏",
      "Gak bisa berenti nonton masa dari kemaren wkwk"
    ];

    const FAKE_NAMES = [
      "Rizky Aditya", "Sarah Putri", "Budi Santoso", "Nisa Aulia", 
      "Ahmad Wijaya", "Dewi Lestari", "Rina Ramadhani", "Dimas Anggara",
      "Fitri Indah", "Arif Rahman", "Siti Aminah", "Reza Pratama",
      "Dinda Kanya", "Fajar Surya", "Putri Diana", "Adi Gunawan",
      "Maya Sari", "Rendy Saputra", "Ayu Permata", "Bagas", "Dika21", "Lina_Cute"
    ];

    const numFake = Math.floor(random() * 12) + 4; // 4 to 15 comments
    const generated = [];
    const usedComments = new Set();
    const usedNames = new Set();
    
    // Spread them over the last 30 days
    let baseTime = Date.now() - (Math.floor(random() * 30 * 24 * 60 * 60 * 1000)); 

    for (let i = 0; i < numFake; i++) {
        let textIdx = Math.floor(random() * FAKE_COMMENTS.length);
        while (usedComments.has(textIdx)) textIdx = Math.floor(random() * FAKE_COMMENTS.length);
        usedComments.add(textIdx);

        let nameIdx = Math.floor(random() * FAKE_NAMES.length);
        while (usedNames.has(nameIdx)) nameIdx = Math.floor(random() * FAKE_NAMES.length);
        usedNames.add(nameIdx);

        baseTime += Math.floor(random() * 1000 * 60 * 60 * 5); // spacing them out
        
        generated.push({
            id: `fake_${i}`,
            userId: `fake_${nameIdx}`,
            userDisplayName: FAKE_NAMES[nameIdx],
            userPhotoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nameIdx}`,
            text: FAKE_COMMENTS[textIdx],
            likesCount: Math.floor(random() * 50),
            createdAt: { toMillis: () => baseTime, seconds: Math.floor(baseTime/1000), toDate: () => new Date(baseTime) }
        });
    }

    setFakeComments(generated.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
  }, [dramaId, chapterId]);

  useEffect(() => {
    if (!dramaId || !chapterId) return;
    
    setLoading(true);
    const q = query(
      collection(db, "comments"),
      where("dramaId", "==", dramaId),
      where("chapterId", "==", chapterId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Comment[] = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(fetched);
      setLoading(false);
    }, (error) => {
       console.error("Error fetching comments:", error);
       setLoading(false);
    });

    return () => unsubscribe();
  }, [dramaId, chapterId]);

  // Load user likes
  useEffect(() => {
     if (!user) return;
     // To keep this simple we just track likes in client side locally for the session 
     // or we individually attach a listener to each comment's likes subcollection. 
     // For performance, we'll listen to likes as users interact.
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to comment.");
      return;
    }
    if (!newText.trim()) return;

    setSubmitting(true);
    try {
      const commentRef = doc(collection(db, "comments"));
      await setDoc(commentRef, {
        userId: user.uid,
        userDisplayName: user.displayName || "User",
        userPhotoURL: user.photoURL || "",
        text: newText.trim(),
        likesCount: 0,
        dramaId,
        chapterId,
        createdAt: serverTimestamp()
      });
      setNewText("");
      await updateDramaStats(dramaId, 'comment', 1);
      if (onCommentAdded) onCommentAdded();
    } catch (e) {
      console.error("Error submitting comment", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      alert("Please login to like comments.");
      return;
    }

    try {
      const likeRef = doc(db, "comments", commentId, "likes", user.uid);
      const isLiked = likedComments.has(commentId);
      
      const newLikedState = new Set(likedComments);
      if (isLiked) {
         newLikedState.delete(commentId);
      } else {
         newLikedState.add(commentId);
      }
      setLikedComments(newLikedState);

      if (isLiked) {
         await deleteDoc(likeRef);
         await updateDoc(doc(db, "comments", commentId), {
           likesCount: increment(-1)
         });
      } else {
         await setDoc(likeRef, {
           userId: user.uid,
           createdAt: serverTimestamp()
         });
         await updateDoc(doc(db, "comments", commentId), {
           likesCount: increment(1)
         });
      }
    } catch (e) {
      console.error("Error liking comment", e);
    }
  };

  const handleDelete = async (commentId: string) => {
     if (!window.confirm("Hapus komentar ini?")) return;
     try {
       await deleteDoc(doc(db, "comments", commentId));
     } catch (e) {
       console.error("Error deleting comment", e);
     }
  };

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="font-semibold text-lg">Komentar ({comments.length + fakeComments.length})</h3>
      
      {/* Input Box */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
         <Avatar className="w-10 h-10 border border-border">
            <AvatarImage src={user?.photoURL || ""} />
            <AvatarFallback>{user?.displayName?.charAt(0) || "?"}</AvatarFallback>
         </Avatar>
         <div className="flex-1 relative">
           <Input 
             placeholder={user ? "Tambahkan komentar..." : "Login untuk berkomentar..."}
             value={newText}
             onChange={e => setNewText(e.target.value)}
             className="pr-12 bg-secondary/50 border-transparent focus-visible:ring-1"
             disabled={!user || submitting}
           />
           <Button 
             type="submit" 
             size="icon" 
             variant="ghost" 
             className="absolute right-1 top-1 h-8 w-8 text-primary hover:bg-primary/20 hover:text-primary"
             disabled={!user || submitting || !newText.trim()}
           >
             {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
           </Button>
         </div>
      </form>

      {/* Komentar List */}
      <div className="space-y-4">
        {loading ? (
           <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : comments.length === 0 && fakeComments.length === 0 ? (
           <p className="text-center text-sm text-muted-foreground py-4">Belum ada komentar di episode ini. Jadilah yang pertama!</p>
        ) : (
           [...comments, ...fakeComments].sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)).map(c => (
              <div key={c.id} className="flex gap-3 items-start group">
                 <Avatar className="w-8 h-8 md:w-10 md:h-10 border border-border shrink-0">
                    <AvatarImage src={c.userPhotoURL} />
                    <AvatarFallback>{c.userDisplayName.charAt(0)}</AvatarFallback>
                 </Avatar>
                 <div className="flex-1">
                    <div className="flex items-center gap-2">
                       <span className="font-semibold text-sm">{c.userDisplayName}</span>
                       <span className="text-xs text-muted-foreground">
                         {c.createdAt ? formatDistanceToNow(c.createdAt.toDate(), { addSuffix: true, locale: localeId }) : 'Baru saja'}
                       </span>
                    </div>
                    <p className="text-sm mt-1 mb-1 text-foreground break-words">{c.text}</p>
                    <div className="flex items-center gap-4 text-muted-foreground">
                       <button onClick={() => handleLike(c.id)} className="flex items-center gap-1 text-xs hover:text-primary transition-colors">
                          <Heart className={`w-3.5 h-3.5 ${likedComments.has(c.id) ? 'fill-primary text-primary' : ''}`} />
                          {c.likesCount > 0 ? c.likesCount : 'Suka'}
                       </button>
                       {user?.uid === c.userId && (
                          <button onClick={() => handleDelete(c.id)} className="text-xs hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                             Hapus
                          </button>
                       )}
                    </div>
                 </div>
              </div>
           ))
        )}
      </div>
    </div>
  );
}
