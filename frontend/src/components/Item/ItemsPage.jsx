import { useEffect, useState, useCallback } from 'react';
import { Container, Title, Paper, Button } from '@mantine/core';
import classes from '../../styles/Item.module.css';
import homeClasses from '../../styles/Home.module.css';
import deltaruneItems from '../../assets/deltarune_items.json' with { type: 'json' };
import { createItemGame, makeItemGuess } from '../../core/itemGame.js';
import ItemModeSelector from './ItemModeSelector.jsx';
import ItemSearchBar from './ItemSearchBar.jsx';
import HintProgress from './HintProgress.jsx';
import GuessHistory from './GuessHistory.jsx';
import ItemModal from './ItemModal.jsx';

export default function ItemsPage() {
    const [mode, setMode] = useState('all');
    const [category, setCategory] = useState('');
    const [gameState, setGameState] = useState(null);
    const [guesses, setGuesses] = useState([]); // Array of { item, isCorrect }
    const [input, setInput] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('victory'); // 'victory' or 'surrender'
    const [isConfirmingGiveUp, setIsConfirmingGiveUp] = useState(false);
    const [isFilterSelected, setIsFilterSelected] = useState(false);

    const resetGame = useCallback(() => {
        setIsModalOpen(false);
        setIsConfirmingGiveUp(false);
        setInput('');
        setGameState(null);
        setGuesses([]);
        setIsFilterSelected(false);
    }, []);

    const playAgainSameFilter = useCallback(() => {
        setIsModalOpen(false);
        setIsConfirmingGiveUp(false);
        setInput('');
        
        const game = createItemGame(deltaruneItems, mode, category);
        setGameState(game);
        setGuesses([]);
    }, [mode, category]);

    // Initialize in unselected state
    useEffect(() => {
        resetGame();
    }, [resetGame]);

    const handleSelectFilter = (selectedMode, selectedCategory) => {
        setMode(selectedMode);
        setCategory(selectedCategory);
        
        const game = createItemGame(deltaruneItems, selectedMode, selectedCategory);
        setGameState(game);
        setGuesses([]);
        setIsFilterSelected(true);
    };

    const handleGuess = (e, selectedName) => {
        if (e && e.preventDefault) e.preventDefault();
        const itemToGuess = selectedName || input;
        if (!itemToGuess || !itemToGuess.trim()) return;
        if (!gameState || gameState.guessedNames.includes(itemToGuess.toUpperCase().trim())) return;

        try {
            const result = makeItemGuess(gameState, itemToGuess);
            const { gameState: nextGameState, outcome, guess } = result;

            setGameState(nextGameState);

            const isCorrect = outcome === "Victory";
            const newGuess = { item: guess, isCorrect };

            // Add the new guess to history (prepend like songs/characters)
            setGuesses(prev => [newGuess, ...prev]);

            if (isCorrect) {
                setModalType('victory');
                setIsModalOpen(true);
            }
            else if (nextGameState.guessedNames.length >= 5) {
                setModalType('surrender');
                setIsModalOpen(true);
            }
        } catch (err) {
            console.error(err);
        }
        setInput('');
    };

    const handleGiveUpClick = () => {
        if (!gameState) return;
        if (isConfirmingGiveUp) {
            setModalType('surrender');
            setIsModalOpen(true);
            setIsConfirmingGiveUp(false);
        } else {
            setIsConfirmingGiveUp(true);
        }
    };

    const isGameOver = isModalOpen || (guesses.length > 0 && guesses[0].isCorrect) || (gameState && gameState.guessedNames.length >= 5);

    // Filter autocomplete search options
    const itemOptions = gameState
        ? gameState.items.filter(item => !gameState.guessedNames.includes(item.name.toUpperCase()))
        : [];

    const incorrectGuessesCount = guesses.filter(g => !g.isCorrect).length;

    return (
        <Container size="md" className={`${homeClasses.gameContainer} ${classes.container || ''}`}>
            <Paper
                shadow="md"
                p="xl"
                radius="md"
                withBorder
                className={`${homeClasses.gamePaper} ${classes.paper || ''}`}
            >
                <Title order={2} ta="center" mb="lg" c="royalMagenta.5" className={homeClasses.conventionalTitle}>
                    Items Mode
                </Title>

                {isFilterSelected && gameState && !isGameOver && (
                    <Button
                        color="red"
                        variant="outline"
                        size="xs"
                        onClick={handleGiveUpClick}
                        onBlur={() => setIsConfirmingGiveUp(false)}
                        className={`${homeClasses.conventionalFont} ${classes.giveUpButton}`}
                    >
                        {isConfirmingGiveUp ? "Sure?" : "Give up"}
                    </Button>
                )}

                {!isFilterSelected && (
                    <ItemModeSelector onSelect={handleSelectFilter} />
                )}

                {isFilterSelected && gameState && !isGameOver && (
                    <ItemSearchBar
                        data={itemOptions}
                        input={input}
                        setInput={setInput}
                        handleGuess={handleGuess}
                    />
                )}

                {isFilterSelected && gameState && (
                    <HintProgress
                        target={gameState.target}
                        incorrectGuessesCount={incorrectGuessesCount}
                    />
                )}

                {isFilterSelected && (
                    <GuessHistory guesses={guesses} />
                )}

                {isFilterSelected && gameState && (
                    <ItemModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        modalType={modalType}
                        target={gameState.target}
                        onPlayAgain={playAgainSameFilter}
                        onChangeFilter={resetGame}
                    />
                )}
            </Paper>
        </Container>
    );
}
