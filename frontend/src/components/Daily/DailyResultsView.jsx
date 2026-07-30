import { Stack, Text, Paper, Button, Group } from '@mantine/core';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCopy, IconClock, IconDownload } from '@tabler/icons-react';
import { getDailyNumber } from '../../core/dailySeed.js';
import classes from '../../styles/Daily.module.css';
import { DAILY_LIMITS } from '../../config/Constants.js';
import { getCharacterImage } from '../../utils/image.js';
import spamtonGif from '../../assets/spamton.gif';
import pinkGif from '../../assets/pink.gif';
import jackensteinGif from '../../assets/jackenstein.gif';


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
    const durationStr = formatDuration(timeSpent);

    const charGuesses = gameState.guesses.characters.length;
    const itemGuesses = gameState.guesses.items.length;
    const songGuesses = gameState.guesses.songs.length;

    const charLimit = DAILY_LIMITS.characters;
    const itemLimit = DAILY_LIMITS.items;
    const songLimit = DAILY_LIMITS.songs;

    const charScore = (gameState.currentStep > 1 || isVictory || (gameState.status === 'defeat' && gameState.currentStep === 1))
        ? `${charGuesses}/${charLimit}`
        : `-/${charLimit}`;

    const itemScore = (gameState.currentStep > 2 || isVictory || (gameState.status === 'defeat' && gameState.currentStep === 2))
        ? `${itemGuesses}/${itemLimit}`
        : `-/${itemLimit}`;

    const songScore = (isVictory || (gameState.status === 'defeat' && gameState.currentStep === 3))
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

    const handleDownloadImage = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 420;
        const ctx = canvas.getContext('2d');

        // Draw Background
        ctx.fillStyle = '#1f0f33';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw border
        ctx.strokeStyle = '#783cb5';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

        // Draw Title
        ctx.font = 'bold 24px Roboto, sans-serif';
        ctx.fillStyle = '#ffb000'; // Gold title
        ctx.textAlign = 'center';
        ctx.fillText('DELTASONG DAILY CHALLENGE', canvas.width / 2, 60);

        // Draw Subtitle
        ctx.font = '16px Roboto, sans-serif';
        ctx.fillStyle = '#f0f0f0';
        ctx.fillText(`Daily Challenge #${dailyNum}`, canvas.width / 2, 95);

        // Draw status line
        ctx.font = 'bold 18px Roboto, sans-serif';
        ctx.fillText('Status:', 80, 150);
        ctx.textAlign = 'right';
        if (isVictory) {
            ctx.fillStyle = '#00ff27'; // green
            ctx.fillText('Victory', canvas.width - 80, 150);
        } else {
            ctx.fillStyle = '#ff1f8e'; // magenta
            ctx.fillText('Defeat', canvas.width - 80, 150);
        }

        // Draw table rows
        ctx.fillStyle = '#f0f0f0';
        ctx.font = '16px Roboto, sans-serif';
        const rows = [
            { label: 'Total Time', value: durationStr },
            { label: 'Characters guesses', value: charScore },
            { label: 'Items guesses', value: itemScore },
            { label: 'Song guesses', value: songScore }
        ];

        let y = 195;
        rows.forEach(row => {
            ctx.textAlign = 'left';
            ctx.fillText(row.label, 80, y);
            ctx.textAlign = 'right';
            ctx.fillText(row.value, canvas.width - 80, y);
            y += 35;
        });

        // Draw footer watermark
        ctx.textAlign = 'center';
        ctx.font = '12px Roboto, sans-serif';
        ctx.fillStyle = 'rgba(240, 240, 240, 0.4)';
        ctx.fillText(window.location.origin.replace(/^https?:\/\//, ''), canvas.width / 2, 380);

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

    return (
        <Stack align="center" gap="lg" w="100%">
            {isVictory ? (
                <div className={classes.victoryMascotRow}>
                    <img src={pinkGif} alt="Pink" className={classes.resultsMascot} />
                    <img src="https://deltarune.wiki/images/Seam_face.gif?cb=0ngjb8&h=thumb.php&f=Seam_face.gif" alt="Seam" className={classes.resultsMascot} />
                    <img src={jackensteinGif} alt="Jackenstein" className={classes.resultsMascot} />
                </div>
            ) : (
                <div className={classes.defeatMascotRow}>
                    <img src={spamtonGif} alt="Spamton" className={classes.resultsMascot} />
                    <div className={classes.defeatMascotText}>[BIG SHOT] FAILS!</div>
                </div>
            )}

            <div className={classes.countdownContainer}>
                <div className={classes.countdownLabel}>
                    NEXT CHALLENGE RESET IN
                </div>
                <Group gap="xs">
                    <IconClock size={20} color="var(--color-accent-primary)" />
                    <div className={classes.countdownTimer}>
                        {timeLeft}
                    </div>
                </Group>
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

            <Paper className={classes.resultsCard}>
                <div className={classes.resultsTitle}>
                    {isVictory ? 'Victory Statistics' : 'Game Over Statistics'}
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
                    <Text size="sm">Total Time</Text>
                    <Text size="sm" fw="bold" className={classes.timerText}>{durationStr}</Text>
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

            <Group gap="md">
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
