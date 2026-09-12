import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    serverTimestamp, 
    addDoc, 
    collection 
} from 'firebase/firestore';
import { notifications } from '@mantine/notifications';
import { auth, db } from '../config/firebase';
import { RANK_TIERS } from '../config/Constants';
import { getLocalDateString } from '../core/dailySeed';

function getInitialLocalRankData() {
    // Purge any legacy guest score/stats data from localStorage to ensure anonymous players remain unranked
    try {
        localStorage.removeItem('deltasong_rank_data_guest');
        localStorage.removeItem('deltasong_guest_streak_date');
    } catch {
        // ignore storage errors
    }

    return {
        totalScore: 0,
        streak: 1,
        stats: {
            charactersPlayed: 0,
            itemsPlayed: 0,
            songsPlayed: 0,
            charactersWon: 0,
            itemsWon: 0,
            songsWon: 0,
            dailyCompleted: 0,
            totalWins: 0,
            totalLosses: 0
        }
    };
}

let cachedRankData = getInitialLocalRankData();
// Display-only development preview; never used as the source for cloud writes.
let previewScore = null;

let lastMutationTimestamp = 0;

/**
 * Returns the current cached rank and score data synchronously
 */
export function getRankData() {
    if (import.meta.env.DEV && previewScore !== null) {
        return { ...cachedRankData, totalScore: previewScore };
    }
    return { ...cachedRankData };
}

function setPreviewScore(score) {
    if (!import.meta.env.DEV) return getRankData();
    if (!Number.isSafeInteger(score) || score < 0) {
        throw new RangeError('Preview score must be a non-negative safe integer.');
    }
    const oldScore = getRankData().totalScore;
    previewScore = score;
    checkRankChange(oldScore, score);
    window.dispatchEvent(new Event('deltasong_rank_change'));
    return getRankData();
}

function addPreviewPoints(amount) {
    if (!Number.isSafeInteger(amount)) {
        throw new RangeError('Preview points must be a safe integer.');
    }
    return setPreviewScore(Math.max(0, getRankData().totalScore + amount));
}

/**
 * Updates internal memory cache and dispatches UI update event
 */
export function setCachedRankData(data) {
    if (!data) return;
    cachedRankData = {
        ...cachedRankData,
        ...data,
        streak: data.streak !== undefined ? data.streak : (cachedRankData.streak || 1),
        stats: data.stats ? { ...cachedRankData.stats, ...data.stats } : cachedRankData.stats
    };
    window.dispatchEvent(new Event('deltasong_rank_change'));
}

/**
 * Resets internal memory cache to blank default state (used on logout)
 */
export function resetCachedRankData() {
    previewScore = null;
    cachedRankData = {
        totalScore: 0,
        streak: 1,
        stats: {
            charactersPlayed: 0,
            itemsPlayed: 0,
            songsPlayed: 0,
            charactersWon: 0,
            itemsWon: 0,
            songsWon: 0,
            dailyCompleted: 0,
            totalWins: 0,
            totalLosses: 0
        }
    };
    window.dispatchEvent(new Event('deltasong_rank_change'));
}

/**
 * Calculates rank tier and progress based on score
 */
export function calculateUserRank(score) {
    let activeTier = RANK_TIERS[0];
    for (let i = 0; i < RANK_TIERS.length; i++) {
        if (score >= RANK_TIERS[i].min) {
            activeTier = RANK_TIERS[i];
        }
    }
    
    const nextTier = RANK_TIERS[RANK_TIERS.indexOf(activeTier) + 1];
    let progressValue = Math.round(((score - activeTier.min) / activeTier.span) * 100);
    
    progressValue = Math.max(0, Math.min(100, progressValue));
    if (!nextTier) progressValue = 100;
    
    return {
        grade: activeTier.grade,
        progressValue,
        color: activeTier.color,
        label: activeTier.label,
        message: activeTier.message,
        nextTierMin: nextTier?.min ?? null
    };
}

/**
 * Centralized Single Point of Truth to add or deduct points.
 * All screen components must invoke this method instead of calling Firestore directly.
 */
export async function addPoints(amount, gameType, isDailyWin = true) {
    // Test points live in a separate display layer, including when signed out.
    if (gameType === 'dev') {
        return import.meta.env.DEV ? addPreviewPoints(amount) : getRankData();
    }
    const user = auth.currentUser;
    // Anonymous players (without an account) are completely excluded from the points and stats system.
    if (!user || user.isAnonymous) {
        return { ...cachedRankData };
    }

    const oldScore = cachedRankData.totalScore;
    const boundedDelta = Math.max(-100, Math.min(500, amount));
    const newScore = Math.max(0, oldScore + boundedDelta);

    // Optimistic UI update
    cachedRankData.totalScore = newScore;

    // Update stats counters
    if (gameType === 'characters') {
        cachedRankData.stats.charactersPlayed += 1;
        if (amount > 0) {
            cachedRankData.stats.totalWins += 1;
            cachedRankData.stats.charactersWon = (cachedRankData.stats.charactersWon || 0) + 1;
        } else {
            cachedRankData.stats.totalLosses += 1;
        }
    } else if (gameType === 'items') {
        cachedRankData.stats.itemsPlayed += 1;
        if (amount > 0) {
            cachedRankData.stats.totalWins += 1;
            cachedRankData.stats.itemsWon = (cachedRankData.stats.itemsWon || 0) + 1;
        } else {
            cachedRankData.stats.totalLosses += 1;
        }
    } else if (gameType === 'songs') {
        cachedRankData.stats.songsPlayed += 1;
        if (amount > 0) {
            cachedRankData.stats.totalWins += 1;
            cachedRankData.stats.songsWon = (cachedRankData.stats.songsWon || 0) + 1;
        } else {
            cachedRankData.stats.totalLosses += 1;
        }
    } else if (gameType === 'daily') {
        if (isDailyWin && amount > 0) {
            cachedRankData.stats.dailyCompleted += 1;
            cachedRankData.stats.totalWins += 1;
        } else {
            cachedRankData.stats.totalLosses += 1;
        }
    }

    // Check for rank change notification
    checkRankChange(oldScore, newScore);
    window.dispatchEvent(new Event('deltasong_rank_change'));

    // Synchronize with Firestore for authenticated account
    // Enforce 2-second rate-limit cooldown
    const now = Date.now();
    if (now - lastMutationTimestamp < 2000) {
        await new Promise(res => setTimeout(res, 2000 - (now - lastMutationTimestamp)));
    }
    lastMutationTimestamp = Date.now();

    try {
        const userRef = doc(db, 'users', user.uid);
        const todayStr = getLocalDateString();

        // If daily win, create daily record document to prevent re-farming
        if (gameType === 'daily' && isDailyWin) {
            const dailyRef = doc(db, 'users', user.uid, 'daily_records', todayStr);
            await setDoc(dailyRef, {
                completedAt: serverTimestamp(),
                won: true
            });
        }

        // Update user document
        await updateDoc(userRef, {
            totalScore: newScore,
            stats: cachedRankData.stats,
            updatedAt: serverTimestamp()
        });

        // Append audit event
        await addDoc(collection(db, 'score_events'), {
            userId: user.uid,
            gameType,
            pointsDelta: boundedDelta,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error('[ScoreService] Failed to sync score with Firestore:', error);
    }

    return { ...cachedRankData };
}

/**
 * Checks for rank elevation/demotion and triggers toast notifications
 */
function checkRankChange(oldScore, newScore) {
    const oldRank = calculateUserRank(oldScore);
    const newRank = calculateUserRank(newScore);
    
    if (oldRank.grade !== newRank.grade) {
        const isUp = RANK_TIERS.findIndex(t => t.grade === newRank.grade) > RANK_TIERS.findIndex(t => t.grade === oldRank.grade);
        
        setTimeout(() => {
            notifications.show({
                title: isUp ? 'RANK UP!' : 'RANK DOWN...',
                message: isUp 
                    ? `Fantastic! You reached ${newRank.label} (${newRank.grade} Rank)!` 
                    : `Oh no! You dropped to ${newRank.label} (${newRank.grade} Rank).`,
                color: isUp ? 'emeraldGreen' : 'red',
                autoClose: 5000
            });
        }, 100);
    }
}

/**
 * Idempotent migration from legacy localStorage to Firestore.
 * STRICTLY ISOLATED: only checks for this user's OWN specific legacy key.
 */
export async function migrateLocalStorageToFirestore(userId, currentProfile) {
    if (!currentProfile || !currentProfile.username) return;

    const userClean = currentProfile.username.toLowerCase().trim();
    if (!userClean || userClean === 'player' || userClean === 'guest' || userClean.startsWith('guest_')) {
        return;
    }

    const migrationFlagKey = `deltasong_migrated_${userId}`;
    if (localStorage.getItem(migrationFlagKey)) return;

    // Only look for this exact user's offline key
    const userSpecificKey = `deltasong_rank_data_${userClean}`;
    let legacyData = null;
    try {
        const raw = localStorage.getItem(userSpecificKey);
        if (raw) {
            legacyData = JSON.parse(raw);
        }
    } catch {
        // ignore parse error
    }

    if (legacyData && legacyData.totalScore > 0) {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const onlineScore = userSnap.exists() ? (userSnap.data().totalScore || 0) : 0;

        // Force migration ONLY if local score for this specific user is higher than online score
        if (legacyData.totalScore > onlineScore) {
            console.log(`[Deltasong] Migrating legacy rank data for ${userClean}:`, legacyData.totalScore, 'pts to cloud Firestore');
            const sanitizedScore = Math.min(50000, legacyData.totalScore);
            await updateDoc(userRef, {
                totalScore: sanitizedScore,
                streak: Math.max(userSnap.data()?.streak || 1, legacyData.streak || 1),
                stats: {
                    ...cachedRankData.stats,
                    ...(legacyData.stats || {})
                },
                updatedAt: serverTimestamp()
            });

            cachedRankData.totalScore = sanitizedScore;
            cachedRankData.streak = Math.max(1, legacyData.streak || 1);
            cachedRankData.stats = { ...cachedRankData.stats, ...(legacyData.stats || {}) };
            window.dispatchEvent(new Event('deltasong_rank_change'));
        }
    }

    localStorage.setItem(migrationFlagKey, 'true');
}

// Dev mode helpers
if (import.meta.env.DEV) {
    window.deltasongDev = window.deltasongDev || {};
    window.deltasongDev.addPoints = addPreviewPoints;
    window.deltasongDev.setScore = setPreviewScore;
    window.deltasongDev.clearScorePreview = () => {
        previewScore = null;
        window.dispatchEvent(new Event('deltasong_rank_change'));
        return getRankData();
    };
}
