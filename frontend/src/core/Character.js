export function formatCharacter(character) {
    return {
        "name": character.name,
        "gender": character.gender,
        "type": character.type,
        "chapter": character.chapter,
        "class": character.class,
        "first_appearance": character.first_appearance,
        "first_appearance_index": character.first_appearance_index,
        "image": character.image,
    };
}

export function compareCharacters(target, guessed) {
    return {
        name: {
            value: guessed.name,
            correct: guessed.name === target.name
        },
        gender: {
            value: guessed.gender,
            correct: guessed.gender === target.gender
        },
        type: {
            value: guessed.type,
            correct: guessed.type === target.type
        },
        chapter: {
            value: guessed.chapter,
            correct: guessed.chapter === target.chapter,
            hint: guessed.chapter === target.chapter ? "equal" : (guessed.chapter < target.chapter ? "higher" : "lower")
        },
        class: {
            value: guessed.class,
            correct: guessed.class === target.class
        },
        first_appearance: {
            value: guessed.first_appearance,
            correct: guessed.first_appearance === target.first_appearance
        },
        first_appearance_index: {
            value: guessed.first_appearance_index,
            correct: guessed.first_appearance_index === target.first_appearance_index,
            hint: guessed.first_appearance_index === target.first_appearance_index ? "equal" : (guessed.first_appearance_index < target.first_appearance_index ? "higher" : "lower")
        },
        image: guessed.image
    };
}
