import { useEffect, useState } from 'react';
import { Stack, Text, Button, Modal, Paper } from '@mantine/core';
import deltaruneSoundtrack from '../../assets/deltarune_soundtrack.json' with { type: 'json' };
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

export default function SongGame() {
    const [gameState, setGameState] = useState(null);
    const [input, setInput] = useState('');
    const [activeDifficulty, setActiveDifficulty] = useState('easy');
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
        const game = createSongGame(deltaruneSoundtrack);
        setGameState(game);
    }, []);

    const songOptions = deltaruneSoundtrack
        .map(s => s.title)
        .filter(title => !guessedTitles.includes(title.toUpperCase()));

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

    const isGameOver = isWon || isGivenUp;
    const baseDuration = SONG_DIFFICULTIES[activeDifficulty]?.duration || 5.0;
    const actualStartTime = activeDifficulty === 'easy' ? 0 : (gameState ? gameState.startTime : 0);
    const maxPlayableDuration = gameState ? (gameState.target.duration_seconds - actualStartTime) : 99;
    const durationLimit = Math.min(
        maxPlayableDuration,
        baseDuration + extraSeconds
    );
    const maxTimeReached = gameState ? durationLimit >= maxPlayableDuration : false;

    return (
        <Stack gap="md" align="center" w="100%">
            {!isGameOver && gameState && (
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

            <DifficultySelector
                activeDifficulty={activeDifficulty}
                onChangeDifficulty={setActiveDifficulty}
                disabled={isGameOver || guesses.length > 0 || hasPlayed}
            />

            {gameState && (
                <AudioPlayer
                    videoUrl={gameState.target.url}
                    startTime={activeDifficulty === 'easy' ? 0 : gameState.startTime}
                    durationLimit={durationLimit}
                    disabled={isGameOver}
                    onPlay={() => setHasPlayed(true)}
                    onAddTime={() => setExtraSeconds(prev => prev + 1)}
                    maxTimeReached={maxTimeReached}
                    isClueAvailable={activeDifficulty === 'easy'}
                />
            )}

            {!isGameOver && (
                <SongSearchBar
                    data={songOptions}
                    songsMap={songsMap}
                    input={input}
                    setInput={setInput}
                    handleGuess={handleGuess}
                />
            )}

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

            <GuessHistory guesses={guesses} />
        </Stack>
    );
}
