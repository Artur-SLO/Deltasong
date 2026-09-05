import { useEffect, useRef, useState } from 'react';
import { Group, Button, Text } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconPlus } from '@tabler/icons-react';
import Soul from '../Common/Soul.jsx';
import styles from '../../styles/Song.module.css';

// Helper to extract YouTube video ID from URL
function getYouTubeId(url) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
}

// Global promise to load the YouTube Iframe API only once
let apiPromise = null;
function loadYouTubeIFrameAPI() {
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve) => {
        if (window.YT && window.YT.Player) {
            resolve(window.YT);
            return;
        }

        const previousCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (previousCallback) previousCallback();
            resolve(window.YT);
        };

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    });
    return apiPromise;
}

export default function AudioPlayer({ 
    videoUrl, 
    startTime, 
    durationLimit, 
    disabled, 
    onPlay, 
    onAddTime, 
    maxTimeReached, 
    isClueAvailable, 
    hasPlayed = false,
    extraControl = null, 
    timeDisplayOverride = null,
    isRushMode = false,
    autoPlay = false,
    flashPlayButton = false,
    difficultyColor = '#00ff27',
    rushStageIndex = 0,
    rushStagesCount = 4,
    rushLives = 5,
    soulColors = [],
    rushExtraControl = null,
    rushHintContent = null
}) {
    const [playerReady, setPlayerReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    const playerRef = useRef(null);
    const progressFillRef = useRef(null);
    const playerDivId = 'yt-hidden-player';

    // Calculate real video limits on render
    const videoDuration = playerReady && playerRef.current && typeof playerRef.current.getDuration === 'function'
        ? playerRef.current.getDuration()
        : 0;

    const maxPlayable = videoDuration > 0 ? (videoDuration - startTime) : durationLimit;
    const effectiveDurationLimit = Math.min(durationLimit, maxPlayable);
    const isMaxReached = effectiveDurationLimit >= maxPlayable;

    // (Re)initialize player when videoUrl or startTime changes
    useEffect(() => {
        let active = true;
        let playerInstance = null;

        setPlayerReady(false);
        setIsPlaying(false);
        setElapsedTime(0);
        if (progressFillRef.current) {
            progressFillRef.current.style.width = '0%';
        }

        loadYouTubeIFrameAPI().then((YT) => {
            if (!active) return;

            const videoId = getYouTubeId(videoUrl);
            if (!videoId) return;

            playerInstance = new YT.Player(playerDivId, {
                videoId: videoId,
                height: '0',
                width: '0',
                playerVars: {
                    autoplay: autoPlay ? 1 : 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    origin: window.location.origin
                },
                events: {
                    onReady: (event) => {
                        if (active) {
                            setPlayerReady(true);
                            event.target.seekTo(startTime, true);
                            if (autoPlay) {
                                try {
                                    event.target.playVideo();
                                    setIsPlaying(true);
                                    if (onPlay) onPlay();
                                } catch (e) {
                                    console.error("Autoplay trigger error", e);
                                }
                            } else {
                                event.target.pauseVideo();
                            }
                        }
                    },
                    onStateChange: (event) => {
                        if (!active) return;
                        if (event.data === YT.PlayerState.PLAYING) {
                            setIsPlaying(true);
                        } else {
                            setIsPlaying(false);
                        }
                    }
                }
            });
            playerRef.current = playerInstance;
        });

        return () => {
            active = false;
            if (playerInstance && typeof playerInstance.destroy === 'function') {
                try {
                    playerInstance.destroy();
                } catch (e) {
                    console.error("Error destroying YT player", e);
                }
            }
            playerRef.current = null;
        };
    }, [videoUrl, startTime, autoPlay]);

    // Handle precise playback cutoff and progress bar update
    useEffect(() => {
        let intervalId = null;

        if (isPlaying && playerRef.current && playerReady) {
            intervalId = setInterval(() => {
                if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;

                try {
                    const currentTime = playerRef.current.getCurrentTime();
                    const elapsed = currentTime - startTime;

                    if (elapsed >= effectiveDurationLimit) {
                        playerRef.current.pauseVideo();
                        playerRef.current.seekTo(startTime, true);
                        setElapsedTime(0);
                        setIsPlaying(false);
                        if (progressFillRef.current) {
                            progressFillRef.current.style.width = '0%';
                        }
                    } else {
                        const currentElapsed = Math.max(0, elapsed);
                        setElapsedTime(currentElapsed);
                        if (progressFillRef.current) {
                            const percent = (currentElapsed / effectiveDurationLimit) * 100;
                            progressFillRef.current.style.width = `${percent}%`;
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
            }, 50);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isPlaying, playerReady, startTime, effectiveDurationLimit]);

    const handlePlay = () => {
        if (disabled || !playerReady || !playerRef.current) return;
        try {
            playerRef.current.playVideo();
            if (onPlay) onPlay();
        } catch (e) {
            console.error(e);
        }
    };

    const handlePause = () => {
        if (disabled || !playerReady || !playerRef.current) return;
        try {
            playerRef.current.pauseVideo();
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddTime = () => {
        if (disabled || !playerReady || !playerRef.current) return;
        try {
            playerRef.current.pauseVideo();
            playerRef.current.seekTo(startTime, true);
            setIsPlaying(false);
            setElapsedTime(0);
            if (progressFillRef.current) {
                progressFillRef.current.style.width = '0%';
            }
            if (onAddTime) onAddTime();
        } catch (e) {
            console.error(e);
        }
    };

    const handleSliderClick = (e) => {
        if (disabled || !playerReady || !playerRef.current) return;
        try {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const percentage = Math.max(0, Math.min(1, clickX / width));
            const targetSeekTime = percentage * effectiveDurationLimit;

            playerRef.current.seekTo(startTime + targetSeekTime, true);
            setElapsedTime(targetSeekTime);
            if (progressFillRef.current) {
                progressFillRef.current.style.width = `${percentage * 100}%`;
            }
        } catch (err) {
            console.error(err);
        }
    };

    const formatTime = (time) => {
        return time.toFixed(1) + 's';
    };

    if (isRushMode) {
        return (
            <div className={styles.rushPlayerWrapper}>
                {/* Hidden container where YT Iframe is instantiated */}
                <div className={styles.hiddenIframeContainer}>
                    <div id={playerDivId} />
                </div>

                {/* Undertale Soul Hearts Header */}
                <div className={styles.rushHeartsHeader}>
                    <div className={styles.rushHeartsContainer}>
                        {soulColors.map((color, idx) => (
                            <Soul
                                key={idx}
                                color={color}
                                isAlive={idx < rushLives}
                                size={22}
                            />
                        ))}
                    </div>
                </div>

                <div className={styles.progressContainer} onClick={handleSliderClick}>
                    <div ref={progressFillRef} className={styles.progressFill} style={{ '--glow-color': difficultyColor }} />
                </div>

                <div className={styles.rushCenterPlayGroup}>
                    <div className={styles.rushProgressChip}>
                        <span 
                            className={`${styles.rushStatusDot} ${isPlaying ? styles.rushStatusDotActive : ''}`}
                            style={isPlaying ? { '--glow-color': difficultyColor } : undefined}
                        />
                        <span className={styles.rushProgressText}>
                            {elapsedTime.toFixed(1)}s / {effectiveDurationLimit.toFixed(1)}s
                        </span>
                    </div>

                    <button
                        type="button"
                        className={`${styles.rushBigPlayBtn} ${flashPlayButton ? styles.flashPlay : ''}`}
                        onClick={isPlaying ? handlePause : handlePlay}
                        disabled={disabled || !playerReady}
                        aria-label={isPlaying ? "Pause" : "Play"}
                        style={{ '--glow-color': difficultyColor }}
                    >
                        {isPlaying ? (
                            <IconPlayerPause size={42} color="#000000" fill="#000000" />
                        ) : (
                            <IconPlayerPlay size={42} color="#000000" fill="#000000" style={{ marginLeft: 4 }} />
                        )}
                    </button>

                    <div className={styles.rushRightSpacer}>
                        {rushExtraControl}
                    </div>
                </div>

                {rushHintContent}
            </div>
        );
    }

    return (
        <div className={styles.playerContainer}>
            {/* Hidden container where YT Iframe is instantiated */}
            <div className={styles.hiddenIframeContainer}>
                <div id={playerDivId} />
            </div>

            <div className={styles.progressContainer} onClick={handleSliderClick}>
                <div 
                    ref={progressFillRef} 
                    className={styles.progressFill} 
                    style={{ '--glow-color': difficultyColor }} 
                />
            </div>

            <div className={styles.rushCenterPlayGroup}>
                {/* Left: Progress chip */}
                <div className={styles.rushProgressChip}>
                    <span 
                        className={`${styles.rushStatusDot} ${isPlaying ? styles.rushStatusDotActive : ''}`}
                        style={isPlaying ? { '--glow-color': difficultyColor } : undefined}
                    />
                    <span className={styles.rushProgressText}>
                        {!playerReady 
                            ? "Loading..." 
                            : (timeDisplayOverride || `${elapsedTime.toFixed(1)}s / ${effectiveDurationLimit.toFixed(1)}s`)}
                    </span>
                </div>

                {/* Center: Big circular play button with difficulty color & glow */}
                <button
                    type="button"
                    className={`${styles.rushBigPlayBtn} ${flashPlayButton ? styles.flashPlay : ''}`}
                    onClick={isPlaying ? handlePause : handlePlay}
                    disabled={disabled || !playerReady}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    style={{ '--glow-color': difficultyColor }}
                >
                    {isPlaying ? (
                        <IconPlayerPause size={42} color="#000000" fill="#000000" />
                    ) : (
                        <IconPlayerPlay size={42} color="#000000" fill="#000000" style={{ marginLeft: 4 }} />
                    )}
                </button>

                {/* Right: Actions (Clue + Hint) */}
                <div className={styles.classicRightActions}>
                    {isClueAvailable && (
                        <button
                            type="button"
                            onClick={handleAddTime}
                            disabled={disabled || !playerReady || maxTimeReached || !hasPlayed}
                            className={styles.arcadeClueBtn}
                            title={
                                !hasPlayed
                                    ? "Play snippet first"
                                    : (maxTimeReached ? "Maximum snippet duration reached" : "Add 1 second to snippet duration")
                            }
                        >
                            <IconPlus size={14} />
                            <span>+1s</span>
                        </button>
                    )}
                    {extraControl}
                </div>
            </div>
        </div>
    );
}
