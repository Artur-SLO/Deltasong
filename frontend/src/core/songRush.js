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

function pickUniqueSong(soundtrack, poolTitles, usedTitles, randomFn = Math.random) {
    const soundtrackMap = new Map(soundtrack.map(s => [s.title.toUpperCase(), s]));
    const availablePool = poolTitles.filter(t => {
        const upper = t.toUpperCase();
        return soundtrackMap.has(upper) && !usedTitles.has(upper);
    });

    let chosenTitle = null;
    if (availablePool.length > 0) {
        chosenTitle = availablePool[Math.floor(randomFn() * availablePool.length)];
    } else {
        // Fallback to any unused song from entire soundtrack
        const availableAll = soundtrack.filter(s => !usedTitles.has(s.title.toUpperCase()));
        if (availableAll.length > 0) {
            chosenTitle = availableAll[Math.floor(randomFn() * availableAll.length)].title;
        } else {
            chosenTitle = soundtrack[Math.floor(randomFn() * soundtrack.length)].title;
        }
    }

    const song = soundtrackMap.get(chosenTitle.toUpperCase());
    usedTitles.add(song.title.toUpperCase());
    return song;
}

export function calculateRandomStartTime(target, durationLimit = 5.0, randomFn = Math.random) {
    if (!target || !target.duration_seconds || target.duration_seconds <= durationLimit) {
        return 0;
    }
    return Math.floor(randomFn() * (target.duration_seconds - durationLimit));
}

export function createSongRushGame(soundtrack, randomFn = Math.random) {
    const usedTitles = new Set();
    const stages = RUSH_STAGES.map((stageConfig, index) => {
        const pool = RUSH_CURATED_POOLS[stageConfig.id] || [];
        const song = pickUniqueSong(soundtrack, pool, usedTitles, randomFn);
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
        stageStartTime: Date.now()
    };
}

export function makeSongRushGuess(rushState, title, soundtrack, now = Date.now()) {
    if (!title || !title.trim()) throw new Error("Empty title");
    if (rushState.status !== 'playing') return { nextState: rushState, isCorrect: false };

    const formattedTitle = title.toUpperCase().trim();
    const currentStage = rushState.stages[rushState.currentStageIndex];
    if (!currentStage) throw new Error("Invalid stage");

    const guess = soundtrack.find(s => s.title.toUpperCase() === formattedTitle);
    if (!guess) throw new Error("Non-existent song");
    if (currentStage.guessedTitles.includes(formattedTitle)) {
        throw new Error("Song already guessed!");
    }

    const isVictory = formattedTitle === currentStage.target.title.toUpperCase();

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
                    guessedTitles: [...stg.guessedTitles, formattedTitle]
                };
            }
            if (idx === rushState.currentStageIndex + 1) {
                return {
                    ...stg,
                    status: 'active'
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
        const comparison = compareSongs(currentStage.target, guess);
        const updatedStages = rushState.stages.map((stg, idx) => {
            if (idx === rushState.currentStageIndex) {
                return {
                    ...stg,
                    attempts: stg.attempts + 1,
                    guessedTitles: [...stg.guessedTitles, formattedTitle]
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

    const usedTitlesSet = new Set(rushState.usedTitles);
    const pool = RUSH_CURATED_POOLS[currentStage.id] || [];
    const newSong = pickUniqueSong(soundtrack, pool, usedTitlesSet, randomFn);
    const newStartTime = calculateRandomStartTime(newSong, currentStage.duration, randomFn);

    const updatedStages = rushState.stages.map((stg, idx) => {
        if (idx === rushState.currentStageIndex) {
            return {
                ...stg,
                target: newSong,
                startTime: newStartTime,
                attempts: 0,
                guessedTitles: []
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
        stageStartTime: Date.now()
    };
}
