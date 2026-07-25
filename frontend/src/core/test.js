import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import deltaruneCharacters from '../../../deltarune_characters.json' with { type: 'json' };
import Game from './Game.js';

const rl = createInterface({ input, output });
const game = new Game(deltaruneCharacters);
game.print();

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function formatHintInline(result) {
    const fields = ['gender', 'type', 'chapter', 'class', 'first_appearance', 'first_appearance_index'];

    const formattedFields = fields.map(field => {
        const item = result[field];
        let symbol;

        if (item.correct) {
            symbol = '✓';
            return `${GREEN}[${field.toUpperCase()}: ${item.value} ${symbol}]${RESET}`;
        } else {
            if (item.hint === 'higher') symbol = '↑';
                else if (item.hint === 'lower') symbol = '↓';
                    else symbol = '✗';

            return `${RED}[${field.toUpperCase()}: ${item.value} ${symbol}]${RESET}`;
        }
    });

    return formattedFields.join(' ');
}

while (true) {
    const name = await rl.question("\nNext Guess: ");

    try {
        const result = game.makeGuess(name);

        if (result === "Victory") {
            console.log(`\n${GREEN}${BOLD}Congratulations! You guessed the character!${RESET}`);
            break;
        } else {
            console.log(`\nWrong Answer: ${BOLD}${name.toUpperCase()}${RESET}`);
            console.log(`${BOLD}Hints:${RESET} ${formatHintInline(result)}`);
        }
    } catch (error) {
        console.warn(`${YELLOW}Warning: ${error.message}${RESET}`);
    }
}

rl.close();
