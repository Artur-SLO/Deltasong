export default class Character {
    constructor(data) {
        this.name = data.name;
        this.gender = data.gender;
        this.type = data.type;
        this.chapter = data.chapter;
        this.className = data.class;
        this.first_appearance = data.first_appearance;
        this.first_appearance_index = data.first_appearance_index;
        this.image = data.image;
        this.url = data.url;
    }

    print() {
        return {
            "name": this.name,
            "gender": this.gender,
            "type": this.type,
            "chapter": this.chapter,
            "class": this.className,
            "first_appearance": this.first_appearance,
            "first_appearance_index": this.first_appearance_index,
            "image": this.image,
        }
    }

    compareTo(guessedCharacter) {
        return {
            name: {
                value: guessedCharacter.name,
                correct: guessedCharacter.name === this.name
            },
            gender: {
                value: guessedCharacter.gender,
                correct: guessedCharacter.gender === this.gender
            },
            type: {
                value: guessedCharacter.type,
                correct: guessedCharacter.type === this.type
            },
            chapter: {
                value: guessedCharacter.chapter,
                correct: guessedCharacter.chapter === this.chapter,
                hint: guessedCharacter.chapter === this.chapter ? "equal" : (guessedCharacter.chapter < this.chapter ? "higher" : "lower")
            },
            class: {
                value: guessedCharacter.className,
                correct: guessedCharacter.className === this.className
            },
            first_appearance: {
                value: guessedCharacter.first_appearance,
                correct: guessedCharacter.first_appearance === this.first_appearance
            },
            first_appearance_index: {
                value: guessedCharacter.first_appearance_index,
                correct: guessedCharacter.first_appearance_index === this.first_appearance_index,
                hint: guessedCharacter.first_appearance_index === this.first_appearance_index ? "equal" : (guessedCharacter.first_appearance_index < this.first_appearance_index ? "higher" : "lower")
            },
            image: guessedCharacter.image
        };
    }

    getName() {
        return this.name;
    }
}
