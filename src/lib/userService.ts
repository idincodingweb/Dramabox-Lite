import { db, auth } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, serverTimestamp, query, orderBy, where, limit, increment } from 'firebase/firestore';

export interface UserProfile {
  email: string;
  displayName?: string;
  photoURL?: string;
  coins?: number;
  isVip?: boolean;
  lastCheckIn?: any;
  checkInStreak?: number;
  referralCode?: string;
  referredBy?: string;
  referralCount?: number;
  deviceId?: string;
  isSuspended?: boolean;
  settings?: {
    language?: string;
    autoplay?: boolean;
    cellularPlay?: boolean;
    quality?: string;
    notifNewReleases?: boolean;
    notifNewsletters?: boolean;
    notifSpecialOffers?: boolean;
  };
}

export interface WatchHistoryItem {
  dramaId: string;
  title?: string;
  cover?: string;
  lastWatchedChapterId?: string;
  lastWatchedChapterName?: string;
  videoTime?: number;
  updatedAt: any;
}

export interface FavoriteItem {
  dramaId: string;
  title?: string;
  cover?: string;
  createdAt: any;
}

export interface WithdrawalRequest {
  id?: string;
  amountCoins: number;
  amountIdr: number;
  method: string;
  accountNumber: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: any;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function getDeviceId() {
  if (typeof window === 'undefined') return 'unknown';
  let deviceId = localStorage.getItem('device_id_fingerprint');
  if (!deviceId) {
    const ua = navigator.userAgent;
    const lang = navigator.language;
    const screen = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const rand = Math.random().toString(36).substring(2, 12);
    const str = `${ua}|${lang}|${screen}|${rand}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    deviceId = `dev_${Math.abs(hash)}_${rand}`;
    localStorage.setItem('device_id_fingerprint', deviceId);
  }
  return deviceId;
}

// Ensure Profile exists (called during login/sync)
export async function ensureUserProfile(user: any) {
  if (!user || !user.uid) return;
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const referralCode = user.uid.slice(0, 8).toUpperCase();
      await setDoc(userRef, {
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        coins: 10000, // 10000 coins * Rp 5 = Rp 50,000 bonus
        isVip: false,
        referralCode: referralCode,
        referralCount: 0,
        deviceId: getDeviceId(),
        isSuspended: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // In case they don't have a referral code from earlier versions
      const data = snap.data();
      const updates: any = {};
      if (!data.referralCode) {
         updates.referralCode = user.uid.slice(0, 8).toUpperCase();
         updates.referralCount = data.referralCount || 0;
      }
      if (!data.deviceId) {
         updates.deviceId = getDeviceId();
      }
      if (Object.keys(updates).length > 0) {
         await updateDoc(userRef, updates);
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      let needsUpdate = false;
      const updates: any = {};
      
      if (!data.referralCode) {
        data.referralCode = uid.slice(0, 8).toUpperCase();
        updates.referralCode = data.referralCode;
        updates.referralCount = data.referralCount || 0;
        needsUpdate = true;
      }
      if (!data.deviceId) {
        data.deviceId = getDeviceId();
        updates.deviceId = data.deviceId;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await updateDoc(userRef, updates);
      }
      
      return data;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    return null;
  }
}

// Watch History
export async function saveWatchHistory(uid: string, drama: any, episode: any, videoTime: number = 0) {
  if (!uid) return;
  const histRef = doc(db, 'users', uid, 'history', String(drama.bookId));
  try {
    await setDoc(histRef, {
      dramaId: String(drama.bookId),
      title: drama.bookName,
      cover: drama.coverWap || drama.cover,
      lastWatchedChapterId: String(episode.chapterId),
      lastWatchedChapterName: episode.chapterName,
      videoTime,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}/history/${drama.bookId}`);
  }
}

export async function getWatchHistory(uid: string): Promise<WatchHistoryItem[]> {
  const collRef = collection(db, 'users', uid, 'history');
  try {
    const q = query(collRef, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as WatchHistoryItem);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${uid}/history`);
    return [];
  }
}

// Favorites
export async function toggleFavorite(uid: string, drama: any, isFav: boolean) {
  if (!uid) return;
  const favRef = doc(db, 'users', uid, 'favorites', String(drama.bookId));
  try {
    if (isFav) {
      await setDoc(favRef, {
        dramaId: String(drama.bookId),
        title: drama.bookName,
        cover: drama.coverWap || drama.cover,
        createdAt: serverTimestamp()
      });
    } else {
      await deleteDoc(favRef);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}/favorites/${drama.bookId}`);
  }
}

export async function checkIsFavorite(uid: string, dramaId: string): Promise<boolean> {
  const favRef = doc(db, 'users', uid, 'favorites', String(dramaId));
  try {
    const snap = await getDoc(favRef);
    return snap.exists();
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}/favorites/${dramaId}`);
    return false;
  }
}

export async function getFavorites(uid: string): Promise<FavoriteItem[]> {
  const collRef = collection(db, 'users', uid, 'favorites');
  try {
    const q = query(collRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as FavoriteItem);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${uid}/favorites`);
    return [];
  }
}

// Gamification & Coins
export async function claimDailyCheckIn(uid: string, currentStreak: number = 0, currentCoins: number = 0): Promise<boolean> {
  const userRef = doc(db, 'users', uid);
  try {
    const rewardCoins = 10 + (currentStreak * 5); // Example: 10, 15, 20...
    await updateDoc(userRef, {
      lastCheckIn: serverTimestamp(),
      checkInStreak: currentStreak + 1,
      coins: currentCoins + rewardCoins,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    return false;
  }
}

export async function submitReferralCode(uid: string, code: string, currentProfile: UserProfile): Promise<{ success: boolean; message: string }> {
  try {
    if (currentProfile.referredBy) {
      return { success: false, message: "Anda sudah memasukkan kode referral sebelumnya." };
    }
    if (currentProfile.referralCode === code) {
      return { success: false, message: "Tidak dapat memasukkan kode Anda sendiri." };
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('referralCode', '==', code.toUpperCase()), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) {
      return { success: false, message: "Kode referral tidak ditemukan." };
    }

    const referrerDoc = snap.docs[0];
    const referrerId = referrerDoc.id;
    const referrerData = referrerDoc.data();

    const currentUserDeviceId = currentProfile.deviceId || getDeviceId();
    if (referrerData.deviceId && referrerData.deviceId === currentUserDeviceId) {
       // Fraud detected (Penuyulan via same device)!
       const userRef = doc(db, 'users', uid);
       await updateDoc(userRef, {
         isSuspended: true,
         updatedAt: serverTimestamp()
       });
       await updateDoc(referrerDoc.ref, {
         isSuspended: true,
         updatedAt: serverTimestamp()
       });
       return { success: false, message: "Sistem mendeteksi aktivitas mencurigakan (Fraud). Akun Anda telah ditangguhkan." };
    }

    // Reward for both
    const rewardCoins = 50;

    // Update current user
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      referredBy: referrerId,
      coins: (currentProfile.coins || 0) + rewardCoins,
      updatedAt: serverTimestamp()
    });

    // Update referrer
    await updateDoc(referrerDoc.ref, {
      referralCount: (referrerData.referralCount || 0) + 1,
      coins: (referrerData.coins || 0) + rewardCoins,
      updatedAt: serverTimestamp()
    });

    return { success: true, message: `Berhasil! Anda mendapatkan ${rewardCoins} koin gratis.` };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Terjadi kesalahan sistem." };
  }
}

export async function deductCoins(uid: string, currentCoins: number, amount: number): Promise<boolean> {
  if (currentCoins < amount) return false;
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, {
      coins: currentCoins - amount,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    return false;
  }
}

export async function subscribeVIP(uid: string): Promise<boolean> {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, {
      isVip: true,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    return false;
  }
}

// Withdrawals
export async function requestWithdrawal(uid: string, currentCoins: number, amountCoins: number, amountIdr: number, method: string, accountNumber: string): Promise<boolean> {
  if (currentCoins < amountCoins) return false;
  
  const userRef = doc(db, 'users', uid);
  const withdrawalRef = doc(collection(db, 'users', uid, 'withdrawals'));
  
  try {
    // Note: To be perfectly transaction safe, we'd use runTransaction. 
    // Here we assume sequentially it's good enough or use batched writes if needed.
    // For simplicity with the existing pattern:
    await updateDoc(userRef, {
      coins: currentCoins - amountCoins,
      updatedAt: serverTimestamp()
    });
    
    await setDoc(withdrawalRef, {
      amountCoins,
      amountIdr,
      method,
      accountNumber,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}/withdrawals`);
    return false;
  }
}

export async function getWithdrawals(uid: string): Promise<WithdrawalRequest[]> {
  const collRef = collection(db, 'users', uid, 'withdrawals');
  try {
    const q = query(collRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => {
       const data = doc.data() as WithdrawalRequest;
       data.id = doc.id;
       return data;
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${uid}/withdrawals`);
    return [];
  }
}

// Global Drama Stats
export async function updateDramaStats(dramaId: string, type: 'like' | 'comment' | 'share' | 'view', incrementValue: number = 1) {
  const statRef = doc(db, 'drama_stats', String(dramaId));
  try {
    const snap = await getDoc(statRef);
    if (!snap.exists()) {
       await setDoc(statRef, {
         views: Math.max(0, type === 'view' ? incrementValue : 0),
         likes: Math.max(0, type === 'like' ? incrementValue : 0),
         comments: Math.max(0, type === 'comment' ? incrementValue : 0),
         shares: Math.max(0, type === 'share' ? incrementValue : 0),
       });
    } else {
       const updateData: any = {};
       if (type === 'view') updateData.views = increment(incrementValue);
       if (type === 'like') updateData.likes = increment(incrementValue);
       if (type === 'comment') updateData.comments = increment(incrementValue);
       if (type === 'share') updateData.shares = increment(incrementValue);
       await updateDoc(statRef, updateData);
    }
  } catch (err) {
    console.error("Error updating drama stats:", err);
  }
}

function boostStats(dramaId: string, realData: any) {
  // Generate stable "fake" base numbers based on dramaId string
  let hash = 0;
  const idStr = String(dramaId);
  for (let i = 0; i < idStr.length; i++) {
    hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
    hash |= 0; 
  }
  const seed = Math.abs(hash);
  
  // Base views: between 12,000 and 89,000
  const fakeViews = 12000 + (seed % 77000);
  // Base likes: 10% - 20% of views
  const fakeLikes = Math.floor(fakeViews * (0.1 + (seed % 100) / 1000));
  
  return {
    views: (realData.views || 0) + fakeViews,
    likes: (realData.likes || 0) + fakeLikes,
    comments: (realData.comments || 0) + Math.floor(fakeLikes / 15),
    shares: (realData.shares || 0) + Math.floor(fakeLikes / 25)
  };
}

export async function getDramaStats(dramaId: string) {
   const statRef = doc(db, 'drama_stats', String(dramaId));
   try {
     const snap = await getDoc(statRef);
     const realData = snap.exists() ? snap.data() : { views: 0, likes: 0, comments: 0, shares: 0 };
     return boostStats(dramaId, realData);
   } catch (err) {
     console.error("Error fetching drama stats:", err);
     return boostStats(dramaId, { views: 0 });
   }
}

export async function getPopularDramaStats(limitCount: number = 20) {
  try {
    const statsRef = collection(db, 'drama_stats');
    const q = query(statsRef, orderBy('views', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    
    return snap.docs.map(doc => {
      const data = doc.data();
      return { 
        dramaId: doc.id, 
        ...boostStats(doc.id, data)
      };
    });
  } catch (err) {
    console.error("Error fetching popular drama stats:", err);
    return [];
  }
}

