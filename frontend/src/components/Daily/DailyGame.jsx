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
    saveDailyGame,
    giveUpDaily,
    calculateStagePoints
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
    const [isConfirmingGiveUp, setIsConfirmingGiveUp] = useState(false);

    const currentStep = gameState?.currentStep;

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
    const latestElapsedTimesRef = useRef({});
    if (gameState) {
        latestElapsedTimesRef.current = gameState.elapsedTimes || {};
    }

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
        if (!gameState) return;

        const stepKey = currentStep === 1 ? 'characters' : (currentStep === 2 ? 'items' : 'songs');

        const isStageCompleted = gameState.stageResults?.[stepKey] === 'victory' || gameState.stageResults?.[stepKey] === 'defeat';
        const savedTime = gameState.status !== 'playing' 
            ? (gameState.elapsedTime || 0) 
            : (gameState.elapsedTimes?.[stepKey] || 0);
        setDuration(savedTime);

        if (gameState.status !== 'playing' || isStageCompleted) return;

        sessionStartRef.current = Date.now();

        const updateTime = () => {
            if (gameState.status !== 'playing') return;
            const currentElapsed = latestElapsedTimesRef.current[stepKey] || 0;
            setDuration(currentElapsed + (Date.now() - sessionStartRef.current));
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);

        return () => {
            clearInterval(interval);
            const currentElapsed = latestElapsedTimesRef.current[stepKey] || 0;
            const finalElapsed = currentElapsed + (Date.now() - sessionStartRef.current);
            const latestState = loadOrCreateDailyGame(
                simulatedDate,
                deltaruneCharacters,
                deltaruneItems,
                deltaruneSoundtrack
            );
            if (latestState && latestState.status === 'playing') {
                const isStageCompleted = latestState.stageResults?.[stepKey] === 'victory' || latestState.stageResults?.[stepKey] === 'defeat';
                if (!isStageCompleted) {
                    if (!latestState.elapsedTimes) {
                        latestState.elapsedTimes = { characters: 0, items: 0, songs: 0 };
                    }
                    latestState.elapsedTimes[stepKey] = finalElapsed;
                    latestState.elapsedTime = (latestState.elapsedTimes.characters || 0) +
                        (latestState.elapsedTimes.items || 0) +
                        (latestState.elapsedTimes.songs || 0);
                    saveDailyGame(latestState);
                }
            }
        };
    }, [gameState?.status, currentStep, simulatedDate]);

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
                            next.stageResults.characters = 'victory';
                            next.stagePoints.characters = calculateStagePoints(1, 15000, true, 'characters');
                            next.elapsedTimes.characters = 15000;
                            next.currentStep = 2;
                            console.log('[Dev] Skipped Stage 1: Characters');
                        } else if (prev.currentStep === 2) {
                            const newGuess = { item: prev.itemState.target, isCorrect: true };
                            next.guesses.items = [newGuess, ...prev.guesses.items];
                            next.stageResults.items = 'victory';
                            next.stagePoints.items = calculateStagePoints(1, 15000, true, 'items');
                            next.elapsedTimes.items = 15000;
                            next.currentStep = 3;
                            console.log('[Dev] Skipped Stage 2: Items');
                        } else if (prev.currentStep === 3) {
                            const targetSongResult = compareSongs(prev.songState.target, prev.songState.target);
                            next.guesses.songs = [targetSongResult, ...prev.guesses.songs];
                            next.stageResults.songs = 'victory';
                            next.stagePoints.songs = calculateStagePoints(1, 15000, true, 'songs', prev.songState.hintsUsed || 0);
                            next.elapsedTimes.songs = 15000;
                            next.status = 'victory';
                            next.currentStep = 'completed';
                            next.endTime = Date.now();
                            setIsModalOpen(true);
                            console.log('[Dev] Skipped Stage 3: Song (Victory!)');

                            const rankData = getRankData();
                            const streak = rankData.streak || 1;

                            const charPts = next.stagePoints.characters || 0;
                            const itemPts = next.stagePoints.items || 0;
                            const songPts = next.stagePoints.songs || 0;
                            let totalPoints = charPts + itemPts + songPts;

                            const basePoints = RANK_POINTS.DAILY_VICTORY_BASE + (streak * RANK_POINTS.DAILY_STREAK_BONUS);
                            const paidPenalty = Math.max(0, (next.songState.hintsUsed || 0) - 1) * (RANK_POINTS.SONG_HINT_PENALTY || 10);
                            const targetTotalPoints = Math.max(basePoints, paidPenalty + 10);
                            const victoryBonus = Math.max(0, targetTotalPoints - (charPts + itemPts + songPts));
                            totalPoints += victoryBonus;

                            next.earnedPoints = totalPoints;
                            next.victoryBonus = victoryBonus;

                            addPoints(totalPoints, 'daily', true);
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
    const activeStep = (isGameOver && (currentStep === 'completed' || !currentStep)) ? 1 : currentStep;



    const getUpdatedStateWithTime = () => {
        if (!gameState || gameState.status !== 'playing') return gameState;

        const stepKey = currentStep === 1 ? 'characters' : (currentStep === 2 ? 'items' : 'songs');

        // If the current stage is already completed (victory or defeat), do not add any active session time
        const isStageCompleted = gameState.stageResults?.[stepKey] === 'victory' || gameState.stageResults?.[stepKey] === 'defeat';
        if (isStageCompleted) {
            return gameState;
        }

        const now = Date.now();
        const elapsedForStep = (gameState.elapsedTimes?.[stepKey] || 0) + (now - sessionStartRef.current);

        // Reset the session start time to now because we are committing/accumulating this session's elapsed time!
        sessionStartRef.current = now;

        const nextElapsedTimes = {
            ...gameState.elapsedTimes,
            [stepKey]: elapsedForStep
        };

        const nextElapsedTime = (nextElapsedTimes.characters || 0) +
            (nextElapsedTimes.items || 0) +
            (nextElapsedTimes.songs || 0);

        return {
            ...gameState,
            elapsedTimes: nextElapsedTimes,
            elapsedTime: nextElapsedTime
        };
    };

    const handleDailyChallengeFinished = (nextGame) => {
        if (gameState.status === 'playing') {
            const rankData = getRankData();
            const streak = rankData.streak || 1;

            const charPts = nextGame.stagePoints?.characters || 0;
            const itemPts = nextGame.stagePoints?.items || 0;
            const songPts = nextGame.stagePoints?.songs || 0;

            let totalPoints = charPts + itemPts + songPts;
            const isDailyWin = nextGame.status === 'victory';

            let victoryBonus = 0;
            if (isDailyWin) {
                const basePoints = RANK_POINTS.DAILY_VICTORY_BASE + (streak * RANK_POINTS.DAILY_STREAK_BONUS);
                const paidPenalty = Math.max(0, (nextGame.songState.hintsUsed || 0) - 1) * (RANK_POINTS.SONG_HINT_PENALTY || 10);
                const targetTotalPoints = Math.max(basePoints, paidPenalty + 10);
                victoryBonus = Math.max(0, targetTotalPoints - (charPts + itemPts + songPts));
                totalPoints += victoryBonus;
            }

            const nextGameWithPoints = {
                ...nextGame,
                earnedPoints: totalPoints,
                victoryBonus: victoryBonus
            };
            saveDailyGame(nextGameWithPoints);
            setGameState(nextGameWithPoints);
            setIsModalOpen(true);

            addPoints(totalPoints, 'daily', isDailyWin);
        }
    };

    // Handles guesses for Stage 1: Characters
    const handleCharacterGuess = (characterToGuess) => {
        if (!characterToGuess || !characterToGuess.trim()) return;

        try {
            const stateWithTime = getUpdatedStateWithTime();
            const nextGame = submitCharacterGuess(stateWithTime, characterToGuess);

            if (nextGame.status === 'victory' || nextGame.status === 'defeat') {
                handleDailyChallengeFinished(nextGame);
            } else {
                setGameState(nextGame);
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

            if (nextGame.status === 'victory' || nextGame.status === 'defeat') {
                handleDailyChallengeFinished(nextGame);
            } else {
                setGameState(nextGame);
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

            if (nextGame.status === 'victory' || nextGame.status === 'defeat') {
                handleDailyChallengeFinished(nextGame);
            } else {
                setGameState(nextGame);
            }
        } catch (err) {
            console.error(err);
        }
    };

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

            const charPts = nextGame.stagePoints?.characters || 0;
            const itemPts = nextGame.stagePoints?.items || 0;
            const songPts = nextGame.stagePoints?.songs || 0;
            const totalPoints = charPts + itemPts + songPts;

            nextGame.earnedPoints = totalPoints;
            nextGame.victoryBonus = 0;
            saveDailyGame(nextGame);

            setGameState(nextGame);
            setIsModalOpen(true);
            setIsConfirmingGiveUp(false);

            addPoints(totalPoints, 'daily', false);
        } else {
            setIsConfirmingGiveUp(true);
        }
    };

    const handleStepClick = (stepId) => {
        if (!gameState) return;
        if (currentStep === stepId) return;

        if (gameState.status !== 'playing') {
            setGameState(prev => ({
                ...prev,
                currentStep: stepId
            }));
            return;
        }

        const stateWithTime = getUpdatedStateWithTime();
        const nextState = {
            ...stateWithTime,
            currentStep: stepId
        };
        saveDailyGame(nextState);
        setGameState(nextState);
    };

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

                <Stack gap="sm" align="center" w="100%">
                    <Title order={2} ta="center" mb="lg" className={`${homeClasses.conventionalTitle} ${classes.gameTitle}`}>
                        Daily Challenge
                    </Title>

                    <DailyStepper currentStep={activeStep} status={gameState.status} stageResults={gameState.stageResults} onStepClick={handleStepClick} />

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
                    {/* {import.meta.env.DEV && ( */}
                    {/*     <Text size="xs" ta="center" c="var(--color-accent-primary)" mb="md"> */}
                    {/*         [Dev Mode] Use `window.deltasongDev.skipStage()` in your console to advance. */}
                    {/*     </Text> */}
                    {/* )} */}

                    {/* Stage Views */}
                    {activeStep === 1 && (
                        <GuessGrid
                            isDaily={true}
                            dailyGameState={gameState.characterState}
                            dailyGuesses={gameState.guesses.characters}
                            onDailyGuess={handleCharacterGuess}
                        />
                    )}

                    {activeStep === 2 && (
                        <ItemsPage
                            isDaily={true}
                            dailyGameState={gameState.itemState}
                            dailyGuesses={gameState.guesses.items}
                            onDailyGuess={handleItemGuess}
                        />
                    )}

                    {activeStep === 3 && (
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
