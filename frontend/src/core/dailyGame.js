import { createGame, makeGuess } from './characterGame.js';
import { createItemGame, makeItemGuess } from './itemGame.js';
import { createSongGame, makeSongGuess, compareSongs } from './songGame.js';
import { compareCharacters } from './Character.js';
import { createPRNG } from './dailySeed.js';
import { DAILY_LIMITS } from '../config/Constants.js';

const STORAGE_KEY_PREFIX = 'daily_status_';

export function getDailyStorageKey(dateStr) {
    return `${STORAGE_KEY_PREFIX}${dateStr}`;
}

export function loadOrCreateDailyGame(dateStr, deltaruneCharacters, deltaruneItems, deltaruneSoundtrack) {
    const key = getDailyStorageKey(dateStr);
    const stored = localStorage.getItem(key);

    if (stored) {
        try {
            return JSON.parse(stored);
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
        }
    };

    saveDailyGame(initialGameState);
    return initialGameState;
}

export function saveDailyGame(gameState) {
    if (!gameState || !gameState.date) return;
    const key = getDailyStorageKey(gameState.date);
    localStorage.setItem(key, JSON.stringify(gameState));
}

export function submitCharacterGuess(gameState, guessName) {
    if (gameState.status !== 'playing' || gameState.currentStep !== 1) return gameState;

    try {
        const result = makeGuess(gameState.characterState, guessName);
        const outcome = result.outcome;
        const nextCharacterState = result.gameState;

        let nextGuesses = [...gameState.guesses.characters];
        let nextStep = gameState.currentStep;
        let nextStatus = gameState.status;
        let nextEndTime = gameState.endTime;

        if (outcome === "Victory") {
            const targetCharResult = compareCharacters(gameState.characterState.target, gameState.characterState.target);
            targetCharResult.isVictory = true;
            nextGuesses = [targetCharResult, ...nextGuesses];
            nextStep = 2; // Move to Items
        } else {
            nextGuesses = [outcome, ...nextGuesses];
            if (nextGuesses.length >= DAILY_LIMITS.characters) {
                nextStatus = "defeat";
                nextEndTime = Date.now();
            }
        }

        const nextGameState = {
            ...gameState,
            characterState: nextCharacterState,
            currentStep: nextStep,
            status: nextStatus,
            endTime: nextEndTime,
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

    try {
        const result = makeItemGuess(gameState.itemState, guessName);
        const { gameState: nextItemState, outcome, guess } = result;

        let nextGuesses = [...gameState.guesses.items];
        let nextStep = gameState.currentStep;
        let nextStatus = gameState.status;
        let nextEndTime = gameState.endTime;

        const isCorrect = outcome === "Victory";
        const newGuess = { item: guess, isCorrect };
        nextGuesses = [newGuess, ...nextGuesses];

        if (isCorrect) {
            nextStep = 3; // Move to Song
        } else {
            if (nextGuesses.length >= DAILY_LIMITS.items) {
                nextStatus = "defeat";
                nextEndTime = Date.now();
            }
        }

        const nextGameState = {
            ...gameState,
            itemState: nextItemState,
            currentStep: nextStep,
            status: nextStatus,
            endTime: nextEndTime,
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

    try {
        const result = makeSongGuess(gameState.songState, guessTitle);
        const outcome = result.outcome;
        const nextSongState = result.gameState;

        let nextGuesses = [...gameState.guesses.songs];
        let nextStep = gameState.currentStep;
        let nextStatus = gameState.status;
        let nextEndTime = gameState.endTime;

        if (outcome === "Victory") {
            const targetSongResult = compareSongs(gameState.songState.target, gameState.songState.target);
            nextGuesses = [targetSongResult, ...nextGuesses];
            nextStatus = "victory";
            nextStep = "completed";
            nextEndTime = Date.now();
        } else {
            nextGuesses = [outcome, ...nextGuesses];
            if (nextGuesses.length >= DAILY_LIMITS.songs) {
                nextStatus = "defeat";
                nextEndTime = Date.now();
            }
        }

        const nextGameState = {
            ...gameState,
            songState: nextSongState,
            currentStep: nextStep,
            status: nextStatus,
            endTime: nextEndTime,
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

    const nextGameState = {
        ...gameState,
        status: "defeat",
        endTime: Date.now()
    };

    saveDailyGame(nextGameState);
    return nextGameState;
}
