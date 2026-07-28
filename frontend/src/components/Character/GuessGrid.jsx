import { Flex, Stack } from '@mantine/core';
import GridCell from './GridCell.jsx';
import { GUESS_HEADERS } from '../../config/Constants.js';
import { createGame, makeGuess } from '../../core/Game.js';
import deltaruneCharacters from '../../assets/deltarune_characters.json' with { type: 'json' };
import { useEffect, useState } from 'react';
import SearchBar from './SearchBar.jsx';

export default function GuessGrid() {
    const [gameState, setGameState] = useState(null);
    const [input, setInput] = useState('');
    const [guessedCharacters, setguessedCharacters] = useState([]);

    useEffect(() => {
        const game = createGame(deltaruneCharacters);
        setGameState(game);
    }, []);

    const characterOptions = deltaruneCharacters.map(c => c.name).filter(name => !guessedCharacters.includes(name));

    const charactersMap = Object.fromEntries(
        deltaruneCharacters.map(c => [c.name, c])
    );

    function handleGuess(e, selectedName) {
        if (e && e.preventDefault) e.preventDefault();
        const characterToGuess = selectedName || input;
        if (!characterToGuess || !characterToGuess.trim()) return;
        const result = makeGuess(gameState, characterToGuess);
        setGameState(result.gameState);
        setguessedCharacters(result.gameState.guessedNames);
        setInput('');
    }

    return (
        <Stack gap="md" align="center">
            <SearchBar
                data={characterOptions}
                charactersMap={charactersMap}
                input={input}
                setInput={setInput}
                handleGuess={handleGuess}
            />
            <Flex gap="md" justify="center" align="center" direction="row" wrap="nowrap" w="100%">
                {GUESS_HEADERS.map((text) => (
                    <GridCell key={text}>{text}</GridCell>
                ))}
            </Flex>
        </Stack>
    );
}
