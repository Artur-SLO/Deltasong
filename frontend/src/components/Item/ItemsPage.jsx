import { useEffect, useState, useCallback, useContext } from 'react';
import { Container, Title, Paper, Button } from '@mantine/core';
import classes from '../../styles/Item.module.css';
import homeClasses from '../../styles/Home.module.css';
import deltaruneItems from '../../assets/data/deltarune_items.json';
import { createItemGame, makeItemGuess } from '../../core/itemGame.js';
import ItemModeSelector from './ItemModeSelector.jsx';
import ItemSearchBar from './ItemSearchBar.jsx';
import HintProgress from './HintProgress.jsx';
import GuessHistory from './GuessHistory.jsx';
import ItemModal from './ItemModal.jsx';
import { addPoints } from '../../core/rankSystem.js';
import { RANK_POINTS } from '../../config/Constants.js';
import { HelpWidgetContext } from '../../utils/HelpWidgetContext.js';

export default function ItemsPage({
    isDaily = false,
    dailyGameState = null,
    dailyGuesses = [],
    onDailyGuess = null
}) {
    const [mode, setMode] = useState('all');
    const [category, setCategory] = useState('');
    const [gameState, setGameState] = useState(null);
    const [guesses, setGuesses] = useState([]);
    const [input, setInput] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('victory');
    const [isConfirmingGiveUp, setIsConfirmingGiveUp] = useState(false);
    const [isFilterSelected, setIsFilterSelected] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());

    const { setIsHelpWidgetHidden } = useContext(HelpWidgetContext);

    useEffect(() => {
        if (isDaily) return;
        if (setIsHelpWidgetHidden) {
            setIsHelpWidgetHidden(isModalOpen);
        }
        return () => {
            if (setIsHelpWidgetHidden) {
                setIsHelpWidgetHidden(false);
            }
        };
    }, [isModalOpen, isDaily, setIsHelpWidgetHidden]);

    const resetGame = useCallback(() => {
        if (isDaily) return;
        setIsModalOpen(false);
        setIsConfirmingGiveUp(false);
        setInput('');
        setGameState(null);
        setGuesses([]);
        setIsFilterSelected(false);
        setStartTime(Date.now());
    }, [isDaily]);

    const playAgainSameFilter = useCallback(() => {
        if (isDaily) return;
        setIsModalOpen(false);
        setIsConfirmingGiveUp(false);
        setInput('');

        const game = createItemGame(deltaruneItems, mode, category);
        setGameState(game);
        setGuesses([]);
        setStartTime(Date.now());
    }, [mode, category, isDaily]);

    // Initialize in unselected state
    useEffect(() => {
        if (!isDaily) {
            resetGame();
        }
    }, [resetGame, isDaily]);

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
                if (!isDaily) {
                    const attempts = nextGameState.guessedNames.length;
                    let points = 0;
                    if (attempts <= 3) points = RANK_POINTS.VICTORY_FAST_ATTEMPTS;
                    else if (attempts <= 6) points = RANK_POINTS.VICTORY_MEDIUM_ATTEMPTS;
                    else points = RANK_POINTS.VICTORY_SLOW_ATTEMPTS;

                    const duration = (Date.now() - startTime) / 1000;
                    if (duration < RANK_POINTS.SPEED_THRESHOLD_SECONDS) {
                        points += RANK_POINTS.SPEED_BONUS;
                    }
                    addPoints(points, 'items');
                }
                setModalType('victory');
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

    const activeFilterSelected = isDaily ? true : isFilterSelected;
    const activeGameState = isDaily ? dailyGameState : gameState;
    const activeGuesses = isDaily ? dailyGuesses : guesses;
    const activeIsGameOver = isDaily ? false : (isModalOpen || (guesses.length > 0 && guesses[0].isCorrect));

    // Filter autocomplete search options
    const itemOptions = activeGameState
        ? activeGameState.items.filter(item => !activeGameState.guessedNames.includes(item.name.toUpperCase().trim()))
        : [];

    const activeIncorrectGuessesCount = isDaily
        ? activeGuesses.filter(g => !g.isCorrect).length
        : guesses.filter(g => !g.isCorrect).length;

    const handleGuessAction = (e, selectedName) => {
        if (isDaily) {
            if (e && e.preventDefault) e.preventDefault();
            const itemToGuess = selectedName || input;
            if (!itemToGuess || !itemToGuess.trim()) return;
            onDailyGuess(itemToGuess);
            setInput('');
        } else {
            handleGuess(e, selectedName);
        }
    };

    const gameContent = (
        <>
            {!isDaily && activeFilterSelected && activeGameState && !activeIsGameOver && (
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

            {!activeFilterSelected && (
                <ItemModeSelector onSelect={handleSelectFilter} />
            )}

            {activeFilterSelected && activeGameState && !activeIsGameOver && (
                <ItemSearchBar
                    data={itemOptions}
                    input={input}
                    setInput={setInput}
                    handleGuess={handleGuessAction}
                />
            )}

            {activeFilterSelected && activeGameState && (
                <HintProgress
                    target={activeGameState.target}
                    incorrectGuessesCount={activeIncorrectGuessesCount}
                />
            )}

            {activeFilterSelected && (
                <GuessHistory guesses={activeGuesses.slice(0, 15)} />
            )}

            {!isDaily && activeFilterSelected && activeGameState && (
                <ItemModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    modalType={modalType}
                    target={activeGameState.target}
                    onPlayAgain={playAgainSameFilter}
                    onChangeFilter={resetGame}
                />
            )}
        </>
    );

    if (isDaily) {
        return gameContent;
    }

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
                {gameContent}
            </Paper>
        </Container>
    );
}
