import { useEffect, useRef, useState } from 'react';
import { Group, Button, Text } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconPlus } from '@tabler/icons-react';
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

export default function AudioPlayer({ videoUrl, startTime, durationLimit, disabled, onPlay, onAddTime, maxTimeReached, isClueAvailable }) {
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
                    autoplay: 0,
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
                            event.target.pauseVideo();
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
    }, [videoUrl, startTime]);

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

    return (
        <div className={styles.playerContainer}>
            {/* Hidden container where YT Iframe is instantiated */}
            <div className={styles.hiddenIframeContainer}>
                <div id={playerDivId} />
            </div>

            <div className={styles.progressContainer} onClick={handleSliderClick}>
                <div ref={progressFillRef} className={styles.progressFill} />
            </div>

            <div className={styles.playerControls}>
                <Group gap="md">
                    {!isPlaying ? (
                        <Button
                            leftSection={<IconPlayerPlay size={16} />}
                            onClick={handlePlay}
                            disabled={disabled || !playerReady}
                            color="emeraldGreen"
                            variant="light"
                            className={styles.playerBtn}
                        >
                            Play
                        </Button>
                    ) : (
                        <Button
                            leftSection={<IconPlayerPause size={16} />}
                            onClick={handlePause}
                            disabled={disabled || !playerReady}
                            color="royalMagenta"
                            variant="light"
                            className={styles.playerBtn}
                        >
                            Pause
                        </Button>
                    )}
                    {isClueAvailable && (
                        <Button
                            leftSection={<IconPlus size={16} />}
                            onClick={handleAddTime}
                            disabled={disabled || !playerReady || isMaxReached}
                            color="cyberCyan"
                            variant="light"
                            className={styles.playerBtn}
                        >
                            +1s Clue
                        </Button>
                    )}
                </Group>
            </div>

            <div className={styles.timeDisplay}>
                <Text size="sm" ff="var(--mantine-font-family)">
                    {!playerReady 
                        ? "Loading Audio..." 
                        : `${formatTime(elapsedTime)} / ${formatTime(effectiveDurationLimit)}`
                    }
                </Text>
            </div>
        </div>
    );
}
