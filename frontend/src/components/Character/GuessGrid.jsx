import { Grid, Stack, Text, Button, Modal, Paper, Group } from '@mantine/core';
import GridCell from './GridCell.jsx';
import { createGame, makeGuess } from '../../core/characterGame.js';
import { compareCharacters } from '../../core/Character.js';
import { COLUMNS_CONFIG } from '../../config/Constants.js';
import deltaruneCharacters from '../../assets/deltarune_characters.json' with { type: 'json' };
import { useEffect, useState } from 'react';
import SearchBar from './SearchBar.jsx';
import Guess from './Guess.jsx';
import homeClasses from '../../styles/Home.module.css';
import styles from '../../styles/Character.module.css';
import { getCharacterImage } from '../../utils/image.js';
import berdlyGif from '../../assets/berdly.gif';

const totalColumns = COLUMNS_CONFIG.reduce((sum, col) => sum + col.span, 0);


export default function GuessGrid({
    isDaily = false,
    dailyGameState = null,
    dailyGuesses = [],
    onDailyGuess = null
}) {
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
        if (isDaily) return;
        const game = createGame(deltaruneCharacters);
        setGameState(game);
    }, [isDaily]);

    useEffect(() => {
        if (isDaily || !isModalOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                resetGame();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen, isDaily]);

    const activeGameState = isDaily ? dailyGameState : gameState;
    const activeGuesses = isDaily ? dailyGuesses : gridItems;
    const activeGuessedNames = isDaily ? (dailyGameState?.guessedNames || []) : guessedCharacters;

    const characterOptions = deltaruneCharacters
        .map(c => c.name)
        .filter(name => !activeGuessedNames.some(g => g.toUpperCase() === name.toUpperCase()));

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
                setguessedCharacters(result.gameState.guessedNames);
                // Delay showing victory modal until all cells fade in (7 * 0.45s = 3.15s)
                setTimeout(() => {
                    setModalType('victory');
                    setIsModalOpen(true);
                }, 3200);
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

    const showSearchBar = isDaily || (!isWon && !isGivenUp);

    return (
        <Stack gap="md" align="center" w="100%">
            {!isDaily && !isWon && !isGivenUp && (
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

            {showSearchBar && (
                <SearchBar
                    data={characterOptions}
                    charactersMap={charactersMap}
                    input={input}
                    setInput={setInput}
                    handleGuess={isDaily ? (e, selectedName) => {
                        if (e && e.preventDefault) e.preventDefault();
                        const val = selectedName || input;
                        if (val && val.trim()) {
                            onDailyGuess(val);
                            setInput('');
                        }
                    } : handleGuess}
                />
            )}

            {!isDaily && (
                <Modal
                    opened={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    centered
                    size="md"
                    title={modalType === 'victory' ? 'Victory!' : 'Game Over'}
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
                        <img
                            src={berdlyGif}
                            alt="Berdly Mascot"
                            className={styles.mascotGif}
                        />
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
                                        src={getCharacterImage(gameState.target.image)}
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
            )}

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

            {activeGuesses.map((char) => (
                <Guess key={char.name.value} character={char} widths={COLUMNS_CONFIG} totalColumns={totalColumns} />
            ))}
        </Stack>
    );
}
