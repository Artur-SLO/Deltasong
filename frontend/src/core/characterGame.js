import { compareCharacters } from './Character.js';

export function createGame(json) {
    const characters = json;
    const totalCharacters = characters.length;
    const target = characters[Math.floor(Math.random() * totalCharacters)];

    return {
        characters,
        totalCharacters,
        target,
        guessedNames: []
    };
}

export function makeGuess(gameState, name) {
    if (!name) throw new Error("Empty name");

    const formattedName = name.toUpperCase().trim();

    const guess = gameState.characters.find(c => c.name.toUpperCase() === formattedName);
    if (!guess) throw new Error("Non-existent character");
    if (gameState.guessedNames.includes(formattedName)) throw new Error("Character already guessed!");

    const nextGuessedNames = [...gameState.guessedNames, formattedName];

    const result = compareCharacters(gameState.target, guess);
    const victory = checkResult(result);

    const nextGameState = {
        ...gameState,
        guessedNames: nextGuessedNames
    };

    return {
        gameState: nextGameState,
        outcome: victory ? "Victory" : result
    };
}

function checkResult(result) {
    const keys = Object.keys(result).filter(k => k !== 'image');
    return keys.every(key => result[key].correct === true);
}

export function getGuessedNames(gameState) {
    return gameState.guessedNames;
}
