import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getRankData, addPoints, calculateUserRank, setCachedRankData } from '../services/scoreService';

/**
 * Custom hook to consume score, rank tier and stats in any React component
 */
export function useScore() {
    const [scoreData, setScoreData] = useState(() => getRankData());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Local event listener for fast UI reaction
        const handleLocalChange = () => {
            setScoreData(getRankData());
        };
        window.addEventListener('deltasong_rank_change', handleLocalChange);

        // Firestore real-time listener when authenticated
        let unsubscribeFirestore = null;
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                unsubscribeFirestore = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const updated = {
                            totalScore: data.totalScore || 0,
                            streak: data.streak || 1,
                            stats: data.stats || scoreData.stats
                        };
                        setCachedRankData(updated);
                        setScoreData(updated);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error('[useScore] Firestore listener error:', error);
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        });

        return () => {
            window.removeEventListener('deltasong_rank_change', handleLocalChange);
            unsubscribeAuth();
            if (unsubscribeFirestore) unsubscribeFirestore();
        };
    }, []);

    const rank = calculateUserRank(scoreData.totalScore);

    return {
        score: scoreData.totalScore,
        streak: scoreData.streak,
        stats: scoreData.stats,
        rank,
        loading,
        addPoints
    };
}
