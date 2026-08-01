import { useEffect, useState, useContext } from 'react';
import { Stack, Text, Button, Modal, Paper } from '@mantine/core';
import { IconBulb } from '@tabler/icons-react';
import deltaruneSoundtrack from '../../assets/data/deltarune_soundtrack.json';
import jevilGif from '../../assets/images/jevil.gif';
import { HelpWidgetContext } from '../../utils/HelpWidgetContext.js';

import { createSongGame, makeSongGuess, compareSongs } from '../../core/songGame.js';
import { SONG_DIFFICULTIES, RANK_POINTS } from '../../config/Constants.js';
import AudioPlayer from './AudioPlayer.jsx';
import DifficultySelector from './DifficultySelector.jsx';
import SongSearchBar from './SongSearchBar.jsx';
import GuessHistory from './GuessHistory.jsx';
import styles from '../../styles/Song.module.css';
import homeClasses from '../../styles/Home.module.css';
import { addPoints } from '../../core/rankSystem.js';

// Helper to extract YouTube video ID
function getYouTubeId(url) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
}

export default function SongGame({
    isDaily = false,
    isDailyGameOver = false,
    dailyGameState = null,
    dailyGuesses = [],
    onDailyGuess = null,
    extraSeconds: dailyExtraSeconds = 0,
    setExtraSeconds: setDailyExtraSeconds = null,
    onDailyHint = null
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
    const activeIsGameOver = isDaily ? isDailyGameOver : (isWon || isGivenUp);
    const activeIsWon = isDaily ? (isDailyGameOver && activeGuesses.some(g => g.title && g.title.correct)) : isWon;
    const activeIsGivenUp = isDaily ? (isDailyGameOver && !activeIsWon) : isGivenUp;

    const title = activeGameState?.target?.title || "";
    const charMetadata = [];
    let currentWordIndex = 0;
    let currentCharIndexInWord = 0;
    let wordLengths = [];
    
    for (let i = 0; i < title.length; i++) {
        const char = title[i];
        const isLetter = /[a-zA-Z]/.test(char);
        if (isLetter) {
            charMetadata.push({
                isLetter: true,
                wordIndex: currentWordIndex,
                charIndexInWord: currentCharIndexInWord
            });
            currentCharIndexInWord++;
        } else {
            charMetadata.push({
                isLetter: false,
                wordIndex: -1,
                charIndexInWord: -1
            });
            if (char === ' ') {
                if (currentCharIndexInWord > 0) {
                    wordLengths.push(currentCharIndexInWord);
                    currentWordIndex++;
                    currentCharIndexInWord = 0;
                }
            }
        }
    }
    if (currentCharIndexInWord > 0) {
        wordLengths.push(currentCharIndexInWord);
    }

    const totalLetters = wordLengths.reduce((sum, len) => sum + len, 0);
    const totalWords = wordLengths.length;

    let hintLimit = 1;
    if (activeDiff === 'easy') {
        hintLimit = Math.max(1, (totalLetters - totalWords) - totalWords);
    } else if (activeDiff === 'normal') {
        hintLimit = Math.max(2, Math.ceil(title.length / 2) - totalWords);
    } else if (activeDiff === 'hard') {
        hintLimit = Math.max(2, Math.ceil(title.length / 4) - totalWords);
    } else if (activeDiff === 'madness') {
        hintLimit = 1;
    }

    const activeHintsUsed = activeGameState?.hintsUsed || 0;

    let extraReveals = activeHintsUsed >= 2 ? activeHintsUsed - 2 : 0;
    const wordRevealedCounts = wordLengths.map(len => {
        if (activeHintsUsed < 2) return 0;
        let count = 1;
        const extraForThisWord = Math.min(extraReveals, len - 1);
        count += extraForThisWord;
        extraReveals -= extraForThisWord;
        return count;
    });

    const isTitleBlockRevealed = activeIsGameOver || activeHintsUsed >= 1;

    const handleRequestHint = () => {
        if (activeHintsUsed >= hintLimit || activeIsGameOver) return;

        const isFreeHint = activeHintsUsed === 0;
        if (!isFreeHint) {
            const penalty = RANK_POINTS.SONG_HINT_PENALTY || 10;
            addPoints(-penalty, isDaily ? 'daily' : 'songs');
        }

        if (isDaily) {
            if (onDailyHint) {
                onDailyHint();
            }
        } else {
            setGameState(prev => ({
                ...prev,
                hintsUsed: (prev.hintsUsed || 0) + 1
            }));
        }
    };

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

                if (!isDaily) {
                    const attempts = result.gameState.guessedTitles.length;
                    let points = 0;
                    if (attempts <= 3) points = RANK_POINTS.VICTORY_FAST_ATTEMPTS;
                    else if (attempts <= 6) points = RANK_POINTS.VICTORY_MEDIUM_ATTEMPTS;
                    else points = RANK_POINTS.VICTORY_SLOW_ATTEMPTS;

                    const duration = (Date.now() - startTime) / 1000;
                    if (duration < RANK_POINTS.SPEED_THRESHOLD_SECONDS) {
                        points += RANK_POINTS.SPEED_BONUS;
                    }

                    // Guarantee a positive net score by offsetting the paid hints penalty
                    const paidPenalty = Math.max(0, activeHintsUsed - 1) * (RANK_POINTS.SONG_HINT_PENALTY || 10);
                    const finalPoints = Math.max(points, paidPenalty + 10);
                    addPoints(finalPoints, 'songs');
                }

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
            const game = createSongGame(deltaruneSoundtrack);
            setGameState(game);
            setGuessedTitles([]);
            setGuesses([]);
            setIsWon(false);
            setIsGivenUp(false);
            setHasPlayed(false);
            setExtraSeconds(0);
            setStartTime(Date.now());
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
                <div className={styles.unifiedPanel}>
                    <AudioPlayer
                        videoUrl={activeGameState.target.url}
                        startTime={actualStartTime}
                        durationLimit={durationLimit}
                        disabled={activeIsGameOver}
                        onPlay={() => setHasPlayed(true)}
                        onAddTime={() => activeSetExtraSeconds(prev => prev + 1)}
                        maxTimeReached={maxTimeReached}
                        isClueAvailable={activeDiff === 'easy'}
                        extraControl={
                            !activeIsGameOver && (
                                <Button
                                    leftSection={<IconBulb size={16} />}
                                    onClick={handleRequestHint}
                                    disabled={!hasPlayed || activeHintsUsed >= hintLimit}
                                    color="cyberCyan"
                                    variant="light"
                                    className={styles.playerBtn}
                                >
                                    Hint
                                </Button>
                            )
                        }
                        timeDisplayOverride={
                            activeHintsUsed >= 1
                                ? (activeHintsUsed >= hintLimit 
                                    ? `Hints: ${activeHintsUsed}/${hintLimit} (Max)` 
                                    : `Hints: ${activeHintsUsed}/${hintLimit}`)
                                : null
                        }
                    />

                    {isTitleBlockRevealed && (
                        <>
                            <div className={styles.panelDivider} />

                            <div className={styles.hintSectionInternal}>
                                <div className={styles.maskedTitleContainer}>
                                    {title.split('').map((char, index) => {
                                        const isLetter = /[a-zA-Z]/.test(char);
                                        if (isLetter) {
                                            const metadata = charMetadata[index];
                                            const isRevealed = activeIsGameOver || (
                                                metadata && metadata.isLetter && metadata.wordIndex !== -1 && metadata.charIndexInWord < wordRevealedCounts[metadata.wordIndex]
                                            );

                                            let charClass = styles.maskedChar;
                                            if (isRevealed) {
                                                charClass += ` ${styles.revealedChar}`;
                                                if (activeIsGameOver) {
                                                    if (activeIsWon) {
                                                        charClass += ` ${styles.victoryChar}`;
                                                    } else if (activeIsGivenUp) {
                                                        charClass += ` ${styles.surrenderChar}`;
                                                    }
                                                }
                                            }

                                            return (
                                                <span 
                                                    key={`${index}-${isRevealed}`} 
                                                    className={charClass}
                                                >
                                                    {isRevealed ? char : '\u00A0'}
                                                </span>
                                            );
                                        } else if (char === ' ') {
                                            return (
                                                <span key={index} className={styles.maskedSpace} />
                                            );
                                        } else {
                                            return (
                                                <span key={index} className={styles.maskedPunctuation}>
                                                    {char}
                                                </span>
                                            );
                                        }
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
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

            <GuessHistory guesses={activeGuesses.slice(0, 15)} />
        </Stack>
    );
}
