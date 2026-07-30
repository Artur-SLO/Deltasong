import { useEffect, useState } from 'react';
import { Stack, Text, Button, Modal, Paper } from '@mantine/core';
import deltaruneSoundtrack from '../../assets/deltarune_soundtrack.json' with { type: 'json' };
import jevilGif from '../../assets/jevil.gif';

import { createSongGame, makeSongGuess, compareSongs } from '../../core/songGame.js';
import { SONG_DIFFICULTIES } from '../../config/Constants.js';
import AudioPlayer from './AudioPlayer.jsx';
import DifficultySelector from './DifficultySelector.jsx';
import SongSearchBar from './SongSearchBar.jsx';
import GuessHistory from './GuessHistory.jsx';
import styles from '../../styles/Song.module.css';
import homeClasses from '../../styles/Home.module.css';

// Helper to extract YouTube video ID
function getYouTubeId(url) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
}

export default function SongGame({
    isDaily = false,
    dailyGameState = null,
    dailyGuesses = [],
    onDailyGuess = null,
    extraSeconds: dailyExtraSeconds = 0,
    setExtraSeconds: setDailyExtraSeconds = null
}) {
    const [gameState, setGameState] = useState(null);
    const [input, setInput] = useState('');
    const [activeDifficulty, setActiveDifficulty] = useState('normal');
    const [guessedTitles, setGuessedTitles] = useState([]);
    const [guesses, setGuesses] = useState([]);
    const [isWon, setIsWon] = useState(false);
    const [isGivenUp, setIsGivenUp] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('victory');
    const [isConfirmingGiveUp, setIsConfirmingGiveUp] = useState(false);
    const [hasPlayed, setHasPlayed] = useState(false);
    const [extraSeconds, setExtraSeconds] = useState(0);

    useEffect(() => {
        if (isDaily) return;
        const game = createSongGame(deltaruneSoundtrack);
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
    const activeGuesses = isDaily ? dailyGuesses : guesses;
    const activeGuessedTitles = isDaily ? (dailyGameState?.guessedTitles || []) : guessedTitles;
    const activeExtraSeconds = isDaily ? dailyExtraSeconds : extraSeconds;
    const activeSetExtraSeconds = isDaily ? setDailyExtraSeconds : setExtraSeconds;
    const activeDiff = isDaily ? 'normal' : activeDifficulty;
    const activeIsGameOver = isDaily ? false : (isWon || isGivenUp);

    const songOptions = deltaruneSoundtrack
        .map(s => s.title)
        .filter(title => !activeGuessedTitles.includes(title.toUpperCase().trim()));

    const songsMap = Object.fromEntries(
        deltaruneSoundtrack.map(s => [s.title, s])
    );

    const handleGuess = (e, selectedTitle) => {
        if (e && e.preventDefault) e.preventDefault();
        const songToGuess = selectedTitle || input;
        if (!songToGuess || !songToGuess.trim()) return;
        if (isWon || isGivenUp || !gameState) return;

        try {
            const result = makeSongGuess(gameState, songToGuess);
            const outcome = result.outcome;

            if (outcome === "Victory") {
                const targetSongResult = compareSongs(gameState.target, gameState.target);
                setGuesses((prev) => [targetSongResult, ...prev]);
                setIsWon(true);
                setGuessedTitles(result.gameState.guessedTitles);
                // Delay showing victory modal until all cells fade in (3 * 0.45s = 1.35s)
                setTimeout(() => {
                    setModalType('victory');
                    setIsModalOpen(true);
                }, 1400);
            } else {
                setGuesses((prev) => [outcome, ...prev]);
                setGameState(result.gameState);
                setGuessedTitles(result.gameState.guessedTitles);
            }
        } catch (err) {
            console.error(err);
        }
        setInput('');
    };

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
            const game = createSongGame(deltaruneSoundtrack);
            setGameState(game);
            setGuessedTitles([]);
            setGuesses([]);
            setIsWon(false);
            setIsGivenUp(false);
            setHasPlayed(false);
            setExtraSeconds(0);
            setInput('');
        }, 200);
    };

    const baseDuration = SONG_DIFFICULTIES[activeDiff]?.duration || 5.0;
    const actualStartTime = activeDiff === 'easy' ? 0 : (activeGameState ? activeGameState.startTime : 0);
    const maxPlayableDuration = activeGameState ? (activeGameState.target.duration_seconds - actualStartTime) : 99;
    const durationLimit = Math.min(
        maxPlayableDuration,
        baseDuration + activeExtraSeconds
    );
    const maxTimeReached = activeGameState ? durationLimit >= maxPlayableDuration : false;

    const handleGuessAction = (e, selectedTitle) => {
        if (isDaily) {
            if (e && e.preventDefault) e.preventDefault();
            const songToGuess = selectedTitle || input;
            if (!songToGuess || !songToGuess.trim()) return;
            onDailyGuess(songToGuess);
            setInput('');
        } else {
            handleGuess(e, selectedTitle);
        }
    };

    return (
        <Stack gap="md" align="center" w="100%">
            {!activeIsGameOver && activeGameState && !isDaily && (
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

            {!isDaily && (
                <DifficultySelector
                    activeDifficulty={activeDiff}
                    onChangeDifficulty={setActiveDifficulty}
                    disabled={activeIsGameOver || activeGuesses.length > 0 || hasPlayed}
                />
            )}

            {activeGameState && (
                <AudioPlayer
                    videoUrl={activeGameState.target.url}
                    startTime={actualStartTime}
                    durationLimit={durationLimit}
                    disabled={activeIsGameOver}
                    onPlay={isDaily ? () => { } : () => setHasPlayed(true)}
                    onAddTime={() => activeSetExtraSeconds(prev => prev + 1)}
                    maxTimeReached={maxTimeReached}
                    isClueAvailable={activeDiff === 'easy'}
                />
            )}

            {!activeIsGameOver && (
                <SongSearchBar
                    data={songOptions}
                    songsMap={songsMap}
                    input={input}
                    setInput={setInput}
                    handleGuess={handleGuessAction}
                />
            )}

            {!isDaily && (
                <Modal
                    opened={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    centered
                    size="lg"
                    classNames={{
                        content: styles.modalContent,
                        header: styles.modalHeader,
                        title: modalType === 'victory' ? styles.modalTitleVictory : styles.modalTitleSurrender
                    }}
                    title={modalType === 'victory' ? 'Victory!' : 'Game Over'}
                >
                    <Stack align="center" gap="md" p="md">
                        <img
                            src={jevilGif}
                            alt="Jevil Mascot"
                            className={styles.mascotGif}
                        />
                        <Text size="lg" ta="center">
                            {modalType === 'victory'
                                ? "Congratulations! You guessed the song!"
                                : "Too bad! The secret song was:"}
                        </Text>

                        {gameState?.target && (
                            <Paper className={styles.targetCard} withBorder>
                                <Text className={styles.modalTextTitle}>
                                    {gameState.target.title}
                                </Text>
                                <Text className={styles.modalTextSubtitle}>
                                    Chapter {gameState.target.chapter} ({gameState.target.duration_formatted})
                                </Text>
                                <iframe
                                    src={`https://www.youtube.com/embed/${getYouTubeId(gameState.target.url)}?autoplay=1&controls=1`}
                                    title={gameState.target.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className={styles.modalIframe}
                                />
                            </Paper>
                        )}

                        <Button
                            color="emeraldGreen"
                            size="md"
                            onClick={resetGame}
                            className={`${homeClasses.conventionalFont} ${styles.playAgainBtn}`}
                        >
                            Play Again
                        </Button>
                    </Stack>
                </Modal>
            )}

            <GuessHistory guesses={activeGuesses} />
        </Stack>
    );
}
