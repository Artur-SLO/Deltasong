import { Grid, Stack, Text, Button, Modal, Paper, Group } from '@mantine/core';
import GridCell from './GridCell.jsx';
import { createGame, makeGuess } from '../../core/Game.js';
import { compareCharacters } from '../../core/Character.js';
import { COLUMNS_CONFIG } from '../../config/Constants.js';
import deltaruneCharacters from '../../assets/deltarune_characters.json' with { type: 'json' };
import { useEffect, useState } from 'react';
import SearchBar from './SearchBar.jsx';
import Guess from './Guess.jsx';
import homeClasses from '../../styles/Home.module.css';
import styles from '../../styles/Character.module.css';

const totalColumns = COLUMNS_CONFIG.reduce((sum, col) => sum + col.span, 0);

export default function GuessGrid() {
    const [gameState, setGameState] = useState(null);
    const [input, setInput] = useState('');
    const [guessedCharacters, setguessedCharacters] = useState([]);
    const [gridItems, setGridItems] = useState([]);
    const [isWon, setIsWon] = useState(false);
    const [isGivenUp, setIsGivenUp] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('victory');
    const [isConfirmingGiveUp, setIsConfirmingGiveUp] = useState(false);

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
        if (isWon || isGivenUp || !gameState) return;

        try {
            const result = makeGuess(gameState, characterToGuess);
            const outcome = result.outcome;

            if (outcome === "Victory") {
                const targetCharResult = compareCharacters(gameState.target, gameState.target);
                targetCharResult.isVictory = true;
                setGridItems((prevItems) => [targetCharResult, ...prevItems]);
                setIsWon(true);
                setModalType('victory');
                setIsModalOpen(true);
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

    const handleGiveUpClick = () => {
        if (isWon || isGivenUp || !gameState) return;
        if (isConfirmingGiveUp) {
            setIsGivenUp(true);
            setModalType('surrender');
            setIsModalOpen(true);
            setIsConfirmingGiveUp(false);
        } else {
            setIsConfirmingGiveUp(true);
        }
    };

    const resetGame = () => {
        setIsModalOpen(false);
        setIsConfirmingGiveUp(false);
        
        setTimeout(() => {
            const game = createGame(deltaruneCharacters);
            setGameState(game);
            setguessedCharacters([]);
            setGridItems([]);
            setIsWon(false);
            setIsGivenUp(false);
            setInput('');
        }, 200);
    };

    return (
        <Stack gap="md" align="center" w="100%">
            {!isWon && !isGivenUp && (
                <Button
                    color="red"
                    variant="outline"
                    size="xs"
                    onClick={handleGiveUpClick}
                    onBlur={() => setIsConfirmingGiveUp(false)}
                    className={`${homeClasses.conventionalFont} ${styles.giveUpButton}`}
                >
                    {isConfirmingGiveUp ? "Sure?" : "Give up"}
                </Button>
            )}

            {!isWon && !isGivenUp && (
                <SearchBar
                    data={characterOptions}
                    charactersMap={charactersMap}
                    input={input}
                    setInput={setInput}
                    handleGuess={handleGuess}
                />
            )}

            <Modal
                opened={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                centered
                size="md"
                styles={{
                    content: {
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: 'var(--size-2) solid var(--color-border-primary)',
                        color: 'var(--color-text-primary)',
                    },
                    header: {
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)',
                    },
                    title: {
                        fontFamily: 'var(--font-family-deltarune)',
                        fontSize: '1.5rem',
                        color: modalType === 'victory' ? '#00ff27' : '#ff1f8e',
                    }
                }}
            >
                <Stack align="center" gap="md" p="md">
                    <Text size="lg" ta="center">
                        {modalType === 'victory' 
                            ? "Congratulations! You guessed the character!" 
                            : "Too bad! The secret character was:"}
                    </Text>

                    {gameState?.target && (
                        <Paper
                            bg="var(--color-bg-primary)"
                            p="md"
                            radius="md"
                            withBorder
                            className={styles.targetCard}
                        >
                            {gameState.target.image && (
                                <img
                                    src={gameState.target.image}
                                    alt={gameState.target.name}
                                    className={styles.targetImage}
                                />
                            )}
                            <Text size="xl" fw="bold" ff="var(--font-family-deltarune)" ta="center">
                                {gameState.target.name}
                            </Text>
                        </Paper>
                    )}

                    <Button 
                        color="emeraldGreen" 
                        size="md" 
                        onClick={resetGame}
                        className={homeClasses.conventionalFont}
                        mt="md"
                    >
                        Play Again
                    </Button>
                </Stack>
            </Modal>

            <Grid columns={totalColumns} gutter="md" w="100%" align="center">
                {COLUMNS_CONFIG.map((col) => (
                    <Grid.Col key={col.label} span={col.span}>
                        <GridCell>
                            <Text size="sm" fw="bold" ff="var(--font-family-deltarune)">
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
