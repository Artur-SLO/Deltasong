import { Stack, Text, Paper, Button, Group } from '@mantine/core';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCopy, IconClock, IconDownload, IconCheck, IconX } from '@tabler/icons-react';
import { getDailyNumber } from '../../core/dailySeed.js';
import classes from '../../styles/Daily.module.css';
import { DAILY_LIMITS } from '../../config/Constants.js';
import { getCharacterImage } from '../../utils/image.js';
import pinkGif from '../../assets/images/pink.gif';
import jackensteinGif from '../../assets/images/jackenstein.gif';
import mizzleGif from '../../assets/images/mizzle.gif';
import seamGif from '../../assets/images/seam.gif';


export default function DailyResultsView({ gameState }) {
    const [timeLeft, setTimeLeft] = useState('');

    function formatDuration(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const midnight = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1,
                0, 0, 0, 0
            );
            const diff = midnight.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('00:00:00');
                return;
            }

            const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
            const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
            const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
            setTimeLeft(`${hours}:${minutes}:${seconds}`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!gameState) return null;

    const dailyNum = getDailyNumber(gameState.date);
    const isVictory = gameState.status === 'victory';
    const timeSpent = (gameState.endTime || gameState.startTime) - gameState.startTime;
    const durationStr = formatDuration(gameState.elapsedTime || timeSpent || 0);

    const charGuesses = gameState.guesses.characters.length;
    const itemGuesses = gameState.guesses.items.length;
    const songGuesses = gameState.guesses.songs.length;

    const charLimit = DAILY_LIMITS.characters;
    const itemLimit = DAILY_LIMITS.items;
    const songLimit = DAILY_LIMITS.songs;

    const charScore = (gameState.stageResults?.characters !== null || isVictory || gameState.status === 'defeat')
        ? `${charGuesses}/${charLimit}`
        : `-/${charLimit}`;

    const itemScore = (gameState.stageResults?.items !== null || isVictory || gameState.status === 'defeat')
        ? `${itemGuesses}/${itemLimit}`
        : `-/${itemLimit}`;

    const songScore = (gameState.stageResults?.songs !== null || isVictory || gameState.status === 'defeat')
        ? `${songGuesses}/${songLimit}`
        : `-/${songLimit}`;

    const handleCopy = () => {
        const text = `Deltasong Daily #${dailyNum} (${isVictory ? 'Victory' : 'Defeat'}) - Time: ${durationStr}\n` +
            `Characters: ${charScore}\n` +
            `Items: ${itemScore}\n` +
            `Song: ${songScore}\n` +
            `${window.location.origin}`;

        navigator.clipboard.writeText(text).then(() => {
            notifications.show({
                title: 'Copied!',
                message: 'Results copied to clipboard.',
                color: 'emeraldGreen'
            });
        }).catch(err => {
            console.error('Failed to copy', err);
        });
    };

    const handleDownloadImage = async () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 460;
        const ctx = canvas.getContext('2d');

        // Helper to load image as a Promise
        const loadImage = (src) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null); // Resolve null if failed to load
            });
        };

        // Determine which assets to load
        const leftAsset = mizzleGif;
        const rightAsset = mizzleGif;

        // Load images in parallel
        const [leftImg, rightImg] = await Promise.all([
            loadImage(leftAsset),
            loadImage(rightAsset)
        ]);

        // Draw Background
        ctx.fillStyle = '#130920'; // Cosmic dark purple
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw a subtle neon glow border
        ctx.strokeStyle = isVictory ? '#00ff27' : '#ff1f8e'; // Green for win, Magenta for loss
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

        // Draw Title
        ctx.font = '900 24px "Outfit", "Inter", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('DELTASONG DAILY CHALLENGE', canvas.width / 2, 50);

        // Draw Subtitle
        ctx.font = '600 15px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(`Daily Challenge #${dailyNum}`, canvas.width / 2, 80);

        // Draw Status Badge/Banner
        const bannerY = 105;
        const bannerH = 40;
        ctx.fillStyle = isVictory ? 'rgba(0, 255, 39, 0.2)' : 'rgba(255, 31, 142, 0.2)';
        ctx.fillRect(8, bannerY, canvas.width - 16, bannerH);

        ctx.strokeStyle = isVictory ? '#00ff27' : '#ff1f8e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(8, bannerY);
        ctx.lineTo(canvas.width - 8, bannerY);
        ctx.moveTo(8, bannerY + bannerH);
        ctx.lineTo(canvas.width - 8, bannerY + bannerH);
        ctx.stroke();

        ctx.font = 'bold 20px "Outfit", "Inter", sans-serif';
        ctx.fillStyle = isVictory ? '#00ff27' : '#ff1f8e';
        ctx.textAlign = 'center';
        ctx.fillText(isVictory ? 'VICTORY' : 'DEFEAT', canvas.width / 2, bannerY + 27);

        // Draw Stats Box
        const boxX = 140;
        const boxY = 165;
        const boxW = 320;
        const boxH = 180;

        ctx.fillStyle = 'rgba(31, 15, 51, 0.6)'; // Semi-transparent card body
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Draw Stats Row
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px monospace';
        const rows = [
            { label: 'TOTAL TIME', value: durationStr },
            { label: 'CHARACTERS', value: `${charScore} (${formatDuration(gameState.elapsedTimes?.characters || 0)})` },
            { label: 'ITEMS', value: `${itemScore} (${formatDuration(gameState.elapsedTimes?.items || 0)})` },
            { label: 'SONGS', value: `${songScore} (${formatDuration(gameState.elapsedTimes?.songs || 0)})` },
        ];

        let itemY = boxY + 40;
        rows.forEach(row => {
            ctx.textAlign = 'left';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText(row.label, boxX + 24, itemY);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(row.value, boxX + boxW - 24, itemY);

            // Draw a separator line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(boxX + 20, itemY + 12);
            ctx.lineTo(boxX + boxW - 20, itemY + 12);
            ctx.stroke();

            itemY += 35;
        });

        // Helper to draw image keeping original aspect ratio
        const drawKeepRatio = (img, x, y, maxW, maxH, alignRight = false, flipHorizontal = false) => {
            const ratio = Math.min(maxW / img.width, maxH / img.height);
            const w = img.width * ratio;
            const h = img.height * ratio;

            const targetX = alignRight ? x + (maxW - w) : x;
            const targetY = y + (maxH - h); // align to bottom

            if (flipHorizontal) {
                ctx.save();
                ctx.translate(targetX + w / 2, targetY + h / 2);
                ctx.scale(-1, 1);
                ctx.drawImage(img, -w / 2, -h / 2, w, h);
                ctx.restore();
            } else {
                ctx.drawImage(img, targetX, targetY, w, h);
            }
        };

        // Draw left mascot (flipped horizontally to face center)
        if (leftImg) {
            drawKeepRatio(leftImg, 20, canvas.height - 145, 110, 110, false, true);
        }

        // Draw right mascot
        if (rightImg) {
            drawKeepRatio(rightImg, canvas.width - 130, canvas.height - 145, 110, 110, true, false);
        }

        // Draw footer watermark
        ctx.textAlign = 'center';
        ctx.font = '12px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillText(window.location.origin.replace(/^https?:\/\//, ''), canvas.width / 2, 420);

        // Download link
        const link = document.createElement('a');
        link.download = `deltasong-daily-${dailyNum}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        notifications.show({
            title: 'Success!',
            message: 'Results image downloaded.',
            color: 'emeraldGreen'
        });
    };

    const charWon = gameState.stageResults?.characters === 'victory';
    const itemWon = gameState.stageResults?.items === 'victory';
    const songWon = gameState.stageResults?.songs === 'victory';

    return (
        <Stack align="center" gap="lg" w="100%">
            <div className={classes.mascotRow}>
                <div className={`${classes.mascotContainer} ${charWon ? '' : classes.mascotLocked}`}>
                    <img src={pinkGif} alt="Pink" />
                    <div className={`${classes.mascotBadge} ${charWon ? classes.mascotBadgeVictory : classes.mascotBadgeDefeat}`}>
                        {charWon ? <IconCheck size={12} stroke={3} /> : <IconX size={12} stroke={3} />}
                    </div>
                    <Text size="xs" fw="bold" ta="center">Characters</Text>
                </div>
                <div className={`${classes.mascotContainer} ${itemWon ? '' : classes.mascotLocked}`}>
                    <img src={seamGif} alt="Seam" />
                    <div className={`${classes.mascotBadge} ${itemWon ? classes.mascotBadgeVictory : classes.mascotBadgeDefeat}`}>
                        {itemWon ? <IconCheck size={12} stroke={3} /> : <IconX size={12} stroke={3} />}
                    </div>
                    <Text size="xs" fw="bold" ta="center">Items</Text>
                </div>
                <div className={`${classes.mascotContainer} ${songWon ? '' : classes.mascotLocked}`}>
                    <img src={jackensteinGif} alt="Jackenstein" />
                    <div className={`${classes.mascotBadge} ${songWon ? classes.mascotBadgeVictory : classes.mascotBadgeDefeat}`}>
                        {songWon ? <IconCheck size={12} stroke={3} /> : <IconX size={12} stroke={3} />}
                    </div>
                    <Text size="xs" fw="bold" ta="center">Song</Text>
                </div>
            </div>

            <Paper className={classes.resultsCard}>
                <div className={classes.resultsTitle} style={{ color: 'var(--mantine-color-amberGold-5)' }}>
                    Correct Answers
                </div>
                    <div className={classes.resultsRow}>
                        <Text size="sm" fw="bold">Secret Character</Text>
                        <Group gap="xs" align="center">
                            {gameState.characterState.target.image && (
                                <img
                                    src={getCharacterImage(gameState.characterState.target.image)}
                                    alt={gameState.characterState.target.name}
                                    style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'contain' }}
                                />
                            )}
                            <Text size="sm">{gameState.characterState.target.name}</Text>
                        </Group>
                    </div>
                    <div className={classes.resultsRow}>
                        <Text size="sm" fw="bold">Secret Item</Text>
                        <Group gap="xs" align="center">
                            {gameState.itemState.target.image && (
                                <img
                                    src={gameState.itemState.target.image}
                                    alt={gameState.itemState.target.name}
                                    style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'contain' }}
                                />
                            )}
                            <Text size="sm">{gameState.itemState.target.name}</Text>
                        </Group>
                    </div>
                    <div className={classes.resultsRow} style={{ borderBottom: 'none' }}>
                        <Text size="sm" fw="bold">Secret Song</Text>
                        <Text size="sm" ta="right">
                            {gameState.songState.target.title} (Ch {gameState.songState.target.chapter})
                        </Text>
                    </div>
                </Paper>

                <div className={classes.countdownContainer}>
                    <div className={classes.countdownLabel}>
                        NEXT CHALLENGE
                    </div>
                    <Group gap="xs">
                        <IconClock size={20} color="var(--mantine-color-amberGold-5)" />
                        <div className={classes.countdownTimer}>
                            {timeLeft}
                        </div>
                    </Group>
                </div>

                <Paper className={classes.resultsCard}>
                    <div className={classes.resultsTitle}>
                        {isVictory ? 'Victory Statistics' : 'Statistics'}
                    </div>
                    <div className={classes.resultsRow}>
                        <Text size="sm" className={classes.timerText}>Total Time</Text>
                        <Text size="sm" fw="bold" className={classes.timerText}>{durationStr}</Text>
                    </div>
                    <div className={classes.resultsRow}>
                        <Text size="sm">Daily Challenge</Text>
                        <Text size="sm" fw="bold">#{dailyNum}</Text>
                    </div>
                    <div className={classes.resultsRow}>
                        <Text size="sm">Status</Text>
                        <Text size="sm" fw="bold" color={isVictory ? 'emeraldGreen' : 'royalMagenta'}>
                            {isVictory ? 'Victory' : 'Defeat'}
                        </Text>
                    </div>
                    <div className={classes.resultsRow}>
                        <Text size="sm">Characters guesses</Text>
                        <Text size="sm" fw="bold">{charScore}</Text>
                    </div>
                    <div className={classes.resultsRow}>
                        <Text size="sm">Items guesses</Text>
                        <Text size="sm" fw="bold">{itemScore}</Text>
                    </div>
                    <div className={classes.resultsRow}>
                        <Text size="sm">Song guesses</Text>
                        <Text size="sm" fw="bold">{songScore}</Text>
                    </div>
                </Paper>

                <Group gap="md" className={classes.stagger5}>
                    <Button
                        leftSection={<IconCopy size={16} />}
                        color="emeraldGreen"
                        onClick={handleCopy}
                        className={classes.shareButton}
                        size="sm"
                    >
                        Copy
                    </Button>

                    <Button
                        leftSection={<IconDownload size={16} />}
                        color="spadeBlue"
                        onClick={handleDownloadImage}
                        className={classes.shareButton}
                        size="sm"
                    >
                        Download Image
                    </Button>
                </Group>
            </Stack>
        );
}
