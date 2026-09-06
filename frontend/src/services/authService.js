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
    currentUserProfile = profile ? { ...profile } : null;
    try {
        if (currentUserProfile) {
            localStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(currentUserProfile));
        } else {
            localStorage.removeItem(CACHED_PROFILE_KEY);
        }
    } catch {
        // Ignore storage quota / access errors
    }
    if (currentUserProfile) {
        setCachedRankData(currentUserProfile);
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
        case 'auth/user-disabled':
            return 'This account has been disabled. Please choose another username or create a new account.';
        case 'auth/email-already-in-use':
            return 'This username is already taken. Please login or choose another username.';
        case 'auth/weak-password':
            return 'Password is too weak. Please choose a password with at least 6 characters.';
        case 'auth/invalid-email':
            return 'Invalid username format. Please choose a valid username.';
        case 'auth/operation-not-allowed':
            return 'Account service is currently unavailable. Please try again later.';
        case 'auth/too-many-requests':
            return 'Too many failed login attempts. Please wait a moment and try again.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        default: {
            const raw = error?.message || '';
            if (raw.includes('auth/user-disabled')) {
                return 'This account has been disabled. Please choose another username or create a new account.';
            }
            if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password') || raw.includes('auth/user-not-found')) {
                return "Invalid username or password. If you haven't created an account yet, please use the Register tab!";
            }
            if (raw.includes('auth/email-already-in-use')) {
                return 'This username is already taken. Please login or choose another username.';
            }
            if (raw.includes('auth/weak-password')) {
                return 'Password is too weak. Please choose a password with at least 6 characters.';
            }
            if (raw.includes('auth/too-many-requests')) {
                return 'Too many failed login attempts. Please wait a moment and try again.';
            }
            if (raw.includes('auth/network-request-failed')) {
                return 'Network error. Please check your internet connection.';
            }
            if (raw.startsWith('Firebase:') || raw.includes('(auth/')) {
                return 'Authentication failed. Please check your credentials and try again.';
            }
            return raw || 'Authentication failed. Please check your credentials and try again.';
        }
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
            lastStreakDate: data.lastStreakDate || null,
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

    const initialData = {
        userId: firebaseUser.uid,
        username: resolvedName,
        avatar: resolvedAvatar,
        totalScore: 0,
        streak: 1,
        lastStreakDate: getLocalDateString(),
        stats: {
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
        lastStreakDate: initialData.lastStreakDate,
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
    return currentUserProfile ? { ...currentUserProfile } : null;
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
            u => u.name && u.name.toLowerCase().trim() === name.toLowerCase().trim() && (u.password === password || normalizePassword(u.password) === safePassword)
        );

        if (legacyMatch) {
            try {
                return await registerUser(name, password, legacyMatch.avatar || 'kris');
            } catch {
                throw new Error(getFriendlyAuthErrorMessage(authErr), { cause: authErr });
            }
        }

        // Also check if deltasong_active_user matches name AND password
        try {
            const activeRaw = localStorage.getItem('deltasong_active_user');
            if (activeRaw) {
                const activeParsed = JSON.parse(activeRaw);
                const nameMatches = activeParsed.name && activeParsed.name.toLowerCase().trim() === name.toLowerCase().trim();
                const passMatches = activeParsed.password && (activeParsed.password === password || activeParsed.password === safePassword || normalizePassword(activeParsed.password) === safePassword);
                if (nameMatches && passMatches) {
                    try {
                        return await registerUser(name, password, activeParsed.avatar || 'kris');
                    } catch {
                        throw new Error(getFriendlyAuthErrorMessage(authErr), { cause: authErr });
                    }
                }
            }
        } catch (e) {
            if (e.message && !e.message.includes('JSON')) throw e;
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
    if (isUpdatingStreak) return currentUserProfile ? { ...currentUserProfile } : null;
    isUpdatingStreak = true;

    try {
        const user = auth.currentUser;
        const todayStr = getLocalDateString();

        // 1. Authenticated User Cloud Sync
        if (user && currentUserProfile) {
            const streakKey = `deltasong_streak_date_${user.uid}`;
            let lastDateStr = currentUserProfile.lastStreakDate || localStorage.getItem(streakKey);

            if (!lastDateStr) {
                try {
                    const localActive = JSON.parse(localStorage.getItem('deltasong_active_user') || '{}');
                    if (localActive.lastLogin) lastDateStr = localActive.lastLogin;
                } catch {
                    // ignore
                }
            }

            // First time tracking: establish baseline today
            if (!lastDateStr) {
                currentUserProfile.lastStreakDate = todayStr;
                localStorage.setItem(streakKey, todayStr);
                const userRef = doc(db, 'users', user.uid);
                updateDoc(userRef, {
                    lastStreakDate: todayStr,
                    updatedAt: serverTimestamp()
                }).catch(() => {});
                setCachedProfile(currentUserProfile);
                window.dispatchEvent(new Event('deltasong_auth_change'));
                window.dispatchEvent(new Event('deltasong_rank_change'));
                return { ...currentUserProfile };
            }

            // Already verified today
            if (lastDateStr === todayStr) {
                return { ...currentUserProfile };
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
                currentUserProfile.lastStreakDate = todayStr;
                localStorage.setItem(streakKey, todayStr);

                try {
                    const activeUser = JSON.parse(localStorage.getItem('deltasong_active_user') || '{}');
                    activeUser.streak = newStreak;
                    activeUser.lastLogin = todayStr;
                    localStorage.setItem('deltasong_active_user', JSON.stringify(activeUser));
                } catch {
                    // ignore
                }

                setCachedProfile(currentUserProfile);

                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    streak: newStreak,
                    lastStreakDate: todayStr,
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
                currentUserProfile.lastStreakDate = todayStr;
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

                    setCachedProfile(currentUserProfile);

                    await updateDoc(userRef, {
                        streak: newStreak,
                        lastStreakDate: todayStr,
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
                    setCachedProfile(currentUserProfile);

                    await updateDoc(userRef, {
                        streak: newStreak,
                        lastStreakDate: todayStr,
                        updatedAt: serverTimestamp()
                    }).catch(err => console.warn('[Deltasong] Streak reset warning:', err));

                    window.dispatchEvent(new Event('deltasong_auth_change'));
                    window.dispatchEvent(new Event('deltasong_rank_change'));
                }
            }
        } else {
            return null;
        }
    } catch (err) {
        console.warn('[Deltasong] updateActiveUserStreak error:', err);
    } finally {
        isUpdatingStreak = false;
    }

    return currentUserProfile ? { ...currentUserProfile } : null;
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

// Dev and Pen-Testing helpers directly callable in browser DevTools Console (dev mode only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
    window.deltasongAuth = {
        getActiveUser,
        resetMyScore: async () => {
            const user = auth.currentUser;
            if (!user) {
                console.error('[Error] You must be logged in to reset your score.');
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
                console.log('%c[Success] Score for user ' + (currentUserProfile?.name || user.uid) + ' successfully reset to 0 in Firestore and locally.', 'color: #00ff27; font-weight: bold;');
            } catch (err) {
                console.error('Failed to reset score:', err);
            }
        },
        setStreak: async (newStreak) => {
            const user = auth.currentUser;
            if (!user) {
                console.error('[Error] You must be logged in to set streak.');
                return;
            }
            try {
                const todayStr = getLocalDateString();
                await updateDoc(doc(db, 'users', user.uid), {
                    streak: Number(newStreak),
                    lastStreakDate: todayStr,
                    updatedAt: serverTimestamp()
                });
                if (currentUserProfile) {
                    currentUserProfile.streak = Number(newStreak);
                    currentUserProfile.lastStreakDate = todayStr;
                    setCachedProfile(currentUserProfile);
                }
                window.dispatchEvent(new Event('deltasong_auth_change'));
                window.dispatchEvent(new Event('deltasong_rank_change'));
                console.log('%c[Success] Streak updated to ' + newStreak, 'color: #00ff27; font-weight: bold;');
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

    window.deltasongStreak = {
        /**
         * Displays current streak status across memory, localStorage, and Firestore
         */
        status: async () => {
            const user = auth.currentUser;
            if (!user) {
                console.warn('[Warn] You must be logged in to inspect streak status.');
                return;
            }
            const userRef = doc(db, 'users', user.uid);
            const snap = await getDoc(userRef);
            const cloudData = snap.exists() ? snap.data() : {};
            const streakKey = `deltasong_streak_date_${user.uid}`;

            const info = {
                'User': currentUserProfile?.name || user.displayName || user.uid,
                'Streak (Memory)': currentUserProfile?.streak ?? 'N/A',
                'Streak (Firestore)': cloudData.streak ?? 'N/A',
                'Streak Date (Memory)': currentUserProfile?.lastStreakDate ?? 'N/A',
                'Streak Date (Firestore)': cloudData.lastStreakDate ?? 'N/A',
                'Streak Date (LocalStorage)': localStorage.getItem(streakKey) ?? 'N/A',
                'Current Score': currentUserProfile?.totalScore ?? cloudData.totalScore ?? 0,
            };
            console.table(info);
            return info;
        },

        /**
         * Sets numeric streak directly
         */
        set: async (newStreak) => {
            return window.deltasongAuth.setStreak(newStreak);
        },

        /**
         * Simulates that the last login date was yesterday
         * Triggers verification routine: should increment streak by 1 and show Streak Up notification
         */
        simulateNextDay: async () => {
            const user = auth.currentUser;
            if (!user || !currentUserProfile) {
                console.error('[Error] You must be logged in to simulate streak.');
                return;
            }

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yYear = yesterday.getFullYear();
            const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
            const yDay = String(yesterday.getDate()).padStart(2, '0');
            const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

            console.log(`[Streak Test] Simulating last access as yesterday (${yesterdayStr})...`);

            const streakKey = `deltasong_streak_date_${user.uid}`;
            currentUserProfile.lastStreakDate = yesterdayStr;
            localStorage.setItem(streakKey, yesterdayStr);

            const updated = await updateActiveUserStreak();
            console.log(`%c[Streak Test] Success! New Streak: ${updated?.streak}`, 'color: #00ff27; font-weight: bold;');
            return updated;
        },

        /**
         * Simulates missing consecutive days (default: 2 days)
         * Triggers verification routine: should break streak to 1 and apply score penalty
         */
        simulateMissedDays: async (daysAgo = 2) => {
            const user = auth.currentUser;
            if (!user || !currentUserProfile) {
                console.error('[Error] You must be logged in to simulate streak.');
                return;
            }

            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - Math.max(2, daysAgo));
            const pYear = pastDate.getFullYear();
            const pMonth = String(pastDate.getMonth() + 1).padStart(2, '0');
            const pDay = String(pastDate.getDate()).padStart(2, '0');
            const pastDateStr = `${pYear}-${pMonth}-${pDay}`;

            console.log(`[Streak Test] Simulating last access as ${daysAgo} days ago (${pastDateStr})...`);

            const streakKey = `deltasong_streak_date_${user.uid}`;
            currentUserProfile.lastStreakDate = pastDateStr;
            localStorage.setItem(streakKey, pastDateStr);

            const updated = await updateActiveUserStreak();
            console.log(`%c[Streak Test] Streak broken! Reset to: ${updated?.streak} (Penalty applied)`, 'color: #ffd43b; font-weight: bold;');
            return updated;
        },

        /**
         * Triggers streak verification immediately
         */
        check: async () => {
            console.log('[Streak Test] Checking current streak...');
            return await updateActiveUserStreak();
        }
    };

    window.deltasongPenTest = {
        testScoreSpoof: async (fakeScore = 9999999) => {
            const user = auth.currentUser;
            if (!user) {
                console.error('[Error] You must be logged in to run this test.');
                return;
            }
            console.log(`[PenTest] Attempting unauthorized score injection: ${fakeScore} pts...`);
            try {
                await updateDoc(doc(db, 'users', user.uid), { 
                    totalScore: fakeScore,
                    updatedAt: serverTimestamp()
                });
                console.error('[Error] VULNERABILITY DETECTED: Score injection succeeded.');
            } catch (err) {
                console.log('%c[Success] BLOCKED BY FIRESTORE SECURITY RULES: ' + err.message, 'color: #00ff27; font-weight: bold;');
            }
        },
        testRateLimit: async () => {
            const user = auth.currentUser;
            if (!user) {
                console.error('[Error] You must be logged in to run this test.');
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
                console.error('[Error] You must be logged in to run this test.');
                return;
            }
            console.log('[PenTest] Attempting to tamper with immutable userId field...');
            try {
                await updateDoc(doc(db, 'users', user.uid), { 
                    userId: 'hacker_impersonator',
                    updatedAt: serverTimestamp()
                });
                console.error('[Error] VULNERABILITY DETECTED: Immutable field was altered.');
            } catch (err) {
                console.log('%c[Success] BLOCKED BY FIRESTORE SECURITY RULES: ' + err.message, 'color: #00ff27; font-weight: bold;');
            }
        }
    };
}
