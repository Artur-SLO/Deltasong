import Character from './Character.js';

export default class Game {
    constructor(json) {
        this.characters = [];
        json.forEach(character => {
            this.characters.push(new Character(character));
        });

        this.totalCharacters = this.characters.length;
        this.target = this.characters[Math.floor(Math.random() * this.totalCharacters)];
    }

    makeGuess(name) {
        if (!name) throw new Error("Empty name");

        name = name.toUpperCase();
        const guess = this.characters.find(c => c.getName() === name);

        if (!guess) throw new Error("Non-existent character");

        const result = this.target.compareTo(guess);
        const victory = this.#checkResult(result);

        return victory ? "Victory" : result;
    }

    #checkResult(result) {
        const keys = Object.keys(result).filter(k => k !== 'image');
        return keys.every(key => result[key].correct === true);
    }

    print() {
        console.log("Target: " + this.target.getName());
        console.log("Total: " + this.totalCharacters);
    }
}
