import { compareSongs } from './songGame.js';

import { 
    RUSH_STAGES, 
    RUSH_POINTS, 
    RUSH_LIVES, 
    RUSH_CURATED_POOLS 
} from '../config/Constants.js';

export { 
    RUSH_STAGES, 
    RUSH_POINTS, 
    RUSH_LIVES, 
    RUSH_CURATED_POOLS 
};

function normalizeTitle(title) {
    return (title || '').toUpperCase().trim();
}

function pickUniqueSong(soundtrack, poolTitles, usedTitles, usedUrls = null, randomFn = Math.random) {
    const isSongUnused = (s) => {
        if (!s || !s.title) return false;
        const normTitle = normalizeTitle(s.title);
        const normUrl = (s.url || '').trim();
        if (usedTitles && usedTitles.has(normTitle)) return false;
        if (usedUrls && normUrl && usedUrls.has(normUrl)) return false;
        return true;
    };

    const soundtrackMap = new Map(soundtrack.map(s => [normalizeTitle(s.title), s]));
    const availablePool = poolTitles
        .map(t => soundtrackMap.get(normalizeTitle(t)))
        .filter(s => s && isSongUnused(s));

    let chosenSong = null;
    if (availablePool.length > 0) {
        chosenSong = availablePool[Math.floor(randomFn() * availablePool.length)];
    } else {
        // Fallback to any unused song from the entire soundtrack
        const availableAll = soundtrack.filter(s => isSongUnused(s));
        if (availableAll.length > 0) {
            chosenSong = availableAll[Math.floor(randomFn() * availableAll.length)];
        } else {
            // Extreme fallback if entire catalog was exhausted
            chosenSong = soundtrack[Math.floor(randomFn() * soundtrack.length)];
        }
    }

    if (chosenSong) {
        if (usedTitles) usedTitles.add(normalizeTitle(chosenSong.title));
        if (usedUrls && chosenSong.url) usedUrls.add(chosenSong.url.trim());
    }
    return chosenSong;
}

export function calculateRandomStartTime(target, durationLimit = 5.0, randomFn = Math.random) {
    if (!target || !target.duration_seconds || target.duration_seconds <= durationLimit) {
        return 0;
    }
    return Math.floor(randomFn() * (target.duration_seconds - durationLimit));
}

export function createSongRushGame(soundtrack, randomFn = Math.random, recentTitles = []) {
    const usedTitles = new Set((recentTitles || []).map(normalizeTitle));
    const usedUrls = new Set();

    // If recentTitles over-restricts the Easy/Medium pool, clear recent history
    const easyPool = RUSH_CURATED_POOLS.easy || [];
    const availableEasy = easyPool.filter(t => !usedTitles.has(normalizeTitle(t)));
    if (availableEasy.length < RUSH_STAGES.length * 2) {
        usedTitles.clear();
    }

    const stages = RUSH_STAGES.map((stageConfig, index) => {
        const pool = RUSH_CURATED_POOLS[stageConfig.id] || [];
        const song = pickUniqueSong(soundtrack, pool, usedTitles, usedUrls, randomFn);
        const startTime = calculateRandomStartTime(song, stageConfig.duration, randomFn);

        return {
            id: stageConfig.id,
            label: stageConfig.label,
            duration: stageConfig.duration,
            points: stageConfig.points,
            color: stageConfig.color,
            hexColor: stageConfig.hexColor,
            target: song,
            startTime,
            status: index === 0 ? 'active' : 'pending',
            attempts: 0,
            guessedTitles: [],
            guesses: [],
            speedBonus: false,
            earnedPoints: 0
        };
    });

    return {
        stages,
        currentStageIndex: 0,
        lives: RUSH_LIVES,
        status: 'playing',
        totalScore: 0,
        completionBonus: 0,
        usedTitles: Array.from(usedTitles),
        usedUrls: Array.from(usedUrls),
        stageStartTime: Date.now()
    };
}

export function makeSongRushGuess(rushState, title, soundtrack, now = Date.now()) {
    if (!title || !title.trim()) throw new Error("Empty title");
    if (rushState.status !== 'playing') return { nextState: rushState, isCorrect: false };

    const formattedTitle = normalizeTitle(title);
    const currentStage = rushState.stages[rushState.currentStageIndex];
    if (!currentStage) throw new Error("Invalid stage");

    const guess = soundtrack.find(s => normalizeTitle(s.title) === formattedTitle);
    if (!guess) throw new Error("Non-existent song");
    if (currentStage.guessedTitles.includes(formattedTitle)) {
        throw new Error("Song already guessed!");
    }

    const isVictory = formattedTitle === normalizeTitle(currentStage.target.title);
    const comparison = compareSongs(currentStage.target, guess);

    if (isVictory) {
        const elapsedSeconds = (now - (rushState.stageStartTime || now)) / 1000;
        const isSpeedBonus = currentStage.attempts === 0 && elapsedSeconds < RUSH_POINTS.SPEED_THRESHOLD_SECONDS;
        const speedPoints = isSpeedBonus ? RUSH_POINTS.SPEED_BONUS_PER_STAGE : 0;
        const stagePoints = currentStage.points + speedPoints;

        const updatedStages = rushState.stages.map((stg, idx) => {
            if (idx === rushState.currentStageIndex) {
                return {
                    ...stg,
                    status: 'cleared',
                    speedBonus: isSpeedBonus,
                    earnedPoints: stagePoints,
                    guessedTitles: [...stg.guessedTitles, formattedTitle],
                    guesses: [comparison, ...(stg.guesses || [])]
                };
            }
            if (idx === rushState.currentStageIndex + 1) {
                return {
                    ...stg,
                    status: 'active',
                    guesses: []
                };
            }
            return stg;
        });

        const isLastStage = rushState.currentStageIndex === rushState.stages.length - 1;
        const nextScore = rushState.totalScore + stagePoints;

        let nextState;
        if (isLastStage) {
            const finalScore = nextScore + RUSH_POINTS.COMPLETION_BONUS;
            nextState = {
                ...rushState,
                stages: updatedStages,
                totalScore: finalScore,
                completionBonus: RUSH_POINTS.COMPLETION_BONUS,
                status: 'victory',
                endTime: now
            };
        } else {
            nextState = {
                ...rushState,
                stages: updatedStages,
                currentStageIndex: rushState.currentStageIndex + 1,
                totalScore: nextScore,
                stageStartTime: now
            };
        }

        return {
            nextState,
            isCorrect: true,
            isRushClear: isLastStage,
            pointsAwarded: stagePoints
        };
    } else {
        const updatedStages = rushState.stages.map((stg, idx) => {
            if (idx === rushState.currentStageIndex) {
                return {
                    ...stg,
                    attempts: stg.attempts + 1,
                    guessedTitles: [...stg.guessedTitles, formattedTitle],
                    guesses: [comparison, ...(stg.guesses || [])]
                };
            }
            return stg;
        });

        const nextState = {
            ...rushState,
            stages: updatedStages
        };

        return {
            nextState,
            isCorrect: false,
            outcome: comparison
        };
    }
}

export function skipSongRushStage(rushState, soundtrack, randomFn = Math.random) {
    if (rushState.status !== 'playing' || rushState.lives <= 0) {
        return rushState;
    }

    const currentStage = rushState.stages[rushState.currentStageIndex];
    if (!currentStage) return rushState;

    const usedTitlesSet = new Set((rushState.usedTitles || []).map(normalizeTitle));
    const usedUrlsSet = new Set((rushState.usedUrls || []).map(u => (u || '').trim()));

    // Ensure all songs from existing stages (active, past, upcoming) are marked as used
    rushState.stages.forEach(stg => {
        if (stg.target?.title) {
            usedTitlesSet.add(normalizeTitle(stg.target.title));
        }
        if (stg.target?.url) {
            usedUrlsSet.add(stg.target.url.trim());
        }
    });

    const pool = RUSH_CURATED_POOLS[currentStage.id] || [];
    const newSong = pickUniqueSong(soundtrack, pool, usedTitlesSet, usedUrlsSet, randomFn);
    const newStartTime = calculateRandomStartTime(newSong, currentStage.duration, randomFn);

    const updatedStages = rushState.stages.map((stg, idx) => {
        if (idx === rushState.currentStageIndex) {
            return {
                ...stg,
                target: newSong,
                startTime: newStartTime,
                attempts: 0,
                guessedTitles: [],
                guesses: []
            };
        }
        return stg;
    });

    const newLives = rushState.lives - 1;

    return {
        ...rushState,
        stages: updatedStages,
        lives: newLives,
        usedTitles: Array.from(usedTitlesSet),
        usedUrls: Array.from(usedUrlsSet),
        stageStartTime: Date.now()
    };
}
