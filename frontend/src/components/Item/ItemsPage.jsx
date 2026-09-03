import { useEffect, useState, useCallback, useContext } from 'react';
import { Container, Title, Paper, Button } from '@mantine/core';
import { 
    IconPackage, 
    IconFlask, 
    IconSword, 
    IconShield, 
    IconKey, 
    IconSun 
} from '@tabler/icons-react';
import classes from '../../styles/Item.module.css';
import homeClasses from '../../styles/Home.module.css';
import deltaruneItems from '../../assets/data/deltarune_items.json';
import { createItemGame, makeItemGuess } from '../../core/itemGame.js';
import ItemSearchBar from './ItemSearchBar.jsx';
import HintProgress from './HintProgress.jsx';
import GuessHistory from './GuessHistory.jsx';
import ItemModal from './ItemModal.jsx';
import { addPoints } from '../../core/rankSystem.js';
import { RANK_POINTS, DAILY_LIMITS } from '../../config/Constants.js';
import { HelpWidgetContext } from '../../utils/HelpWidgetContext.js';

const ITEM_MODES = [
    { key: 'all', label: 'All Items', icon: <IconPackage size={14} />, mode: 'all', category: '' },
    { key: 'Consumables', label: 'Consumables', icon: <IconFlask size={14} />, mode: 'category', category: 'Consumables' },
    { key: 'Weapons', label: 'Weapons', icon: <IconSword size={14} />, mode: 'category', category: 'Weapons' },
    { key: 'Armor', label: 'Armor', icon: <IconShield size={14} />, mode: 'category', category: 'Armor' },
    { key: 'Key Items', label: 'Key Items', icon: <IconKey size={14} />, mode: 'category', category: 'Key Items' },
    { key: 'Light World', label: 'Light World', icon: <IconSun size={14} />, mode: 'category', category: 'Light World' }
];

export default function ItemsPage({
    isDaily = false,
    dailyGameState = null,
    dailyGuesses = [],
    onDailyGuess = null
}) {
    const [mode, setMode] = useState('all');
    const [category, setCategory] = useState('');
    const [activeTabKey, setActiveTabKey] = useState('all');
    const [gameState, setGameState] = useState(() => (isDaily ? null : createItemGame(deltaruneItems, 'all', '')));
    const [guesses, setGuesses] = useState([]);
    const [input, setInput] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('victory');
    const [modalTarget, setModalTarget] = useState(null);
    const [isConfirmingGiveUp, setIsConfirmingGiveUp] = useState(false);
    const [startTime, setStartTime] = useState(() => Date.now());

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

    const startNewGame = useCallback((newMode, newCategory) => {
        setIsModalOpen(false);
        setIsConfirmingGiveUp(false);
        setInput('');
        setGuesses([]);
        setStartTime(Date.now());
        const newGame = createItemGame(deltaruneItems, newMode, newCategory);
        setGameState(newGame);
        setModalTarget(null);
    }, []);

    const handleModeTabSelect = (tab) => {
        if (tab.key === activeTabKey) return;
        setActiveTabKey(tab.key);
        setMode(tab.mode);
        setCategory(tab.category);
        startNewGame(tab.mode, tab.category);
    };

    const playAgainSameFilter = useCallback(() => {
        if (isDaily) return;
        startNewGame(mode, category);
    }, [mode, category, isDaily, startNewGame]);

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

            setGuesses(prev => [newGuess, ...prev]);

            if (isCorrect) {
                if (!isDaily) {
                    const attempts = nextGameState.guessedNames.length;
                    let points = 0;
                    if (attempts <= RANK_POINTS.ATTEMPTS_THRESHOLD_FAST) points = RANK_POINTS.VICTORY_FAST_ATTEMPTS;
                    else if (attempts <= RANK_POINTS.ATTEMPTS_THRESHOLD_MEDIUM) points = RANK_POINTS.VICTORY_MEDIUM_ATTEMPTS;
                    else points = RANK_POINTS.VICTORY_SLOW_ATTEMPTS;

                    const duration = (Date.now() - startTime) / 1000;
                    if (duration < RANK_POINTS.SPEED_THRESHOLD_SECONDS) {
                        points += RANK_POINTS.SPEED_BONUS;
                    }

                    addPoints(points, 'items');
                }

                setModalTarget(gameState.target);
                setTimeout(() => {
                    setModalType('victory');
                    setIsModalOpen(true);
                }, 1400);
            }
        } catch (err) {
            console.error(err);
        }

        setInput('');
    };

    const handleGiveUpClick = () => {
        if (!gameState || (guesses.length > 0 && guesses[0].isCorrect)) return;

        if (isConfirmingGiveUp) {
            setModalType('surrender');
            setModalTarget(gameState.target);
            setIsModalOpen(true);
            setIsConfirmingGiveUp(false);
        } else {
            setIsConfirmingGiveUp(true);
        }
    };

    const activeGameState = isDaily ? dailyGameState : gameState;
    const activeGuesses = isDaily ? dailyGuesses : guesses;
    const isDailyWon = isDaily && activeGuesses?.some(g => g.isCorrect);
    const isDailyLost = isDaily && activeGuesses?.length >= (DAILY_LIMITS?.items || 10);
    const activeIsGameOver = isDaily ? (isDailyWon || isDailyLost) : (isModalOpen || (guesses.length > 0 && guesses[0].isCorrect));

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
            {/* Dynamic Mode Selector (matching Song mode transparent pill style) */}
            {!isDaily && (
                <div className={classes.modeSwitcherContainer}>
                    {ITEM_MODES.map((tab) => {
                        const isActive = activeTabKey === tab.key;
                        return (
                            <Button
                                key={tab.key}
                                size="xs"
                                variant={isActive ? 'filled' : 'subtle'}
                                color="royalMagenta"
                                className={`${classes.modePillButton} ${isActive ? classes.modeButtonActive : ''}`}
                                onClick={() => handleModeTabSelect(tab)}
                                leftSection={tab.icon}
                            >
                                {tab.label}
                            </Button>
                        );
                    })}
                </div>
            )}

            {/* Give Up Button */}
            {!isDaily && activeGameState && !activeIsGameOver && (
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

            {/* Item Search Bar */}
            {activeGameState && !activeIsGameOver && (
                <ItemSearchBar
                    data={itemOptions}
                    input={input}
                    setInput={setInput}
                    handleGuess={handleGuessAction}
                />
            )}

            {/* Enhanced Hint Progress Dashboard */}
            {activeGameState && (
                <HintProgress
                    target={activeGameState.target}
                    incorrectGuessesCount={activeIncorrectGuessesCount}
                />
            )}

            {/* Guess History */}
            <GuessHistory guesses={activeGuesses.slice(0, 15)} />

            {/* CRT Result Modal */}
            {!isDaily && (modalTarget || activeGameState) && (
                <ItemModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    modalType={modalType}
                    target={modalTarget || activeGameState.target}
                    onPlayAgain={playAgainSameFilter}
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
