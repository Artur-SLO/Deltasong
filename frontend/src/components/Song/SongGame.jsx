import { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { Stack, Text, Button, Modal, Paper, Group } from '@mantine/core';
import deltaruneSoundtrack from '../../assets/data/deltarune_soundtrack.json';
import jevilGif from '../../assets/images/jevil.gif';
import { IconBulb, IconBolt, IconMusic } from '@tabler/icons-react';
import ModalHeader from '../Common/ModalHeader.jsx';
import { HelpWidgetContext } from '../../utils/HelpWidgetContext.js';

import { createSongGame, makeSongGuess, compareSongs } from '../../core/songGame.js';
import { 
    createSongRushGame, 
    makeSongRushGuess, 
    skipSongRushStage,
    RUSH_LIVES
} from '../../core/songRush.js';
import { SONG_DIFFICULTIES, DIFFICULTY_HEX, RANK_POINTS, DAILY_LIMITS } from '../../config/Constants.js';
import AudioPlayer from './AudioPlayer.jsx';
import DifficultySelector from './DifficultySelector.jsx';
import SongSearchBar from './SongSearchBar.jsx';
import GuessHistory from './GuessHistory.jsx';
import Soul, { getRandomSoulColors } from '../Common/Soul.jsx';
import styles from '../../styles/Song.module.css';
import homeClasses from '../../styles/Home.module.css';
import { addPoints } from '../../core/rankSystem.js';

// Helper to extract YouTube video ID
function getYouTubeId(url) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=[^#&?]*).*/;
    const match = url.match(regExp);
    if (match) {
        const idMatch = url.match(/(?:\?v=|\/embed\/|\.be\/)([\w-]{11})/);
        return idMatch ? idMatch[1] : '';
    }
    return '';
}

function computeMaskedTitleData(title, difficulty, hintsUsed, isGameOver = false) {
    if (!title) {
        return {
            charMetadata: [],
            wordRevealedCounts: [],
            hintLimit: 1,
            isTitleBlockRevealed: false
        };
    }

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
    if (difficulty === 'easy') {
        hintLimit = Math.max(1, (totalLetters - totalWords) - totalWords);
    } else if (difficulty === 'medium' || difficulty === 'normal') {
        hintLimit = Math.max(2, Math.ceil(title.length / 2) - totalWords);
    } else if (difficulty === 'hard') {
        hintLimit = Math.max(2, Math.ceil(title.length / 4) - totalWords);
    } else if (difficulty === 'madness') {
        hintLimit = 1;
    }

    let extraReveals = hintsUsed >= 2 ? hintsUsed - 2 : 0;
    const wordRevealedCounts = wordLengths.map(len => {
        if (hintsUsed < 2) return 0;
        let count = 1;
        const extraForThisWord = Math.min(extraReveals, len - 1);
        count += extraForThisWord;
        extraReveals -= extraForThisWord;
        return count;
    });

    const isTitleBlockRevealed = isGameOver || hintsUsed >= 1;

    return {
        charMetadata,
        wordRevealedCounts,
        hintLimit,
        isTitleBlockRevealed
    };
}

export default function SongGame({
    isDaily = false,
    isDailyGameOver = false,
    dailyGameState = null,
    dailyGuesses = [],
    onDailyGuess = null,
    extraSeconds: dailyExtraSeconds = 0,
    setExtraSeconds: setDailyExtraSeconds = null,
    onDailyHint = null,
    initialMode = 'rush',
    onModeChange = null
}) {
    const [mode, setMode] = useState(isDaily ? 'classic' : initialMode);
    const [gameState, setGameState] = useState(() => (isDaily ? null : createSongGame(deltaruneSoundtrack)));
    const [rushState, setRushState] = useState(() => (isDaily ? null : createSongRushGame(deltaruneSoundtrack)));
    const [soulColors, setSoulColors] = useState(() => getRandomSoulColors(RUSH_LIVES));
    const [rushHintsUsed, setRushHintsUsed] = useState({});
    const [input, setInput] = useState('');
    const [activeDifficulty, setActiveDifficulty] = useState('medium');
    const [guessedTitles, setGuessedTitles] = useState([]);
    const [guesses, setGuesses] = useState([]);
    const [isWon, setIsWon] = useState(false);
    const [isGivenUp, setIsGivenUp] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('victory');
    const [modalTarget, setModalTarget] = useState(null);
    const [modalRushStage, setModalRushStage] = useState(null);
    const [modalRushState, setModalRushState] = useState(null);
    const [isConfirmingGiveUp, setIsConfirmingGiveUp] = useState(false);
    const [hasPlayed, setHasPlayed] = useState(false);
    const [extraSeconds, setExtraSeconds] = useState(0);
    const [startTime, setStartTime] = useState(() => Date.now());

    // Rush mode feedback states
    const [flashPlay, setFlashPlay] = useState(false);
    const [flashInput, setFlashInput] = useState(false);
    const inputRef = useRef(null);
    const recentRushTitles = useRef([]);

    const { setIsHelpWidgetHidden } = useContext(HelpWidgetContext);

    const resetGame = useCallback(() => {
        setIsModalOpen(false);
        setIsConfirmingGiveUp(false);

        if (mode === 'rush') {
            // Track songs from the previous run to avoid immediate consecutive repeats
            const previousTitles = rushState?.stages?.map(s => s.target?.title).filter(Boolean) || [];
            recentRushTitles.current = [...recentRushTitles.current, ...previousTitles].slice(-20);
            setRushState(createSongRushGame(deltaruneSoundtrack, Math.random, recentRushTitles.current));
            setSoulColors(getRandomSoulColors(RUSH_LIVES));
        } else {
            setGameState(createSongGame(deltaruneSoundtrack));
        }
        setRushHintsUsed({});
        setGuessedTitles([]);
        setGuesses([]);
        setIsWon(false);
        setIsGivenUp(false);
        setHasPlayed(false);
        setExtraSeconds(0);
        setStartTime(Date.now());
        setInput('');
        setFlashPlay(false);
        setFlashInput(false);
        setModalTarget(null);
        setModalRushStage(null);
        setModalRushState(null);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    }, [mode, rushState?.stages]);

    const handleModeToggle = (newMode) => {
        if (newMode === mode) return;
        setMode(newMode);
        if (onModeChange) onModeChange(newMode);
        setIsModalOpen(false);
        setIsConfirmingGiveUp(false);
        setGuesses([]);
        setGuessedTitles([]);
        setIsWon(false);
        setIsGivenUp(false);
        setHasPlayed(false);
        setInput('');
        setStartTime(Date.now());
        setRushHintsUsed({});

        if (newMode === 'rush') {
            // Track songs from the previous run to avoid immediate consecutive repeats
            const previousTitles = rushState?.stages?.map(s => s.target?.title).filter(Boolean) || [];
            recentRushTitles.current = [...recentRushTitles.current, ...previousTitles].slice(-20);
            setRushState(createSongRushGame(deltaruneSoundtrack, Math.random, recentRushTitles.current));
            setSoulColors(getRandomSoulColors(RUSH_LIVES));
        } else {
            setGameState(createSongGame(deltaruneSoundtrack));
        }
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

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
    }, [isModalOpen, isDaily, resetGame]);

    const isRush = !isDaily && mode === 'rush';
    const activeGameState = isDaily ? dailyGameState : gameState;
    const activeGuesses = isDaily 
        ? dailyGuesses 
        : (isRush ? (rushState?.stages[rushState.currentStageIndex]?.guesses || []) : guesses);
    const activeGuessedTitles = isDaily 
        ? (dailyGameState?.guessedTitles || []) 
        : (isRush ? (rushState?.stages[rushState.currentStageIndex]?.guessedTitles || []) : guessedTitles);
    const activeExtraSeconds = isDaily ? dailyExtraSeconds : extraSeconds;
    const activeSetExtraSeconds = isDaily ? setDailyExtraSeconds : setExtraSeconds;
    const activeDiff = isDaily ? 'medium' : activeDifficulty;
    const isDailyWon = isDaily && activeGuesses?.some(g => g.title && g.title.correct);
    const isDailyLost = isDaily && activeGuesses?.length >= (DAILY_LIMITS?.songs || 10);
    const isDailyStageFinished = isDailyWon || isDailyLost;
    const activeIsGameOver = isDaily 
        ? (isDailyGameOver || isDailyStageFinished) 
        : (isRush ? (rushState?.status !== 'playing' || isGivenUp) : (isWon || isGivenUp));
    const activeIsWon = isDaily ? isDailyWon : (isRush ? rushState?.status === 'victory' : isWon);
    const activeIsGivenUp = isDaily ? isDailyLost : isGivenUp;

    // Current rush stage target
    const currentRushStage = isRush && rushState ? rushState.stages[rushState.currentStageIndex] : null;

    // Masked Title metadata for Classic Mode hint
    const title = activeGameState?.target?.title || "";
    const activeHintsUsed = activeGameState?.hintsUsed || 0;
    const {
        charMetadata,
        wordRevealedCounts,
        hintLimit,
        isTitleBlockRevealed
    } = computeMaskedTitleData(title, activeDiff, activeHintsUsed, activeIsGameOver);

    // Masked Title metadata for Rush Mode hint
    const currentRushStageIdx = rushState?.currentStageIndex || 0;
    const rushStageHintsUsed = rushHintsUsed[currentRushStageIdx] || 0;
    const rushTargetTitle = currentRushStage?.target?.title || "";
    const rushTargetDiff = currentRushStage?.id || "easy";
    const rushHintLimit = 5;
    const {
        charMetadata: rushCharMetadata,
        wordRevealedCounts: rushWordRevealedCounts,
        isTitleBlockRevealed: isRushTitleBlockRevealed
    } = computeMaskedTitleData(rushTargetTitle, rushTargetDiff, rushStageHintsUsed, activeIsGameOver);

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
        .filter(titleItem => !activeGuessedTitles.includes(titleItem.toUpperCase().trim()));

    const songsMap = Object.fromEntries(
        deltaruneSoundtrack.map(s => [s.title, s])
    );

    // Handles Classic Mode Guess
    const handleClassicGuess = (e, selectedTitle) => {
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
                    if (attempts <= RANK_POINTS.ATTEMPTS_THRESHOLD_FAST) points = RANK_POINTS.VICTORY_FAST_ATTEMPTS;
                    else if (attempts <= RANK_POINTS.ATTEMPTS_THRESHOLD_MEDIUM) points = RANK_POINTS.VICTORY_MEDIUM_ATTEMPTS;
                    else points = RANK_POINTS.VICTORY_SLOW_ATTEMPTS;

                    const duration = (Date.now() - startTime) / 1000;
                    if (duration < RANK_POINTS.SPEED_THRESHOLD_SECONDS) {
                        points += RANK_POINTS.SPEED_BONUS;
                    }

                    const paidPenalty = Math.max(0, activeHintsUsed - 1) * (RANK_POINTS.SONG_HINT_PENALTY || 10);
                    const finalPoints = Math.max(points, paidPenalty + 10);
                    addPoints(finalPoints, 'songs');
                }

                setModalTarget(gameState.target);
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

    // Handles Rush Mode Guess
    const handleRushGuess = (e, selectedTitle) => {
        if (e && e.preventDefault) e.preventDefault();
        const songToGuess = selectedTitle || input;
        if (!songToGuess || !songToGuess.trim()) return;
        if (!rushState || rushState.status !== 'playing') return;

        try {
            const result = makeSongRushGuess(rushState, songToGuess, deltaruneSoundtrack);
            if (result.isCorrect) {
                // Trigger instant flash animations
                setFlashPlay(true);
                setFlashInput(true);
                setTimeout(() => {
                    setFlashPlay(false);
                    setFlashInput(false);
                }, 450);

                // Auto-focus input without delay
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 60);

                setRushState(result.nextState);
                setHasPlayed(false);
                // Reset local guesses so the next stage starts with a clean history
                setGuesses([]);

                if (result.isRushClear) {
                    addPoints(result.nextState.totalScore, 'songs');
                    setModalRushState(result.nextState);
                    setTimeout(() => {
                        setModalType('rush_victory');
                        setIsModalOpen(true);
                    }, 500);
                }
            } else {
                setRushState(result.nextState);
                if (result.outcome) {
                    setGuesses(prev => [result.outcome, ...prev]);
                }
            }
        } catch (err) {
            console.error(err);
        }
        setInput('');
    };

    const handleRushHint = () => {
        if (!rushState || rushState.status !== 'playing' || !currentRushStage || !hasPlayed || activeIsGameOver) return;
        const currentStageIdx = rushState.currentStageIndex;
        const currentUsed = rushHintsUsed[currentStageIdx] || 0;
        if (currentUsed >= rushHintLimit) return;
        if (rushState.lives <= 0) return;

        setRushHintsUsed(prev => ({
            ...prev,
            [currentStageIdx]: currentUsed + 1
        }));
        setRushState(prev => ({
            ...prev,
            lives: Math.max(0, prev.lives - 1)
        }));
    };

    const handleRushSkip = () => {
        if (!hasPlayed || !rushState || rushState.status !== 'playing' || rushState.lives <= 0) return;
        const next = skipSongRushStage(rushState, deltaruneSoundtrack);
        setRushState(next);
        setHasPlayed(false);
        setInput('');
        // Clear local guesses for the skipped track
        setGuesses([]);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 60);
    };

    const handleGiveUpClick = () => {
        if (activeIsGameOver) return;
        if (isConfirmingGiveUp) {
            setIsGivenUp(true);
            setModalType(isRush ? 'rush_defeat' : 'surrender');
            if (isRush) {
                setModalRushStage(currentRushStage);
            } else {
                setModalTarget(gameState?.target);
            }
            setIsModalOpen(true);
            setIsConfirmingGiveUp(false);
        } else {
            setIsConfirmingGiveUp(true);
        }
    };

    const handleGuessAction = (e, selectedTitle) => {
        if (isDaily) {
            if (e && e.preventDefault) e.preventDefault();
            const songToGuess = selectedTitle || input;
            if (!songToGuess || !songToGuess.trim()) return;
            onDailyGuess(songToGuess);
            setInput('');
        } else if (isRush) {
            handleRushGuess(e, selectedTitle);
        } else {
            handleClassicGuess(e, selectedTitle);
        }
    };

    // Calculate duration for classic player
    const baseDuration = SONG_DIFFICULTIES[activeDiff]?.duration || 5.0;
    const actualStartTime = activeDiff === 'easy' ? 0 : (activeGameState ? activeGameState.startTime : 0);
    const maxPlayableDuration = activeGameState ? (activeGameState.target.duration_seconds - actualStartTime) : 99;
    const durationLimit = Math.min(
        maxPlayableDuration,
        baseDuration + activeExtraSeconds
    );
    const maxTimeReached = activeGameState ? durationLimit >= maxPlayableDuration : false;

    // Rush audio config
    const rushAudioUrl = currentRushStage ? currentRushStage.target.url : '';
    const rushDurationLimit = currentRushStage ? currentRushStage.duration : 5.0;
    const rushStartTime = currentRushStage ? (currentRushStage.startTime || 0) : 0;

    return (
        <Stack gap="md" align="center" w="100%">
            {/* Mode Switcher */}
            {!isDaily && (
                <div className={styles.modeSwitcherContainer}>
                    <Button
                        size="xs"
                        variant={mode === 'rush' ? 'filled' : 'subtle'}
                        color="emeraldGreen"
                        className={`${styles.modeButton} ${mode === 'rush' ? styles.modeButtonActive : ''}`}
                        onClick={() => handleModeToggle('rush')}
                        leftSection={<IconBolt size={14} />}
                    >
                        Rush
                    </Button>
                    <Button
                        size="xs"
                        variant={mode === 'classic' ? 'filled' : 'subtle'}
                        color="cyberCyan"
                        className={`${styles.modeButton} ${mode === 'classic' ? styles.modeButtonActive : ''}`}
                        onClick={() => handleModeToggle('classic')}
                        leftSection={<IconMusic size={14} />}
                    >
                        Classic
                    </Button>
                </div>
            )}

            {/* Give Up button */}
            {!activeIsGameOver && !isDaily && (
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

            {/* Stepper (Rush) or Difficulty Buttons (Classic) */}
            {!isDaily && (
                <DifficultySelector
                    activeDifficulty={activeDiff}
                    onChangeDifficulty={setActiveDifficulty}
                    disabled={activeIsGameOver || activeGuesses.length > 0 || hasPlayed}
                    isRushMode={isRush}
                    rushStages={rushState?.stages || []}
                    currentStageIndex={rushState?.currentStageIndex || 0}
                />
            )}

            {/* Rush Audio Player with Integrated Stage, Souls Overlay & Hint Clue */}
            {isRush && currentRushStage && (() => {
                const currentRushStageIdx = rushState?.currentStageIndex || 0;
                const isCurrentRushHintUsed = (rushHintsUsed[currentRushStageIdx] || 0) >= 1;

                let hintElement = null;
                if (isRushTitleBlockRevealed && currentRushStage.target) {
                    hintElement = (
                        <div className={styles.rushHintSection}>
                            <div className={styles.maskedTitleContainer}>
                                {rushTargetTitle.split('').map((char, index) => {
                                    const isLetter = /[a-zA-Z]/.test(char);
                                    if (isLetter) {
                                        const metadata = rushCharMetadata[index];
                                        const isRevealed = activeIsGameOver || (
                                            metadata && metadata.isLetter && metadata.wordIndex !== -1 && metadata.charIndexInWord < rushWordRevealedCounts[metadata.wordIndex]
                                        );

                                        let charClass = styles.maskedChar;
                                        if (isRevealed) {
                                            charClass += ` ${styles.revealedChar}`;
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
                            <Text size="xs" c="dimmed" className={styles.rushHintMeta}>
                                Chapter {currentRushStage.target.chapter} ({currentRushStage.target.duration_formatted})
                            </Text>
                        </div>
                    );
                }

                return (
                    <AudioPlayer
                        videoUrl={rushAudioUrl}
                        startTime={rushStartTime}
                        durationLimit={rushDurationLimit}
                        disabled={activeIsGameOver}
                        onPlay={() => setHasPlayed(true)}
                        isRushMode={true}
                        autoPlay={false}
                        flashPlayButton={flashPlay}
                        difficultyColor={currentRushStage.hexColor || '#00ff27'}
                        rushStageIndex={rushState.currentStageIndex}
                        rushStagesCount={rushState.stages.length}
                        rushLives={rushState.lives}
                        soulColors={soulColors}
                        rushExtraControl={null}
                        rushHintContent={hintElement}
                    />
                );
            })()}

            {/* Classic / Daily Audio Player & Unified Panel */}
            {!isRush && activeGameState && (
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
                        hasPlayed={hasPlayed}
                        difficultyColor={DIFFICULTY_HEX[activeDiff] || '#ffd43b'}
                        extraControl={
                            !activeIsGameOver && (
                                <button
                                    type="button"
                                    onClick={handleRequestHint}
                                    disabled={!hasPlayed || activeHintsUsed >= hintLimit}
                                    className={styles.arcadeHintBtn}
                                    title={activeHintsUsed >= hintLimit ? "No hints remaining" : "Request a hint"}
                                >
                                    <IconBulb size={15} />
                                    <span>Hint</span>
                                    {hintLimit > 1 && (
                                        <span className={styles.pillHintCount}>
                                            ({activeHintsUsed}/{hintLimit})
                                        </span>
                                    )}
                                </button>
                            )
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

            {/* Autocomplete Search Bar */}
            {!activeIsGameOver && (
                <SongSearchBar
                    data={songOptions}
                    songsMap={songsMap}
                    input={input}
                    setInput={setInput}
                    handleGuess={handleGuessAction}
                    placeholder={isRush ? "Search songs..." : "Type a song title"}
                    inputRef={inputRef}
                    isSuccessFlashing={flashInput}
                    rightAction={
                        isRush ? (
                            <div className={styles.rushLifelinesGroup}>
                                <button
                                    type="button"
                                    onClick={handleRushHint}
                                    disabled={
                                        !hasPlayed || 
                                        (rushStageHintsUsed >= rushHintLimit) || 
                                        rushState?.lives <= 0 ||
                                        activeIsGameOver
                                    }
                                    className={styles.arcadeHintBtn}
                                    title={
                                        rushStageHintsUsed >= rushHintLimit
                                            ? "No hints remaining for this stage"
                                            : (!hasPlayed ? "Play snippet first" : "Spend 1 life for a hint")
                                    }
                                >
                                    <IconBulb size={15} />
                                    <span>Hint</span>
                                </button>
                                <button
                                    type="button"
                                    className={styles.rushSkipBtn}
                                    onClick={handleRushSkip}
                                    disabled={!hasPlayed || (rushState?.lives <= 0) || activeIsGameOver}
                                    title={!hasPlayed ? "Play snippet first" : "Skip this song (-1 life)"}
                                >
                                    <span>▷| Skip</span>
                                </button>
                            </div>
                        ) : null
                    }
                />
            )}

            {/* Modals */}
            {!isDaily && (
                <Modal
                    opened={isModalOpen}
                    onClose={resetGame}
                    withCloseButton={false}
                    centered
                    size={580}
                    transitionProps={{ duration: 0 }}
                    classNames={{
                        content: styles.modalContent,
                        header: styles.modalHeader
                    }}
                    title={
                        <ModalHeader
                            title={modalType.includes('victory') 
                                ? (isRush ? 'RUSH CLEAR!' : 'Victory!') 
                                : (isRush ? 'RUSH OVER' : 'Game Over')}
                            isVictory={modalType.includes('victory')}
                            onPlayAgain={resetGame}
                            onClose={() => setIsModalOpen(false)}
                            playAgainTooltip={"Play Again (Enter)"}
                        />
                    }
                >
                    <Stack align="center" gap="md" p="md">
                        <img 
                            src={jevilGif} 
                            alt="Jevil Mascot" 
                            className={styles.mascotGif} 
                        />

                        {/* Rush Victory Details */}
                        {modalType === 'rush_victory' && (modalRushState || rushState) && (
                            <>
                                <Text size="lg" ta="center">
                                    Congratulations! You guessed the songs!
                                </Text>
                                <Paper className={`${styles.targetCard} ${styles.targetCardWon}`} withBorder mt="xs">
                                    <div style={{ width: '100%' }}>
                                        {(modalRushState || rushState).stages.map((stg) => (
                                            <Group key={stg.id} justify="space-between" py={6} className={styles.stageBreakdownRow}>
                                                <Text size="xs" fw="bold" style={{ color: stg.hexColor }}>
                                                    {stg.label}
                                                </Text>
                                                <Text size="xs" fw="bold" ta="right">
                                                    {stg.target.title}
                                                </Text>
                                            </Group>
                                        ))}
                                    </div>
                                </Paper>
                            </>
                        )}

                        {/* Rush Defeat Details */}
                        {modalType === 'rush_defeat' && (modalRushStage?.target || currentRushStage?.target) && (
                            <>
                                <Text size="lg" ta="center">
                                    Too bad! The secret song was:
                                </Text>
                                <Paper className={styles.targetCard} withBorder mt="xs">
                                    <Text className={styles.modalTextTitle}>
                                        {(modalRushStage || currentRushStage).target.title}
                                    </Text>
                                    <Text className={styles.modalTextSubtitle}>
                                        Chapter {(modalRushStage || currentRushStage).target.chapter} ({(modalRushStage || currentRushStage).target.duration_formatted})
                                    </Text>
                                    <iframe
                                        src={`https://www.youtube.com/embed/${getYouTubeId((modalRushStage || currentRushStage).target.url)}?autoplay=1&controls=1`}
                                        title={(modalRushStage || currentRushStage).target.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className={styles.modalIframe}
                                    />
                                </Paper>
                            </>
                        )}

                        {/* Classic Mode Modal Details */}
                        {!modalType.startsWith('rush_') && (
                            <>
                                <Text size="lg" ta="center">
                                    {modalType === 'victory'
                                        ? "Congratulations! You guessed the song!"
                                        : "Too bad! The secret song was:"}
                                </Text>

                                {(modalTarget || gameState?.target) && (
                                    <Paper className={`${styles.targetCard} ${modalType === 'victory' ? styles.targetCardWon : ''}`} withBorder>
                                        <Text className={styles.modalTextTitle}>
                                            {(modalTarget || gameState.target).title}
                                        </Text>
                                        <Text className={styles.modalTextSubtitle}>
                                            Chapter {(modalTarget || gameState.target).chapter} ({(modalTarget || gameState.target).duration_formatted})
                                        </Text>
                                        <iframe
                                            src={`https://www.youtube.com/embed/${getYouTubeId((modalTarget || gameState.target).url)}?autoplay=1&controls=1`}
                                            title={(modalTarget || gameState.target).title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className={styles.modalIframe}
                                        />
                                    </Paper>
                                )}
                            </>
                        )}
                    </Stack>
                </Modal>
            )}

            <GuessHistory guesses={activeGuesses.slice(0, 15)} />
        </Stack>
    );
}
