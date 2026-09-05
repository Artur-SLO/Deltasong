import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile 
} from 'firebase/auth';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    addDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { migrateLocalStorageToFirestore, setCachedRankData, resetCachedRankData } from './scoreService';
import { notifications } from '@mantine/notifications';
import { RANK_POINTS } from '../config/Constants';
import { getLocalDateString } from '../core/dailySeed';

// Cache key for instant synchronous session recovery on page load / F5
const CACHED_PROFILE_KEY = 'deltasong_cached_profile';

function getInitialCachedProfile() {
    try {
        const raw = localStorage.getItem(CACHED_PROFILE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && (parsed.uid || parsed.id || parsed.name)) {
                return parsed;
            }
        }
    } catch {
        // Ignore cache parse error on init
    }
    return null;
}

export function setCachedProfile(profile) {
    currentUserProfile = profile;
    try {
        if (profile) {
            localStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(profile));
        } else {
            localStorage.removeItem(CACHED_PROFILE_KEY);
        }
    } catch {
        // Ignore storage quota / access errors
    }
}

// Active user profile (restored instantly from cache on F5 / startup)
let currentUserProfile = getInitialCachedProfile();
if (currentUserProfile) {
    setCachedRankData(currentUserProfile);
}

/**
 * Normalizes username to an email address for cloud authentication
 */
function usernameToEmail(username) {
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    return `${clean || 'player'}@deltasong.app`;
}

/**
 * Deterministically normalizes passwords so any length (even < 6 chars)
 * is accepted by cloud auth without the player ever losing their account.
 */
function normalizePassword(rawPassword) {
    if (!rawPassword) return 'deltasong_pass';
    if (rawPassword.length < 6) {
        return `${rawPassword}__deltasong_secure_pad`;
    }
    return rawPassword;
}

/**
 * Maps cloud auth error codes to friendly, non-technical messages
 */
export function getFriendlyAuthErrorMessage(error) {
    const code = error?.code || '';
    switch (code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return "Invalid username or password. If you haven't created an account yet, please use the Register tab!";
        case 'auth/email-already-in-use':
            return 'This username is already taken. Please login or choose another username.';
        case 'auth/operation-not-allowed':
            return 'Account service is currently unavailable. Please try again later.';
        case 'auth/too-many-requests':
            return 'Too many failed login attempts. Please wait a moment and try again.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        default:
            return error?.message || 'Authentication failed. Please check your credentials and try again.';
    }
}

let isLoggingOut = false;
let pendingRegistration = null;

/**
 * Initializes authentication on app startup:
 * 1. Checks if a cloud Firebase session is already active.
 * 2. If not, checks if an active account exists in localStorage and automatically logs in.
 */
export async function initializeAuth() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (firebaseUser) => {
            if (isLoggingOut) {
                setCachedProfile(null);
                window.dispatchEvent(new Event('deltasong_auth_change'));
                resolve(null);
                return;
            }

            if (firebaseUser && !firebaseUser.isAnonymous) {
                const reg = pendingRegistration;
                const profile = await fetchOrCreateUserProfile(
                    firebaseUser,
                    reg?.name || null,
                    reg?.avatar || null
                );
                setCachedProfile(profile);
                setCachedRankData(profile);
                
                try {
                    await migrateLocalStorageToFirestore(firebaseUser.uid, profile);
                } catch (err) {
                    console.warn('[Auth] Migration check warning:', err);
                }

                try {
                    await updateActiveUserStreak();
                } catch (streakErr) {
                    console.warn('[Auth] Startup streak sync warning:', streakErr);
                }

                window.dispatchEvent(new Event('deltasong_auth_change'));
                resolve(profile);
            } else {
                // If previous session was an unwanted anonymous guest, clean it up
                if (firebaseUser && firebaseUser.isAnonymous) {
                    try {
                        await signOut(auth);
                    } catch {
                        // ignore signOut failure on anonymous session
                    }
                }

                // Check for legacy active account in localStorage to auto-login
                try {
                    const localUserRaw = localStorage.getItem('deltasong_active_user');
                    if (localUserRaw) {
                        const localUser = JSON.parse(localUserRaw);
                        if (localUser && localUser.name) {
                            console.log('[Deltasong] Restoring local session for:', localUser.name);
                            const profile = await loginUser(localUser.name, localUser.password || 'deltasong_pass');
                            if (profile) {
                                setCachedProfile(profile);
                                setCachedRankData(profile);
                                window.dispatchEvent(new Event('deltasong_auth_change'));
                                resolve(profile);
                                return;
                            }
                        }
                    }
                } catch (e) {
                    console.warn('[Deltasong] Auto-sync error:', e);
                }

                setCachedProfile(null);
                window.dispatchEvent(new Event('deltasong_auth_change'));
                resolve(null);
            }
        });
    });
}

/**
 * Fetches user profile from Firestore or creates it, pulling legacy score from localStorage on initial creation
 */
export async function fetchOrCreateUserProfile(firebaseUser, customName = null, customAvatar = null) {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    // 1. If user document already exists in Firestore, Firestore is the SINGLE source of truth!
    if (userSnap.exists()) {
        const data = userSnap.data();
        let needsUpdate = false;
        const updates = {};

        // If online name is dummy 'Player' or 'Guest', update it if real name is provided
        if (customName && (data.username === 'Player' || data.username.startsWith('Guest_')) && customName !== 'Player') {
            updates.username = customName;
            data.username = customName;
            needsUpdate = true;
        }

        // If online avatar is default 'kris' and custom avatar is provided, update it
        if (customAvatar && (!data.avatar || data.avatar === 'kris') && customAvatar !== 'kris') {
            updates.avatar = customAvatar;
            data.avatar = customAvatar;
            needsUpdate = true;
        }

        if (needsUpdate) {
            updates.updatedAt = serverTimestamp();
            try {
                await updateDoc(userRef, updates);
            } catch (err) {
                console.warn('[Deltasong] Profile update warning:', err);
            }
        }

        currentUserProfile = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            name: data.username,
            username: data.username,
            avatar: data.avatar || 'kris',
            streak: data.streak || 1,
            totalScore: data.totalScore || 0,
            stats: data.stats || {
                charactersPlayed: 0,
                charactersWon: 0,
                itemsPlayed: 0,
                itemsWon: 0,
                songsPlayed: 0,
                songsWon: 0,
                dailyCompleted: 0,
                totalWins: 0,
                totalLosses: 0
            }
        };

        setCachedProfile(currentUserProfile);
        setCachedRankData(currentUserProfile);
        return currentUserProfile;
    }

    // 2. Document does not exist in Firestore yet: Brand new account creation!
    // STRICT ISOLATION: Check ONLY if there's a legacy score for this exact username
    const resolvedName = customName || pendingRegistration?.name || firebaseUser.displayName || 'Player';
    const resolvedAvatar = customAvatar || pendingRegistration?.avatar || 'kris';

    let legacyScore = 0;
    let legacyStreak = 1;
    let legacyStats = null;

    if (resolvedName && resolvedName !== 'Player') {
        const cleanName = resolvedName.toLowerCase().trim();
        try {
            const userSpecificKey = `deltasong_rank_data_${cleanName}`;
            const stored = localStorage.getItem(userSpecificKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.totalScore > 0) {
                    legacyScore = Math.min(50000, parsed.totalScore);
                    if (parsed.streak) legacyStreak = parsed.streak;
                    if (parsed.stats) legacyStats = parsed.stats;
                }
            }
        } catch {
            // ignore parse error
        }
    }

    const initialData = {
        userId: firebaseUser.uid,
        username: resolvedName,
        avatar: resolvedAvatar,
        totalScore: legacyScore,
        streak: legacyStreak,
        stats: legacyStats || {
            charactersPlayed: 0,
            charactersWon: 0,
            itemsPlayed: 0,
            itemsWon: 0,
            songsPlayed: 0,
            songsWon: 0,
            dailyCompleted: 0,
            totalWins: 0,
            totalLosses: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    await setDoc(userRef, initialData);

    currentUserProfile = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name: initialData.username,
        username: initialData.username,
        avatar: initialData.avatar,
        streak: initialData.streak,
        totalScore: initialData.totalScore,
        stats: initialData.stats
    };

    setCachedProfile(currentUserProfile);
    setCachedRankData(currentUserProfile);
    return currentUserProfile;
}

/**
 * Returns currently authenticated active user profile (synchronous, null when logged out)
 */
export function getActiveUser() {
    return currentUserProfile;
}

/**
 * Registers a new account with username and password
 */
export async function registerUser(name, password, avatar = 'kris') {
    if (!name || !password) throw new Error('Name and password are required');
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 18) {
        throw new Error('Username must be between 2 and 18 characters');
    }
    if (trimmedName.toLowerCase() === 'player' || trimmedName.toLowerCase().startsWith('guest_')) {
        throw new Error('This username is reserved. Please choose another username.');
    }
    if (!/^[a-zA-Z0-9_ -]+$/.test(trimmedName)) {
        throw new Error('Username can only contain letters, numbers, spaces, hyphens, and underscores.');
    }

    // 1. Strict username uniqueness check in Firestore
    try {
        const usersRef = collection(db, 'users');
        const existingSnap = await getDocs(query(usersRef, where('username', '==', trimmedName)));
        if (!existingSnap.empty) {
            throw new Error('This username is already taken. Please choose another username.');
        }
    } catch (checkErr) {
        if (checkErr.message?.includes('already taken')) throw checkErr;
        console.warn('[Auth] Pre-check warning:', checkErr);
    }

    const email = usernameToEmail(trimmedName);
    const safePassword = normalizePassword(password);

    // Track pending registration so onAuthStateChanged has the username immediately
    pendingRegistration = { name: trimmedName, avatar };

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, safePassword);
        await updateProfile(userCredential.user, { displayName: trimmedName });

        const profile = await fetchOrCreateUserProfile(userCredential.user, trimmedName, avatar);
        pendingRegistration = null;

        // Save active user in localStorage
        try {
            localStorage.setItem('deltasong_active_user', JSON.stringify({
                name: trimmedName,
                password: safePassword,
                avatar,
                streak: profile.streak || 1,
                lastLogin: new Date().toISOString().slice(0, 10)
            }));
        } catch {
            // ignore storage quota error
        }

        setCachedProfile(profile);
        setCachedRankData(profile);
        window.dispatchEvent(new Event('deltasong_auth_change'));
        return profile;
    } catch (authErr) {
        pendingRegistration = null;
        if (authErr?.code === 'auth/email-already-in-use') {
            throw new Error('This username is already taken. Please choose another username.', { cause: authErr });
        }
        throw new Error(getFriendlyAuthErrorMessage(authErr), { cause: authErr });
    }
}

/**
 * Logs in existing user with username/email and password.
 * If user exists in legacy localStorage but not yet online, auto-registers them seamlessly!
 */
export async function loginUser(name, password) {
    if (!name || !password) throw new Error('Name and password are required');
    const email = name.includes('@') ? name : usernameToEmail(name);
    const safePassword = normalizePassword(password);

    // Try signing in with normalized password, or raw password fallback
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, safePassword);
        const profile = await fetchOrCreateUserProfile(userCredential.user);
        try {
            localStorage.setItem('deltasong_active_user', JSON.stringify({
                name: profile.name,
                password: safePassword,
                avatar: profile.avatar,
                streak: profile.streak || 1,
                lastLogin: getLocalDateString()
            }));
        } catch {
            // ignore
        }
        setCachedProfile(profile);
        setCachedRankData(profile);
        window.dispatchEvent(new Event('deltasong_auth_change'));
        await updateActiveUserStreak();
        return profile;
    } catch (authErr) {
        if (safePassword !== password) {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const profile = await fetchOrCreateUserProfile(userCredential.user);
                try {
                    localStorage.setItem('deltasong_active_user', JSON.stringify({
                        name: profile.name,
                        password: password,
                        avatar: profile.avatar,
                        streak: profile.streak || 1,
                        lastLogin: getLocalDateString()
                    }));
                } catch {
                    // ignore
                }
                setCachedProfile(profile);
                setCachedRankData(profile);
                window.dispatchEvent(new Event('deltasong_auth_change'));
                await updateActiveUserStreak();
                return profile;
            } catch {
                // ignore and fall through to legacy resolution
            }
        }

        // Check for matching legacy localStorage user to auto-register
        let legacyUsers;
        try {
            legacyUsers = JSON.parse(localStorage.getItem('deltasong_users') || '[]');
        } catch {
            legacyUsers = [];
        }

        const legacyMatch = legacyUsers.find(
            u => u.name && u.name.toLowerCase().trim() === name.toLowerCase().trim() && u.password === password
        );

        if (legacyMatch) {
            try {
                return await registerUser(name, password, legacyMatch.avatar || 'kris');
            } catch (regErr) {
                throw new Error(regErr.message || getFriendlyAuthErrorMessage(authErr), { cause: regErr });
            }
        }

        // Also check if deltasong_active_user matches name
        try {
            const activeRaw = localStorage.getItem('deltasong_active_user');
            if (activeRaw) {
                const activeParsed = JSON.parse(activeRaw);
                if (activeParsed.name && activeParsed.name.toLowerCase().trim() === name.toLowerCase().trim()) {
                    return await registerUser(name, password, activeParsed.avatar || 'kris');
                }
            }
        } catch {
            // ignore local parse error
        }

        throw new Error(getFriendlyAuthErrorMessage(authErr), { cause: authErr });
    }
}

/**
 * Updates active user avatar with instant optimistic local update and background cloud sync
 */
export async function updateUserAvatar(avatarUrl) {
    if (!currentUserProfile) return null;

    // 1. Instant optimistic update in memory and persistent cache (0ms)
    currentUserProfile.avatar = avatarUrl;
    setCachedProfile({ ...currentUserProfile });

    try {
        const localActiveRaw = localStorage.getItem('deltasong_active_user');
        if (localActiveRaw) {
            const parsed = JSON.parse(localActiveRaw);
            parsed.avatar = avatarUrl;
            localStorage.setItem('deltasong_active_user', JSON.stringify(parsed));
        }
    } catch {
        // ignore local storage error
    }

    // 2. Instantly notify UI components across the application
    window.dispatchEvent(new Event('deltasong_auth_change'));

    // 3. Asynchronously persist to Firestore in background without blocking UI
    if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        updateDoc(userRef, {
            avatar: avatarUrl,
            updatedAt: serverTimestamp()
        }).catch(err => {
            console.warn('[Deltasong] Background avatar update warning:', err);
        });
    }

    return currentUserProfile;
}

let isUpdatingStreak = false;

/**
 * Calculates, updates, and synchronizes active user daily streak with Firestore.
 * Handles consecutive day increments, streak break penalties, and offline caching.
 */
export async function updateActiveUserStreak() {
    if (isUpdatingStreak) return currentUserProfile;
    isUpdatingStreak = true;

    try {
        const user = auth.currentUser;
        const todayStr = getLocalDateString();

        // 1. Authenticated User Cloud Sync
        if (user && currentUserProfile) {
            const streakKey = `deltasong_streak_date_${user.uid}`;
            let lastDateStr = localStorage.getItem(streakKey);

            if (!lastDateStr) {
                try {
                    const localActive = JSON.parse(localStorage.getItem('deltasong_active_user') || '{}');
                    if (localActive.lastLogin) lastDateStr = localActive.lastLogin;
                } catch {
                    // ignore
                }
            }

            // First time tracking on this device
            if (!lastDateStr) {
                localStorage.setItem(streakKey, todayStr);
                return currentUserProfile;
            }

            // Already verified today
            if (lastDateStr === todayStr) {
                return currentUserProfile;
            }

            const [y1, m1, d1] = lastDateStr.split('-').map(Number);
            const [y2, m2, d2] = todayStr.split('-').map(Number);
            const date1 = new Date(y1, m1 - 1, d1);
            const date2 = new Date(y2, m2 - 1, d2);
            const diffDays = Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day -> Streak Up!
                const newStreak = (currentUserProfile.streak || 0) + 1;
                currentUserProfile.streak = newStreak;
                localStorage.setItem(streakKey, todayStr);

                try {
                    const activeUser = JSON.parse(localStorage.getItem('deltasong_active_user') || '{}');
                    activeUser.streak = newStreak;
                    activeUser.lastLogin = todayStr;
                    localStorage.setItem('deltasong_active_user', JSON.stringify(activeUser));
                } catch {
                    // ignore
                }

                setCachedProfile({ ...currentUserProfile });
                setCachedRankData(currentUserProfile);

                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    streak: newStreak,
                    updatedAt: serverTimestamp()
                }).catch(err => console.warn('[Deltasong] Streak Firestore sync warning:', err));

                window.dispatchEvent(new Event('deltasong_auth_change'));
                window.dispatchEvent(new Event('deltasong_rank_change'));

                setTimeout(() => {
                    notifications.show({
                        title: 'Streak Up!',
                        message: `You're on a ${newStreak}-day streak! Keep it up!`,
                        color: 'royalMagenta',
                        autoClose: 5000
                    });
                }, 300);

            } else if (diffDays > 1) {
                // Missed one or more days -> Streak broken
                const oldStreak = currentUserProfile.streak || 1;
                const newStreak = 1;
                currentUserProfile.streak = newStreak;
                localStorage.setItem(streakKey, todayStr);

                try {
                    const activeUser = JSON.parse(localStorage.getItem('deltasong_active_user') || '{}');
                    activeUser.streak = newStreak;
                    activeUser.lastLogin = todayStr;
                    localStorage.setItem('deltasong_active_user', JSON.stringify(activeUser));
                } catch {
                    // ignore
                }

                const userRef = doc(db, 'users', user.uid);
                if (oldStreak > 1) {
                    const penalty = RANK_POINTS.STREAK_BREAK_PENALTY || 50;
                    const oldScore = currentUserProfile.totalScore || 0;
                    const newScore = Math.max(0, oldScore - penalty);
                    currentUserProfile.totalScore = newScore;

                    setCachedProfile({ ...currentUserProfile });
                    setCachedRankData(currentUserProfile);

                    await updateDoc(userRef, {
                        streak: newStreak,
                        totalScore: newScore,
                        updatedAt: serverTimestamp()
                    }).catch(err => console.warn('[Deltasong] Streak reset warning:', err));

                    await addDoc(collection(db, 'score_events'), {
                        userId: user.uid,
                        gameType: 'penalty',
                        pointsDelta: -penalty,
                        createdAt: serverTimestamp()
                    }).catch(() => {});

                    window.dispatchEvent(new Event('deltasong_auth_change'));
                    window.dispatchEvent(new Event('deltasong_rank_change'));

                    setTimeout(() => {
                        notifications.show({
                            title: 'Streak Broken!',
                            message: `You missed a day! Your streak has reset to 1.`,
                            color: 'red',
                            autoClose: 6000
                        });
                    }, 300);
                } else {
                    setCachedProfile({ ...currentUserProfile });
                    setCachedRankData(currentUserProfile);

                    await updateDoc(userRef, {
                        streak: newStreak,
                        updatedAt: serverTimestamp()
                    }).catch(err => console.warn('[Deltasong] Streak reset warning:', err));

                    window.dispatchEvent(new Event('deltasong_auth_change'));
                    window.dispatchEvent(new Event('deltasong_rank_change'));
                }
            }
        } else {
            // 2. Guest User Streak (Local only)
            const guestKey = 'deltasong_guest_streak_date';
            const guestDataKey = 'deltasong_rank_data_guest';
            let lastDateStr = localStorage.getItem(guestKey);

            if (!lastDateStr) {
                localStorage.setItem(guestKey, todayStr);
                return null;
            }

            if (lastDateStr === todayStr) {
                return null;
            }

            const [y1, m1, d1] = lastDateStr.split('-').map(Number);
            const [y2, m2, d2] = todayStr.split('-').map(Number);
            const date1 = new Date(y1, m1 - 1, d1);
            const date2 = new Date(y2, m2 - 1, d2);
            const diffDays = Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));

            let guestRank = {};
            try {
                guestRank = JSON.parse(localStorage.getItem(guestDataKey) || '{}');
            } catch {}

            if (diffDays === 1) {
                guestRank.streak = (guestRank.streak || 0) + 1;
                localStorage.setItem(guestKey, todayStr);
                localStorage.setItem(guestDataKey, JSON.stringify(guestRank));
                setCachedRankData(guestRank);
                window.dispatchEvent(new Event('deltasong_rank_change'));
            } else if (diffDays > 1) {
                guestRank.streak = 1;
                localStorage.setItem(guestKey, todayStr);
                localStorage.setItem(guestDataKey, JSON.stringify(guestRank));
                setCachedRankData(guestRank);
                window.dispatchEvent(new Event('deltasong_rank_change'));
            }
        }
    } catch (err) {
        console.warn('[Deltasong] updateActiveUserStreak error:', err);
    } finally {
        isUpdatingStreak = false;
    }

    return currentUserProfile;
}

/**
 * Signs out and resets active user to null, clearing active session
 */
export async function logoutUser() {
    isLoggingOut = true;
    localStorage.removeItem('deltasong_active_user');
    setCachedProfile(null);
    currentUserProfile = null;
    resetCachedRankData();
    window.dispatchEvent(new Event('deltasong_auth_change'));
    try {
        await signOut(auth);
    } catch {
        // ignore sign out network error
    }
    setTimeout(() => {
        isLoggingOut = false;
    }, 1500);
}

// Dev and Pen-Testing helpers directly callable in browser DevTools Console
if (typeof window !== 'undefined') {
    window.deltasongAuth = {
        getActiveUser,
        resetMyScore: async () => {
            const user = auth.currentUser;
            if (!user) {
                console.error('❌ You must be logged in to reset your score!');
                return;
            }
            const zeroStats = {
                charactersPlayed: 0,
                charactersWon: 0,
                itemsPlayed: 0,
                itemsWon: 0,
                songsPlayed: 0,
                songsWon: 0,
                dailyCompleted: 0,
                totalWins: 0,
                totalLosses: 0
            };
            try {
                await updateDoc(doc(db, 'users', user.uid), {
                    totalScore: 0,
                    streak: 1,
                    stats: zeroStats,
                    updatedAt: serverTimestamp()
                });
                if (currentUserProfile) {
                    currentUserProfile.totalScore = 0;
                    currentUserProfile.streak = 1;
                    currentUserProfile.stats = zeroStats;
                    setCachedProfile({ ...currentUserProfile });
                    setCachedRankData(currentUserProfile);
                }
                resetCachedRankData();
                window.dispatchEvent(new Event('deltasong_auth_change'));
                console.log('%c✅ Score for user ' + (currentUserProfile?.name || user.uid) + ' successfully reset to 0 in Firestore and locally!', 'color: #00ff27; font-weight: bold;');
            } catch (err) {
                console.error('Failed to reset score:', err);
            }
        },
        setStreak: async (newStreak) => {
            const user = auth.currentUser;
            if (!user) {
                console.error('❌ You must be logged in to set streak!');
                return;
            }
            try {
                await updateDoc(doc(db, 'users', user.uid), {
                    streak: Number(newStreak),
                    updatedAt: serverTimestamp()
                });
                if (currentUserProfile) {
                    currentUserProfile.streak = Number(newStreak);
                    setCachedProfile({ ...currentUserProfile });
                    setCachedRankData(currentUserProfile);
                }
                window.dispatchEvent(new Event('deltasong_auth_change'));
                window.dispatchEvent(new Event('deltasong_rank_change'));
                console.log('%c✅ Streak updated to ' + newStreak, 'color: #00ff27; font-weight: bold;');
            } catch (err) {
                console.error('Failed to set streak:', err);
            }
        },
        inspectLocalStorage: () => {
            const items = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('deltasong') || key.includes('user') || key.includes('rank'))) {
                    items[key] = localStorage.getItem(key);
                }
            }
            console.table(items);
            return items;
        }
    };

    window.deltasongPenTest = {
        testScoreSpoof: async (fakeScore = 9999999) => {
            const user = auth.currentUser;
            if (!user) {
                console.error('❌ You must be logged in to run this test!');
                return;
            }
            console.log(`[PenTest] Attempting unauthorized score injection: ${fakeScore} pts...`);
            try {
                await updateDoc(doc(db, 'users', user.uid), { 
                    totalScore: fakeScore,
                    updatedAt: serverTimestamp()
                });
                console.error('❌ VULNERABILITY DETECTED: Score injection succeeded!');
            } catch (err) {
                console.log('%c✅ BLOCKED BY FIRESTORE SECURITY RULES: ' + err.message, 'color: #00ff27; font-weight: bold;');
            }
        },
        testRateLimit: async () => {
            const user = auth.currentUser;
            if (!user) {
                console.error('❌ You must be logged in to run this test!');
                return;
            }
            console.log('[PenTest] Sending 5 rapid concurrent updates to test cooldown limit...');
            for (let i = 1; i <= 5; i++) {
                updateDoc(doc(db, 'users', user.uid), { updatedAt: serverTimestamp() })
                    .then(() => console.log(`%cReq ${i}: Accepted`, 'color: #00ffff;'))
                    .catch(e => console.log(`%cReq ${i}: Blocked by rate-limit (${e.code})`, 'color: #ffd43b; font-weight: bold;'));
            }
        },
        testImmutableField: async () => {
            const user = auth.currentUser;
            if (!user) {
                console.error('❌ You must be logged in to run this test!');
                return;
            }
            console.log('[PenTest] Attempting to tamper with immutable userId field...');
            try {
                await updateDoc(doc(db, 'users', user.uid), { 
                    userId: 'hacker_impersonator',
                    updatedAt: serverTimestamp()
                });
                console.error('❌ VULNERABILITY DETECTED: Immutable field was altered!');
            } catch (err) {
                console.log('%c✅ BLOCKED BY FIRESTORE SECURITY RULES: ' + err.message, 'color: #00ff27; font-weight: bold;');
            }
        }
    };
}
