import { useState, useEffect } from 'react';
import { Title, Text, RingProgress, Container, Stack, Group, Flex } from '@mantine/core';
import classes from './RankOverview.module.css';
import { calculateUserRank, getRankData } from '../../core/rankSystem';
import { IconFlame } from '@tabler/icons-react';

export function RankOverviewCard() {
    const [userData, setUserData] = useState(() => getRankData());

    useEffect(() => {
        const handleRankChange = () => {
            setUserData(getRankData());
        };

        window.addEventListener('deltasong_rank_change', handleRankChange);
        window.addEventListener('deltasong_auth_change', handleRankChange);
        
        return () => {
            window.removeEventListener('deltasong_rank_change', handleRankChange);
            window.removeEventListener('deltasong_auth_change', handleRankChange);
        };
    }, []);

    const rank = calculateUserRank(userData.totalScore);

    return (
        <Container
            className={classes.leftCard}
            px="lg"
            py="xl"
            style={{ '--rank-color': `var(--mantine-color-${rank.color.replace('.', '-')})` }}
        >
            <Stack gap="xl" align="stretch">
                <Flex
                    direction={{ base: 'column', md: 'row' }}
                    justify="space-between"
                    align="center"
                    gap="xl"
                    w="100%"
                >
                    {/* Ring Progress of Rank (Thematic Circle) */}
                    <Group justify="center" className={classes.ringSection}>
                        <RingProgress
                            size={200}
                            thickness={16}
                            roundCaps
                            sections={[{ value: rank.progressValue, color: rank.color }]}
                            label={
                                <Stack gap={0} align="center" justify="center">
                                    <Text size="3.5rem" fw={900} c={rank.color} lh={1} className={classes.rankGrade}>
                                        {rank.grade}
                                    </Text>
                                    <Text className={classes.rankLabel} px="xs">
                                        {rank.label}
                                    </Text>
                                </Stack>
                            }
                        />
                    </Group>

                    {/* Performance stats */}
                    <Stack className={classes.detailsSection} gap="xs" align="stretch">
                        <div>
                            <Title order={2} className={classes.sectionTitle}>
                                Performance
                            </Title>
                        </div>

                        <Stack gap="xs" className={classes.statsListContainer}>
                            <Group justify="space-between" className={classes.statRowItem}>
                                <Text className={classes.statLabel}>Score</Text>
                                <Text className={classes.statValue}>
                                    {userData.totalScore} <span className={classes.statUnit}>pts</span>
                                </Text>
                            </Group>
                            <Group justify="space-between" className={classes.statRowItem}>
                                <Text className={classes.statLabel}>Streak</Text>
                                <Group gap={4} align="center">
                                    <Text className={classes.statValue}>
                                        {userData.streak} <span className={classes.statUnit}>Days</span>
                                    </Text>
                                    <IconFlame size={18} className={classes.flameIcon} />
                                </Group>
                            </Group>
                            <Group justify="space-between" className={classes.statRowItem}>
                                <Text className={classes.statLabel}>Daily Victories</Text>
                                <Text className={classes.statValue}>
                                    {userData.stats.dailyCompleted} <span className={classes.statUnit}>Wins</span>
                                </Text>
                            </Group>
                            <Group justify="center" gap="xl" className={classes.minigamesRow}>
                                <Text className={classes.minigameStat}>
                                    Char: <span className={classes.charValue}>{userData.stats.charactersWon || 0}</span>
                                </Text>
                                <Text className={classes.minigameStat}>
                                    Item: <span className={classes.itemValue}>{userData.stats.itemsWon || 0}</span>
                                </Text>
                                <Text className={classes.minigameStat}>
                                    Song: <span className={classes.songValue}>{userData.stats.songsWon || 0}</span>
                                </Text>
                            </Group>
                        </Stack>
                    </Stack>
                </Flex>

                <div className={classes.rankMessage}>
                    {rank.message.split('\n\n').map((para, idx) => (
                        <p key={idx} className={classes.rankMessageParagraph}>
                            {para}
                        </p>
                    ))}
                </div>
            </Stack>
        </Container>
    );
}

export default RankOverviewCard;
