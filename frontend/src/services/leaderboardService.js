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
        console.error('[LeaderboardService] Failed to fetch leaderboard:', error);
        return [];
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

    return onSnapshot(q, (snapshot) => {
        const players = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((p) => p.username && !p.username.toLowerCase().startsWith('guest') && p.username !== 'Player')
            .map((p, index) => ({ rank: index + 1, ...p }));
        callback(players);
    }, (error) => {
        console.error('[LeaderboardService] Real-time leaderboard listener error:', error);
    });
}
