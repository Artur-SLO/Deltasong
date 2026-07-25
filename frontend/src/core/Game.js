import Character from './Character.js';

export default class Game {
    constructor(json) {
        this.characters = json.map(character => new Character(character));
        this.totalCharacters = this.characters.length;
        this.target = this.characters[Math.floor(Math.random() * this.totalCharacters)];
        this.guessedNames = new Set();
    }

    makeGuess(name) {
        if (!name) throw new Error("Empty name");

        name = name.toUpperCase().trim();

        const guess = this.characters.find(c => c.getName() === name);
        if (!guess) throw new Error("Non-existent character");

        if (this.guessedNames.has(name)) {
            throw new Error("Character already guessed!");
        }
        this.guessedNames.add(name);

        const result = this.target.compareTo(guess);
        const victory = this.#checkResult(result);
        return victory ? "Victory" : result;
    }

    #checkResult(result) {
        const keys = Object.keys(result).filter(k => k !== 'image');
        return keys.every(key => result[key].correct === true);
    }

    getGuessedNames() {
        return Array.from(this.guessedNames);
    }

    print() {
        console.log("Target: " + this.target.getName());
        console.log("Total: " + this.totalCharacters);
    }
}
