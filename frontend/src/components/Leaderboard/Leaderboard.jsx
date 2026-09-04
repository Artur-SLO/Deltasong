import { useState, useEffect } from 'react';
import { Container, Paper, Title, Table, Text, Loader, Center, Stack } from '@mantine/core';
import { IconTrophy, IconFlame } from '@tabler/icons-react';
import classes from '../../styles/Leaderboard.module.css';
import homeClasses from '../../styles/Home.module.css';
import { subscribeLeaderboard } from '../../services/leaderboardService';
import { getActiveUser } from '../../services/authService';
import { getCharacterImage } from '../../utils/image';
import deltaruneCharacters from '../../assets/data/deltarune_characters.json';
import Soul from '../Common/Soul.jsx';
import { calculateUserRank } from '../../services/scoreService';

const defaultAvatar = deltaruneCharacters.find(c => c.name.toUpperCase() === 'KRIS')?.image || '';

// Rank Tier visual configuration based on Deltasong rank system
const GRADE_CONFIG = {
    Z: { color: '#a0a0a0', bg: 'rgba(160, 160, 160, 0.12)', border: 'rgba(160, 160, 160, 0.35)', shadow: 'rgba(160, 160, 160, 0.2)' },
    C: { color: '#ffd43b', bg: 'rgba(255, 212, 59, 0.12)', border: 'rgba(255, 212, 59, 0.35)', shadow: 'rgba(255, 212, 59, 0.2)' },
    B: { color: '#339af0', bg: 'rgba(51, 154, 240, 0.12)', border: 'rgba(51, 154, 240, 0.35)', shadow: 'rgba(51, 154, 240, 0.2)' },
    A: { color: '#cc5de8', bg: 'rgba(204, 93, 232, 0.12)', border: 'rgba(204, 93, 232, 0.35)', shadow: 'rgba(204, 93, 232, 0.2)' },
    S: { color: '#00ff27', bg: 'rgba(0, 255, 39, 0.12)', border: 'rgba(0, 255, 39, 0.35)', shadow: 'rgba(0, 255, 39, 0.25)' },
    T: { color: '#ff1f8e', bg: 'rgba(255, 31, 142, 0.15)', border: 'rgba(255, 31, 142, 0.45)', shadow: 'rgba(255, 31, 142, 0.3)' }
};

// The 7 Undertale / Deltarune Human Souls awarded to the Top 7 Leaderboard Champions
const TOP_SOULS = [
    { name: 'Determination', color: '#ff2222' }, // 1st Place - Red
    { name: 'Patience', color: '#00ffff' },      // 2nd Place - Cyan
    { name: 'Perseverance', color: '#a855f7' },  // 3rd Place - Purple
    { name: 'Kindness', color: '#00ff27' },      // 4th Place - Green
    { name: 'Justice', color: '#ffd43b' },       // 5th Place - Yellow
    { name: 'Integrity', color: '#0058f2' },     // 6th Place - Blue
    { name: 'Bravery', color: '#ff7f00' }        // 7th Place - Orange
];

export default function Leaderboard() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const activeUser = getActiveUser();

    useEffect(() => {
        const unsubscribe = subscribeLeaderboard((data) => {
            setPlayers(data);
            setLoading(false);
        }, 50);

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);



    return (
        <Container size="md" className={`${homeClasses.gameContainer} ${classes.container || ''}`}>
            <Paper
                shadow="md"
                p="xl"
                radius="md"
                withBorder
                className={`${homeClasses.gamePaper} ${classes.card || ''}`}
            >
                <div className={classes.titleWrapper}>
                    <IconTrophy size={28} className={classes.trophyIcon} />
                    <Title order={2} ta="center" className={classes.headerTitle}>
                        Leaderboard
                    </Title>
                </div>

                {loading ? (
                    <Center py="xl">
                        <Stack align="center" gap="sm">
                            <Loader color="cyberCyan" size="md" />
                            <Text size="xs" c="dimmed">Loading rankings...</Text>
                        </Stack>
                    </Center>
                ) : players.length === 0 ? (
                    <Center py="xl">
                        <Text c="dimmed" size="sm" className={classes.emptyStateText}>
                            No player rankings recorded yet. Play a mode to enter the leaderboard!
                        </Text>
                    </Center>
                ) : (
                    <Table.ScrollContainer minWidth={560} className={classes.tableWrapper}>
                        <Table verticalSpacing="sm" className={classes.table} highlightOnHover={false}>
                            <Table.Thead className={classes.tableHeader}>
                                <Table.Tr>
                                    <Table.Th className={classes.rankTh}>#</Table.Th>
                                    <Table.Th className={classes.playerTh}>Player</Table.Th>
                                    <Table.Th className={classes.tierTh}>Rank</Table.Th>
                                    <Table.Th className={classes.streakTh}>Streak</Table.Th>
                                    <Table.Th className={classes.scoreTh}>Score</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {players.map((player, idx) => {
                                    const isCurrentUser = activeUser && (player.id === activeUser.uid || player.id === activeUser.id);
                                    const avatarSrc = getCharacterImage(player.avatar || defaultAvatar);
                                    const userRank = calculateUserRank(player.totalScore || 0);
                                    const gradeStyle = GRADE_CONFIG[userRank.grade] || GRADE_CONFIG.Z;

                                    return (
                                        <Table.Tr 
                                            key={player.id} 
                                            className={`${classes.playerRow} ${isCurrentUser ? classes.currentUserRow : ''}`}
                                        >
                                            <Table.Td className={classes.rankTd}>
                                                <div className={classes.rankBadgeWrapper}>
                                                    {idx < 7 ? (
                                                        <div 
                                                            className={classes.soulRankContainer}
                                                            title={`${TOP_SOULS[idx].name} Soul - Rank #${idx + 1}`}
                                                        >
                                                            <Soul color={TOP_SOULS[idx].color} size={22} />
                                                            <span 
                                                                className={classes.rankNumber}
                                                                style={{ 
                                                                    color: TOP_SOULS[idx].color,
                                                                    textShadow: `0 0 10px ${TOP_SOULS[idx].color}aa`
                                                                }}
                                                            >
                                                                {idx + 1}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className={classes.rankNumber}>
                                                            {idx + 1}
                                                        </span>
                                                    )}
                                                </div>
                                            </Table.Td>
                                            <Table.Td className={classes.playerTd}>
                                                <div className={classes.playerContent}>
                                                    <div className={classes.avatarWrapper}>
                                                        <img 
                                                            src={avatarSrc} 
                                                            alt={player.username} 
                                                            className={classes.playerAvatar} 
                                                        />
                                                    </div>
                                                    <div className={classes.playerInfo}>
                                                        <span className={classes.playerName}>
                                                            {player.username}
                                                        </span>
                                                        {isCurrentUser && (
                                                            <span className={classes.youBadge}>
                                                                YOU
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Table.Td>
                                            <Table.Td className={classes.tierTd}>
                                                <div 
                                                    className={classes.tierBadge}
                                                    style={{
                                                        color: gradeStyle.color,
                                                        backgroundColor: gradeStyle.bg,
                                                        borderColor: gradeStyle.border,
                                                        boxShadow: `0 0 8px ${gradeStyle.shadow}`
                                                    }}
                                                    title={`${userRank.label} (${userRank.grade} Rank)`}
                                                >
                                                    <span className={classes.tierGrade}>{userRank.grade}</span>
                                                    <span className={classes.tierLabel}>{userRank.label}</span>
                                                </div>
                                            </Table.Td>
                                            <Table.Td className={classes.streakTd}>
                                                <div className={classes.streakWrapper}>
                                                    <Text className={classes.streakText}>
                                                        {player.streak || 0}
                                                    </Text>
                                                    <IconFlame size={16} color="#ff9800" />
                                                </div>
                                            </Table.Td>
                                            <Table.Td className={classes.scoreTd}>
                                                <div className={classes.scoreWrapper}>
                                                    <span className={classes.scoreText}>
                                                        {(player.totalScore || 0).toLocaleString()}
                                                        <span className={classes.ptsLabel}>PTS</span>
                                                    </span>
                                                </div>
                                            </Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>
                )}
            </Paper>
        </Container>
    );
}
