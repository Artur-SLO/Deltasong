export function createItemGame(json, mode = "all", category = "") {
    let items = json;
    if (mode === "category" && category) {
        items = json.filter(item => item.type && item.type.toUpperCase() === category.toUpperCase());
    }
    const totalItems = items.length;
    if (totalItems === 0) {
        throw new Error("No items found for the selected category");
    }

    const formattedItems = items.map(item => {
        if (item.type === "Weapons" && item.weapon_type) {
            return {
                ...item,
                type: `Weapons (${item.weapon_type})`
            };
        }
        return { ...item };
    });

    const target = formattedItems[Math.floor(Math.random() * totalItems)];

    return {
        items: formattedItems,
        totalItems,
        target,
        guessedNames: []
    };
}

export function makeItemGuess(gameState, name) {
    if (!name) throw new Error("Empty name");

    const formattedName = name.toUpperCase().trim();

    const guess = gameState.items.find(item => item.name.toUpperCase() === formattedName);
    if (!guess) throw new Error("Non-existent item");
    if (gameState.guessedNames.includes(formattedName)) throw new Error("Item already guessed!");

    const nextGuessedNames = [...gameState.guessedNames, formattedName];
    const isCorrect = formattedName === gameState.target.name.toUpperCase();

    const nextGameState = {
        ...gameState,
        guessedNames: nextGuessedNames
    };

    return {
        gameState: nextGameState,
        outcome: isCorrect ? "Victory" : "Incorrect",
        guess
    };
}

export function getGuessedNames(gameState) {
    return gameState.guessedNames;
}
