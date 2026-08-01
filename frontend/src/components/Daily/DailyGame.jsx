import { useEffect, useState, useRef, useContext } from 'react';
import { Container, Paper, Title, Stack, Button, Text, Box, Group } from '@mantine/core';

import homeClasses from '../../styles/Home.module.css';
import classes from '../../styles/Daily.module.css';

// JSON data
import deltaruneCharacters from '../../assets/data/deltarune_characters.json';
import deltaruneItems from '../../assets/data/deltarune_items.json';
import deltaruneSoundtrack from '../../assets/data/deltarune_soundtrack.json';
import lancerGif from '../../assets/images/lancer.gif';
import { addPoints, getRankData } from '../../core/rankSystem.js';
import { RANK_POINTS, DAILY_LIMITS } from '../../config/Constants.js';
import { HelpWidgetContext } from '../../utils/HelpWidgetContext.js';


// Core engines & utilities
import {
    loadOrCreateDailyGame,
    submitCharacterGuess,
    submitItemGuess,
    submitSongGuess,
    saveDailyGame
} from '../../core/dailyGame.js';
import { getLocalDateString } from '../../core/dailySeed.js';
import { compareCharacters } from '../../core/Character.js';
import { compareSongs } from '../../core/songGame.js';

// UI components
import DailyStepper from './DailyStepper.jsx';
import DailyVictoryModal from './DailyVictoryModal.jsx';

// Existing game components
import GuessGrid from '../Character/GuessGrid.jsx';
import ItemsPage from '../Item/ItemsPage.jsx';
import SongGame from '../Song/SongGame.jsx';

function getSimulatedOrLocalDate() {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return dateParam;
    }
    return getLocalDateString();
}

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
}

export default function DailyGame() {
    const simulatedDate = getSimulatedOrLocalDate();
    const [gameState, setGameState] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [extraSeconds, setExtraSeconds] = useState(0);
    const [duration, setDuration] = useState(0);

    const { setIsHelpWidgetHidden } = useContext(HelpWidgetContext);

    useEffect(() => {
        if (setIsHelpWidgetHidden) {
            setIsHelpWidgetHidden(isModalOpen);
        }
        return () => {
            if (setIsHelpWidgetHidden) {
                setIsHelpWidgetHidden(false);
            }
        };
    }, [isModalOpen, setIsHelpWidgetHidden]);

    const sessionStartRef = useRef(Date.now());

    // Load or create game status for the target date
    useEffect(() => {
        const game = loadOrCreateDailyGame(
            simulatedDate,
            deltaruneCharacters,
            deltaruneItems,
            deltaruneSoundtrack
        );
        setGameState(game);

        // If the game was already victory/defeat on reload, show modal
        if (game.status !== 'playing') {
            setIsModalOpen(true);
        } else {
            setIsModalOpen(false);
        }
        setExtraSeconds(0);
    }, [simulatedDate]);

    // Track active playing timer
    useEffect(() => {
        if (!gameState || gameState.status !== 'playing') return;

        sessionStartRef.current = Date.now();
        const initialElapsed = gameState.elapsedTime || 0;

        const updateTime = () => {
            setDuration(initialElapsed + (Date.now() - sessionStartRef.current));
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);

        return () => {
            clearInterval(interval);
            const finalElapsed = initialElapsed + (Date.now() - sessionStartRef.current);
            const latestState = loadOrCreateDailyGame(
                simulatedDate,
                deltaruneCharacters,
                deltaruneItems,
                deltaruneSoundtrack
            );
            if (latestState && latestState.status === 'playing') {
                latestState.elapsedTime = finalElapsed;
                saveDailyGame(latestState);
            }
        };
    }, [gameState?.status, simulatedDate]);

    // Attach developer tools to the window scope for clean testing
    useEffect(() => {
        if (import.meta.env.DEV) {
            window.deltasongDev = {
                reset: () => {
                    const dateStr = getSimulatedOrLocalDate();
                    const key = `daily_status_${dateStr}`;
                    localStorage.removeItem(key);
                    const fresh = loadOrCreateDailyGame(
                        dateStr,
                        deltaruneCharacters,
                        deltaruneItems,
                        deltaruneSoundtrack
                    );
                    setGameState(fresh);
                    setExtraSeconds(0);
                    setIsModalOpen(false);
                    console.log(`[Dev] Reset daily challenge status for date: ${dateStr}`);
                },
                skipStage: () => {
                    setGameState(prev => {
                        if (!prev || prev.status !== 'playing') {
                            console.log('[Dev] Game is already completed or not loaded.');
                            return prev;
                        }
                        const next = { ...prev };
                        if (prev.currentStep === 1) {
                            const targetCharResult = compareCharacters(prev.characterState.target, prev.characterState.target);
                            targetCharResult.isVictory = true;
                            next.guesses.characters = [targetCharResult, ...prev.guesses.characters];
                            next.currentStep = 2;
                            console.log('[Dev] Skipped Stage 1: Characters');
                        } else if (prev.currentStep === 2) {
                            const newGuess = { item: prev.itemState.target, isCorrect: true };
                            next.guesses.items = [newGuess, ...prev.guesses.items];
                            next.currentStep = 3;
                            console.log('[Dev] Skipped Stage 2: Items');
                        } else if (prev.currentStep === 3) {
                            const targetSongResult = compareSongs(prev.songState.target, prev.songState.target);
                            next.guesses.songs = [targetSongResult, ...prev.guesses.songs];
                            next.status = 'victory';
                            next.currentStep = 'completed';
                            next.endTime = Date.now();
                            setIsModalOpen(true);
                            console.log('[Dev] Skipped Stage 3: Song (Victory!)');

                            const rankData = getRankData();
                            const streak = rankData.streak || 1;
                            addPoints(RANK_POINTS.DAILY_VICTORY_BASE + (streak * RANK_POINTS.DAILY_STREAK_BONUS), 'daily');
                        }
                        saveDailyGame(next);
                        return next;
                    });
                },
                setDate: (dateStr) => {
                    const url = new URL(window.location.href);
                    if (dateStr) {
                        url.searchParams.set('date', dateStr);
                    } else {
                        url.searchParams.delete('date');
                    }
                    window.location.href = url.toString();
                }
            };
        }
        return () => {
            if (import.meta.env.DEV) {
                delete window.deltasongDev;
            }
        };
    }, [gameState]);

    if (!gameState) {
        return (
            <Container size="md" className={`${homeClasses.gameContainer} ${classes.container}`}>
                <Paper shadow="md" p="xl" radius="md" withBorder className={homeClasses.gamePaper}>
                    <Stack align="center" gap="md">
                        <img
                            src={lancerGif}
                            alt="Loading..."
                            className={classes.loadingMascot}
                        />
                        <Text ta="center">Loading Daily Challenge...</Text>
                    </Stack>
                </Paper>
            </Container>
        );
    }

    const isGameOver = gameState.status !== 'playing';



    const getUpdatedStateWithTime = () => {
        if (!gameState || gameState.status !== 'playing') return gameState;
        const currentElapsed = (gameState.elapsedTime || 0) + (Date.now() - sessionStartRef.current);
        return {
            ...gameState,
            elapsedTime: currentElapsed
        };
    };

    // Handles guesses for Stage 1: Characters
    const handleCharacterGuess = (characterToGuess) => {
        if (!characterToGuess || !characterToGuess.trim()) return;

        try {
            const stateWithTime = getUpdatedStateWithTime();
            const nextGame = submitCharacterGuess(stateWithTime, characterToGuess);
            setGameState(nextGame);

            if (nextGame.status === 'defeat') {
                setIsModalOpen(true);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Handles guesses for Stage 2: Items
    const handleItemGuess = (itemToGuess) => {
        if (!itemToGuess || !itemToGuess.trim()) return;

        try {
            const stateWithTime = getUpdatedStateWithTime();
            const nextGame = submitItemGuess(stateWithTime, itemToGuess);
            setGameState(nextGame);

            if (nextGame.status === 'defeat') {
                setIsModalOpen(true);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Handles guesses for Stage 3: Song
    const handleSongGuess = (songToGuess) => {
        if (!songToGuess || !songToGuess.trim()) return;

        try {
            const stateWithTime = getUpdatedStateWithTime();
            const nextGame = submitSongGuess(stateWithTime, songToGuess);
            setGameState(nextGame);

            if (nextGame.status === 'victory' || nextGame.status === 'defeat') {
                setIsModalOpen(true);
                if (gameState.status === 'playing' && nextGame.status === 'victory') {
                    const rankData = getRankData();
                    const streak = rankData.streak || 1;
                    const basePoints = RANK_POINTS.DAILY_VICTORY_BASE + (streak * RANK_POINTS.DAILY_STREAK_BONUS);
                    const paidPenalty = Math.max(0, (nextGame.songState.hintsUsed || 0) - 1) * (RANK_POINTS.SONG_HINT_PENALTY || 10);
                    const points = Math.max(basePoints, paidPenalty + 10);
                    addPoints(points, 'daily');
                }
            }
        } catch (err) {
            console.error(err);
        }
    };


    const currentStep = gameState.currentStep;
    let attemptsLeft = 0;
    let totalAttempts = 0;
    if (currentStep === 1) {
        totalAttempts = DAILY_LIMITS.characters;
        attemptsLeft = Math.max(0, totalAttempts - (gameState.guesses?.characters?.length || 0));
    } else if (currentStep === 2) {
        totalAttempts = DAILY_LIMITS.items;
        attemptsLeft = Math.max(0, totalAttempts - (gameState.guesses?.items?.length || 0));
    } else if (currentStep === 3) {
        totalAttempts = DAILY_LIMITS.songs;
        attemptsLeft = Math.max(0, totalAttempts - (gameState.guesses?.songs?.length || 0));
    }

    const isLowAttempts = attemptsLeft <= 3;
    const handleSongHint = () => {
        try {
            const stateWithTime = getUpdatedStateWithTime();
            const nextGame = {
                ...stateWithTime,
                songState: {
                    ...stateWithTime.songState,
                    hintsUsed: (stateWithTime.songState.hintsUsed || 0) + 1
                }
            };
            setGameState(nextGame);
            saveDailyGame(nextGame);
        } catch (err) {
            console.error(err);
        }
    };

    const handleGiveUpClick = () => {
        if (isConfirmingGiveUp) {
            const stateWithTime = getUpdatedStateWithTime();
            const nextGame = giveUpDaily(stateWithTime);
            setGameState(nextGame);
            setIsModalOpen(true);
            setIsConfirmingGiveUp(false);
        } else {
            setIsConfirmingGiveUp(true);
        }
    };

    return (
        <Container size="md" className={`${homeClasses.gameContainer} ${classes.container}`}>
            <Paper
                shadow="md"
                p="xl"
                radius="md"
                withBorder
                className={homeClasses.gamePaper}
            >
                {!isGameOver && (
                    <div className={classes.attemptsContainer}>
                        <Text size="xs" fw="bold">ATTEMPTS</Text>
                        <span className={`${classes.attemptsText} ${isLowAttempts ? classes.attemptsTextWarning : ''}`}>
                            {attemptsLeft}/{totalAttempts}
                        </span>
                    </div>
                )}

                <Stack gap="md" align="center" w="100%">
                    <Title order={2} ta="center" mb="lg" className={`${homeClasses.conventionalTitle} ${classes.gameTitle}`}>
                        Daily Challenge
                    </Title>

                    <DailyStepper currentStep={gameState.currentStep} status={gameState.status} />

                    {isGameOver && (
                        <Button
                            color="emeraldGreen"
                            onClick={() => setIsModalOpen(true)}
                            className={homeClasses.conventionalFont}
                            mt="xs"
                        >
                            View Stats
                        </Button>
                    )}

                    {/* Info Bar / Controls */}
                    <Box mt="md" mb="md">
                        <div className={classes.timerContainer}>
                            <Text size="xs" fw="bold">TIME</Text>
                            <span className={classes.timerText}>
                                {formatDuration(duration)}
                            </span>
                        </div>
                    </Box>

                    {/* Developer Instructions */}
                    {import.meta.env.DEV && (
                        <Text size="xs" ta="center" c="var(--color-accent-primary)" mb="md">
                            [Dev Mode] Use `window.deltasongDev.skipStage()` in your console to advance.
                        </Text>
                    )}

                    {/* Stage Views */}
                    {(gameState.currentStep === 1 || isGameOver) && (
                        <GuessGrid
                            isDaily={true}
                            dailyGameState={gameState.characterState}
                            dailyGuesses={gameState.guesses.characters}
                            onDailyGuess={handleCharacterGuess}
                        />
                    )}

                    {(gameState.currentStep === 2 || (isGameOver && gameState.guesses.items.length > 0)) && (
                        <ItemsPage
                            isDaily={true}
                            dailyGameState={gameState.itemState}
                            dailyGuesses={gameState.guesses.items}
                            onDailyGuess={handleItemGuess}
                        />
                    )}

                    {(gameState.currentStep === 3 || (isGameOver && gameState.guesses.songs.length > 0)) && (
                        <SongGame
                            isDaily={true}
                            isDailyGameOver={isGameOver}
                            dailyGameState={gameState.songState}
                            dailyGuesses={gameState.guesses.songs}
                            onDailyGuess={handleSongGuess}
                            extraSeconds={extraSeconds}
                            setExtraSeconds={setExtraSeconds}
                            onDailyHint={handleSongHint}
                        />
                    )}
                </Stack>
            </Paper>

            <DailyVictoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                gameState={gameState}
            />
        </Container>
    );
}
