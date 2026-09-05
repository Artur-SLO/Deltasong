export function compareSongs(target, guessed) {
    return {
        title: {
            value: guessed.title,
            correct: guessed.title.toUpperCase() === target.title.toUpperCase()
        },
        chapter: {
            value: guessed.chapter,
            correct: guessed.chapter === target.chapter,
            hint: guessed.chapter === target.chapter ? "equal" : (guessed.chapter < target.chapter ? "higher" : "lower")
        },
        duration: {
            value: guessed.duration_formatted,
            seconds: guessed.duration_seconds,
            correct: guessed.duration_seconds === target.duration_seconds,
            hint: guessed.duration_seconds === target.duration_seconds ? "equal" : (guessed.duration_seconds < target.duration_seconds ? "higher" : "lower")
        }
    };
}

/**
 * Calculates a safe random start time for an audio snippet.
 * Excludes the ending of the song to avoid trailing silence and fade-outs.
 */
export function calculateRandomStartTime(target, durationLimit = 5.0, randomFn = Math.random) {
    if (!target || !target.duration_seconds || target.duration_seconds <= durationLimit) {
        return 0;
    }

    const totalDuration = target.duration_seconds;

    // Safety margin to exclude the ending fade-out / trailing silence of the track.
    // OST videos generally have a 5-10s fade-out or silence buffer near the end.
    // We reserve at least 15% (or 6 seconds minimum) of the track.
    const endMargin = Math.max(6, totalDuration * 0.15);
    const maxStartTime = totalDuration - endMargin - durationLimit;

    // Fallback if the song is too short to accommodate the safety margin
    if (maxStartTime <= 0) {
        const fallbackMax = totalDuration - durationLimit;
        return fallbackMax > 0 ? Math.floor(randomFn() * fallbackMax) : 0;
    }

    return Math.floor(randomFn() * maxStartTime);
}

export function createSongGame(json, randomFn = Math.random) {
    const songs = json;
    const totalSongs = songs.length;
    const target = songs[Math.floor(randomFn() * totalSongs)];

    // Choose a safe random starting position for the audio segment, avoiding trailing silence
    const maxDurationLimit = 5.0;
    const startTime = calculateRandomStartTime(target, maxDurationLimit, randomFn);

    return {
        songs,
        totalSongs,
        target,
        startTime,
        guessedTitles: [],
        hintsUsed: 0
    };
}

export function makeSongGuess(gameState, title) {
    if (!title) throw new Error("Empty title");

    const formattedTitle = title.toUpperCase().trim();

    const guess = gameState.songs.find(s => s.title.toUpperCase() === formattedTitle);
    if (!guess) throw new Error("Non-existent song");
    if (gameState.guessedTitles.includes(formattedTitle)) throw new Error("Song already guessed!");

    const nextGuessedTitles = [...gameState.guessedTitles, formattedTitle];

    const result = compareSongs(gameState.target, guess);
    const victory = result.title.correct;

    const nextGameState = {
        ...gameState,
        guessedTitles: nextGuessedTitles
    };

    return {
        gameState: nextGameState,
        outcome: victory ? "Victory" : result
    };
}

export function getGuessedTitles(gameState) {
    return gameState.guessedTitles;
}
