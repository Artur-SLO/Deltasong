import { Grid, Stack, Text, Button } from '@mantine/core';
import GridCell from './GridCell.jsx';
import { createGame, makeGuess } from '../../core/Game.js';
import { compareCharacters } from '../../core/Character.js';
import { COLUMNS_CONFIG } from '../../config/Constants.js';
import deltaruneCharacters from '../../assets/deltarune_characters.json' with { type: 'json' };
import { useEffect, useState } from 'react';
import SearchBar from './SearchBar.jsx';
import Guess from './Guess.jsx';

const totalColumns = COLUMNS_CONFIG.reduce((sum, col) => sum + col.span, 0);

export default function GuessGrid() {
    const [gameState, setGameState] = useState(null);
    const [input, setInput] = useState('');
    const [guessedCharacters, setguessedCharacters] = useState([]);
    const [gridItems, setGridItems] = useState([]);
    const [isWon, setIsWon] = useState(false);

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
        if (isWon || !gameState) return;

        try {
            const result = makeGuess(gameState, characterToGuess);
            const outcome = result.outcome;

            if (outcome === "Victory") {
                const targetCharResult = compareCharacters(gameState.target, gameState.target);
                targetCharResult.isVictory = true;
                setGridItems((prevItems) => [targetCharResult, ...prevItems]);
                setIsWon(true);
                setguessedCharacters(result.gameState.guessedNames);
            } else {
                setGridItems((prevItems) => [outcome, ...prevItems]);
                setGameState(result.gameState);
                setguessedCharacters(result.gameState.guessedNames);
            }
        } catch (err) {
            console.error(err);
        }
        setInput('');
    }

    const resetGame = () => {
        const game = createGame(deltaruneCharacters);
        setGameState(game);
        setguessedCharacters([]);
        setGridItems([]);
        setIsWon(false);
        setInput('');
    };

    return (
        <Stack gap="md" align="center" w="100%">
            {!isWon ? (
                <SearchBar
                    data={characterOptions}
                    charactersMap={charactersMap}
                    input={input}
                    setInput={setInput}
                    handleGuess={handleGuess}
                />
            ) : (
                <Stack align="center" gap="xs" style={{ marginBottom: '20px' }}>
                    <Text size="xl" fw="bold" c="emeraldGreen.4" ff="var(--font-family-deltarune)">
                        Victory! You guessed the character!
                    </Text>
                    <Button color="emeraldGreen" size="md" onClick={resetGame}>
                        Play Again
                    </Button>
                </Stack>
            )}

            <Grid columns={totalColumns} gutter="md" w="100%" align="center">
                {COLUMNS_CONFIG.map((col) => (
                    <Grid.Col key={col.label} span={col.span}>
                        <GridCell>
                            <Text size="sm" fw="bold">
                                {col.label}
                            </Text>
                        </GridCell>
                    </Grid.Col>
                ))}
            </Grid>

            {gridItems.map((char) => (
                <Guess key={char.name.value} character={char} widths={COLUMNS_CONFIG} totalColumns={totalColumns} />
            ))}
        </Stack>
    );
}
