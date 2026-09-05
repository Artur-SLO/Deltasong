import { 
    collection, 
    query, 
    orderBy, 
    limit, 
    getDocs, 
    onSnapshot 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Fetches the top N players from the Firestore users collection
 */
export async function fetchLeaderboard(limitCount = 50) {
    try {
        const q = query(
            collection(db, 'users'),
            orderBy('totalScore', 'desc'),
            orderBy('updatedAt', 'asc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((p) => p.username && !p.username.toLowerCase().startsWith('guest') && p.username !== 'Player')
            .map((p, index) => ({ rank: index + 1, ...p }));
    } catch (error) {
        console.warn('[LeaderboardService] Compound query failed, attempting fallback to single orderBy:', error);
        try {
            const fallbackQuery = query(
                collection(db, 'users'),
                orderBy('totalScore', 'desc'),
                limit(limitCount)
            );
            const snapshot = await getDocs(fallbackQuery);
            return snapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((p) => p.username && !p.username.toLowerCase().startsWith('guest') && p.username !== 'Player')
                .map((p, index) => ({ rank: index + 1, ...p }));
        } catch (fallbackError) {
            console.error('[LeaderboardService] Failed to fetch leaderboard:', fallbackError);
            return [];
        }
    }
}

/**
 * Subscribes to real-time updates for the global leaderboard
 */
export function subscribeLeaderboard(callback, limitCount = 50) {
    const q = query(
        collection(db, 'users'),
        orderBy('totalScore', 'desc'),
        orderBy('updatedAt', 'asc'),
        limit(limitCount)
    );

    let activeUnsubscribe = null;

    try {
        activeUnsubscribe = onSnapshot(q, (snapshot) => {
            const players = snapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((p) => p.username && !p.username.toLowerCase().startsWith('guest') && p.username !== 'Player')
                .map((p, index) => ({ rank: index + 1, ...p }));
            callback(players);
        }, (error) => {
            console.warn('[LeaderboardService] Compound listener failed, attempting fallback to single orderBy:', error);
            try {
                const fallbackQ = query(
                    collection(db, 'users'),
                    orderBy('totalScore', 'desc'),
                    limit(limitCount)
                );
                activeUnsubscribe = onSnapshot(fallbackQ, (fallbackSnap) => {
                    const players = fallbackSnap.docs
                        .map((doc) => ({ id: doc.id, ...doc.data() }))
                        .filter((p) => p.username && !p.username.toLowerCase().startsWith('guest') && p.username !== 'Player')
                        .map((p, index) => ({ rank: index + 1, ...p }));
                    callback(players);
                }, (fallbackErr) => {
                    console.error('[LeaderboardService] Fallback listener error:', fallbackErr);
                    callback([]);
                });
            } catch (fbErr) {
                console.error('[LeaderboardService] Fallback subscription error:', fbErr);
                callback([]);
            }
        });
    } catch (e) {
        console.error('[LeaderboardService] Initial subscription failed:', e);
        callback([]);
    }

    return () => {
        if (activeUnsubscribe) activeUnsubscribe();
    };
}
