import { createGame, makeGuess } from './characterGame.js';
import { createItemGame, makeItemGuess } from './itemGame.js';
import { createSongGame, makeSongGuess, compareSongs } from './songGame.js';
import { compareCharacters } from './Character.js';
import { createPRNG } from './dailySeed.js';
import { DAILY_LIMITS, RANK_POINTS } from '../config/Constants.js';

import { auth } from '../config/firebase.js';

const STORAGE_KEY_PREFIX = 'daily_status_';

export function getDailyStorageKey(dateStr, userId = null) {
    const resolvedUid = userId || auth.currentUser?.uid || 'guest';
    return `${STORAGE_KEY_PREFIX}${resolvedUid}_${dateStr}`;
}

export function hasPlayedDaily(dateStr, userId = null) {
    if (!dateStr) return false;
    const key = getDailyStorageKey(dateStr, userId);
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return false;
        const parsed = JSON.parse(stored);
        return parsed && (parsed.status === 'victory' || parsed.status === 'defeat');
    } catch {
        return false;
    }
}

export function calculateStagePoints(attempts, durationMs, isVictory, modeType, hintsUsed = 0) {
    if (!isVictory) return 0;

    let points;
    if (attempts <= RANK_POINTS.ATTEMPTS_THRESHOLD_FAST) points = RANK_POINTS.VICTORY_FAST_ATTEMPTS;
    else if (attempts <= RANK_POINTS.ATTEMPTS_THRESHOLD_MEDIUM) points = RANK_POINTS.VICTORY_MEDIUM_ATTEMPTS;
    else points = RANK_POINTS.VICTORY_SLOW_ATTEMPTS;

    const seconds = durationMs / 1000;
    if (seconds < RANK_POINTS.SPEED_THRESHOLD_SECONDS) {
        points += RANK_POINTS.SPEED_BONUS;
    }

    if (modeType === 'songs') {
        const paidPenalty = Math.max(0, hintsUsed - 1) * (RANK_POINTS.SONG_HINT_PENALTY || 10);
        points = Math.max(points, paidPenalty + 10);
    }

    return points;
}

export function getNextIncompleteStep(currentStep, stageResults) {
    const order = [1, 2, 3];
    const startIndex = order.indexOf(currentStep);
    
    for (let i = 1; i <= 3; i++) {
        const checkIndex = (startIndex + i) % 3;
        const step = order[checkIndex];
        const stepKey = step === 1 ? 'characters' : (step === 2 ? 'items' : 'songs');
        if (stageResults[stepKey] === null) {
            return step;
        }
    }
    return 'completed';
}

export function loadOrCreateDailyGame(dateStr, deltaruneCharacters, deltaruneItems, deltaruneSoundtrack, userId = null) {
    const resolvedUid = userId || auth.currentUser?.uid || 'guest';
    const key = getDailyStorageKey(dateStr, resolvedUid);
    let stored = localStorage.getItem(key);

    // Fallback: if user is logged in and had played previously under the un-scoped legacy key, migrate it
    if (!stored && resolvedUid !== 'guest') {
        const legacyKey = `${STORAGE_KEY_PREFIX}${dateStr}`;
        const legacyStored = localStorage.getItem(legacyKey);
        if (legacyStored) {
            stored = legacyStored;
            try {
                localStorage.setItem(key, legacyStored);
            } catch {
                // ignore storage error
            }
        }
    }

    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            parsed.userId = resolvedUid;
            if (parsed.guesses) {
                if (parsed.guesses.characters && parsed.guesses.characters.length > DAILY_LIMITS.characters) {
                    parsed.guesses.characters = parsed.guesses.characters.slice(0, DAILY_LIMITS.characters);
                }
                if (parsed.guesses.items && parsed.guesses.items.length > DAILY_LIMITS.items) {
                    parsed.guesses.items = parsed.guesses.items.slice(0, DAILY_LIMITS.items);
                }
                if (parsed.guesses.songs && parsed.guesses.songs.length > DAILY_LIMITS.songs) {
                    parsed.guesses.songs = parsed.guesses.songs.slice(0, DAILY_LIMITS.songs);
                }
            }

            if (!parsed.stageResults) {
                parsed.stageResults = {
                    characters: parsed.guesses?.characters?.some(g => g.isVictory) ? 'victory' : (parsed.guesses?.characters?.length >= DAILY_LIMITS.characters ? 'defeat' : null),
                    items: parsed.guesses?.items?.some(g => g.isCorrect) ? 'victory' : (parsed.guesses?.items?.length >= DAILY_LIMITS.items ? 'defeat' : null),
                    songs: parsed.guesses?.songs?.some(g => g.title?.correct) ? 'victory' : (parsed.guesses?.songs?.length >= DAILY_LIMITS.songs ? 'defeat' : null)
                };
            }
            if (!parsed.stagePoints) {
                parsed.stagePoints = {
                    characters: parsed.stageResults.characters === 'victory' ? RANK_POINTS.VICTORY_FAST_ATTEMPTS : 0,
                    items: parsed.stageResults.items === 'victory' ? RANK_POINTS.VICTORY_FAST_ATTEMPTS : 0,
                    songs: parsed.stageResults.songs === 'victory' ? RANK_POINTS.VICTORY_FAST_ATTEMPTS : 0
                };
            }
            if (!parsed.elapsedTimes) {
                parsed.elapsedTimes = {
                    characters: parsed.currentStep > 1 ? (parsed.elapsedTime || 0) / 3 : (parsed.elapsedTime || 0),
                    items: parsed.currentStep > 2 ? (parsed.elapsedTime || 0) / 3 : 0,
                    songs: parsed.currentStep > 3 || parsed.status !== 'playing' ? (parsed.elapsedTime || 0) / 3 : 0
                };
            }

            const allCompleted = parsed.stageResults.characters !== null &&
                                 parsed.stageResults.items !== null &&
                                 parsed.stageResults.songs !== null;
            if (!allCompleted && parsed.status !== 'playing') {
                parsed.status = 'playing';
                parsed.endTime = null;
                parsed.currentStep = getNextIncompleteStep(parsed.currentStep || 1, parsed.stageResults);
                saveDailyGame(parsed, resolvedUid);
            }

            return parsed;
        } catch (e) {
            console.error("Failed to parse daily game state from localStorage, creating a new one", e);
        }
    }

    // Decoupled PRNGs for each game
    const charPRNG = createPRNG(`${dateStr}-characters`);
    const itemsPRNG = createPRNG(`${dateStr}-items`);
    const songPRNG = createPRNG(`${dateStr}-songs`);

    const initialGameState = {
        date: dateStr,
        userId: resolvedUid,
        currentStep: 1, // 1: Characters, 2: Items, 3: Song
        status: "playing", // "playing", "victory", "defeat"
        startTime: Date.now(),
        endTime: null,
        characterState: createGame(deltaruneCharacters, charPRNG),
        itemState: createItemGame(deltaruneItems, "all", "", itemsPRNG),
        songState: createSongGame(deltaruneSoundtrack, songPRNG),
        guesses: {
            characters: [], // Prepended list of guesses
            items: [], // Prepended list of { item, isCorrect }
            songs: [] // Prepended list of guesses
        },
        stageResults: {
            characters: null,
            items: null,
            songs: null
        },
        stagePoints: {
            characters: 0,
            items: 0,
            songs: 0
        },
        elapsedTimes: {
            characters: 0,
            items: 0,
            songs: 0
        },
        elapsedTime: 0
    };

    saveDailyGame(initialGameState, resolvedUid);
    return initialGameState;
}

export function saveDailyGame(gameState, userId = null) {
    if (!gameState || !gameState.date) return;
    const resolvedUid = userId || gameState.userId || auth.currentUser?.uid || 'guest';
    const key = getDailyStorageKey(gameState.date, resolvedUid);
    try {
        localStorage.setItem(key, JSON.stringify({ ...gameState, userId: resolvedUid }));
    } catch (e) {
        console.error("Failed to save daily game state to localStorage", e);
    }
}

export function submitCharacterGuess(gameState, guessName) {
    if (gameState.status !== 'playing' || gameState.currentStep !== 1) return gameState;
    if (gameState.stageResults?.characters !== null) return gameState;

    try {
        const result = makeGuess(gameState.characterState, guessName);
        const outcome = result.outcome;
        const nextCharacterState = result.gameState;

        let nextGuesses = [...gameState.guesses.characters];
        let nextStep = gameState.currentStep;
        let nextStatus = gameState.status;
        let nextEndTime = gameState.endTime;
        let nextStageResults = { ...gameState.stageResults };
        let nextStagePoints = { ...gameState.stagePoints };

        let stageFinished = false;

        if (outcome === "Victory") {
            const targetCharResult = compareCharacters(gameState.characterState.target, gameState.characterState.target);
            targetCharResult.isVictory = true;
            nextGuesses = [targetCharResult, ...nextGuesses];
            
            const charTime = gameState.elapsedTimes?.characters || 0;
            const points = calculateStagePoints(nextGuesses.length, charTime, true, 'characters');
            nextStageResults.characters = "victory";
            nextStagePoints.characters = points;

            stageFinished = true;
        } else {
            nextGuesses = [outcome, ...nextGuesses];
            if (nextGuesses.length >= DAILY_LIMITS.characters) {
                nextStageResults.characters = "defeat";
                nextStagePoints.characters = 0;

                stageFinished = true;
            }
        }

        if (stageFinished) {
            const allCompleted = nextStageResults.characters !== null &&
                                 nextStageResults.items !== null &&
                                 nextStageResults.songs !== null;
            if (allCompleted) {
                nextStep = "completed";
                const allWon = nextStageResults.characters === "victory" &&
                                nextStageResults.items === "victory" &&
                                nextStageResults.songs === "victory";
                nextStatus = allWon ? "victory" : "defeat";
                nextEndTime = Date.now();
            } else {
                nextStep = getNextIncompleteStep(1, nextStageResults);
            }
        }

        const nextGameState = {
            ...gameState,
            characterState: nextCharacterState,
            currentStep: nextStep,
            status: nextStatus,
            endTime: nextEndTime,
            stageResults: nextStageResults,
            stagePoints: nextStagePoints,
            guesses: {
                ...gameState.guesses,
                characters: nextGuesses
            }
        };

        saveDailyGame(nextGameState);
        return nextGameState;
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export function submitItemGuess(gameState, guessName) {
    if (gameState.status !== 'playing' || gameState.currentStep !== 2) return gameState;
    if (gameState.stageResults?.items !== null) return gameState;

    try {
        const result = makeItemGuess(gameState.itemState, guessName);
        const { gameState: nextItemState, outcome, guess } = result;

        let nextGuesses = [...gameState.guesses.items];
        let nextStep = gameState.currentStep;
        let nextStatus = gameState.status;
        let nextEndTime = gameState.endTime;
        let nextStageResults = { ...gameState.stageResults };
        let nextStagePoints = { ...gameState.stagePoints };

        let stageFinished = false;

        const isCorrect = outcome === "Victory";
        const newGuess = { item: guess, isCorrect };
        nextGuesses = [newGuess, ...nextGuesses];

        if (isCorrect) {
            const itemTime = gameState.elapsedTimes?.items || 0;
            const points = calculateStagePoints(nextGuesses.length, itemTime, true, 'items');
            nextStageResults.items = "victory";
            nextStagePoints.items = points;

            stageFinished = true;
        } else {
            if (nextGuesses.length >= DAILY_LIMITS.items) {
                nextStageResults.items = "defeat";
                nextStagePoints.items = 0;

                stageFinished = true;
            }
        }

        if (stageFinished) {
            const allCompleted = nextStageResults.characters !== null &&
                                 nextStageResults.items !== null &&
                                 nextStageResults.songs !== null;
            if (allCompleted) {
                nextStep = "completed";
                const allWon = nextStageResults.characters === "victory" &&
                                nextStageResults.items === "victory" &&
                                nextStageResults.songs === "victory";
                nextStatus = allWon ? "victory" : "defeat";
                nextEndTime = Date.now();
            } else {
                nextStep = getNextIncompleteStep(2, nextStageResults);
            }
        }

        const nextGameState = {
            ...gameState,
            itemState: nextItemState,
            currentStep: nextStep,
            status: nextStatus,
            endTime: nextEndTime,
            stageResults: nextStageResults,
            stagePoints: nextStagePoints,
            guesses: {
                ...gameState.guesses,
                items: nextGuesses
            }
        };

        saveDailyGame(nextGameState);
        return nextGameState;
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export function submitSongGuess(gameState, guessTitle) {
    if (gameState.status !== 'playing' || gameState.currentStep !== 3) return gameState;
    if (gameState.stageResults?.songs !== null) return gameState;

    try {
        const result = makeSongGuess(gameState.songState, guessTitle);
        const outcome = result.outcome;
        const nextSongState = result.gameState;

        let nextGuesses = [...gameState.guesses.songs];
        let nextStep = gameState.currentStep;
        let nextStatus = gameState.status;
        let nextEndTime = gameState.endTime;
        let nextStageResults = { ...gameState.stageResults };
        let nextStagePoints = { ...gameState.stagePoints };

        let stageFinished = false;

        if (outcome === "Victory") {
            const targetSongResult = compareSongs(gameState.songState.target, gameState.songState.target);
            nextGuesses = [targetSongResult, ...nextGuesses];
            
            const songTime = gameState.elapsedTimes?.songs || 0;
            const hintsUsed = gameState.songState.hintsUsed || 0;
            const points = calculateStagePoints(nextGuesses.length, songTime, true, 'songs', hintsUsed);
            nextStageResults.songs = "victory";
            nextStagePoints.songs = points;

            stageFinished = true;
        } else {
            nextGuesses = [outcome, ...nextGuesses];
            if (nextGuesses.length >= DAILY_LIMITS.songs) {
                nextStageResults.songs = "defeat";
                nextStagePoints.songs = 0;

                stageFinished = true;
            }
        }

        if (stageFinished) {
            const allCompleted = nextStageResults.characters !== null &&
                                 nextStageResults.items !== null &&
                                 nextStageResults.songs !== null;
            if (allCompleted) {
                nextStep = "completed";
                const allWon = nextStageResults.characters === "victory" &&
                                nextStageResults.items === "victory" &&
                                nextStageResults.songs === "victory";
                nextStatus = allWon ? "victory" : "defeat";
                nextEndTime = Date.now();
            } else {
                nextStep = getNextIncompleteStep(3, nextStageResults);
            }
        }

        const nextGameState = {
            ...gameState,
            songState: nextSongState,
            currentStep: nextStep,
            status: nextStatus,
            endTime: nextEndTime,
            stageResults: nextStageResults,
            stagePoints: nextStagePoints,
            guesses: {
                ...gameState.guesses,
                songs: nextGuesses
            }
        };

        saveDailyGame(nextGameState);
        return nextGameState;
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export function giveUpDaily(gameState) {
    if (gameState.status !== 'playing') return gameState;

    const nextStageResults = { ...gameState.stageResults };
    const nextStagePoints = { ...gameState.stagePoints };
    
    if (nextStageResults.characters === null) {
        nextStageResults.characters = "defeat";
        nextStagePoints.characters = 0;
    }
    if (nextStageResults.items === null) {
        nextStageResults.items = "defeat";
        nextStagePoints.items = 0;
    }
    if (nextStageResults.songs === null) {
        nextStageResults.songs = "defeat";
        nextStagePoints.songs = 0;
    }

    const nextGameState = {
        ...gameState,
        status: "defeat",
        currentStep: "completed",
        stageResults: nextStageResults,
        stagePoints: nextStagePoints,
        endTime: Date.now()
    };

    saveDailyGame(nextGameState);
    return nextGameState;
}

