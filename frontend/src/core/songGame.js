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

export function createSongGame(json, randomFn = Math.random) {
    const songs = json;
    const totalSongs = songs.length;
    const target = songs[Math.floor(randomFn() * totalSongs)];

    // Choose a random starting position for the audio segment (max limit is 5s)
    const maxDurationLimit = 5.0;
    let startTime = 0;
    if (target.duration_seconds > maxDurationLimit) {
        startTime = Math.floor(randomFn() * (target.duration_seconds - maxDurationLimit));
    }

    return {
        songs,
        totalSongs,
        target,
        startTime,
        guessedTitles: []
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
