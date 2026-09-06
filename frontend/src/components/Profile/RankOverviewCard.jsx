import { useState, useEffect } from 'react';
import { Title, Text, RingProgress, Container, Stack, Group, Flex } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import classes from '../../styles/RankOverview.module.css';
import { calculateUserRank, getRankData } from '../../core/rankSystem';
import { IconFlame } from '@tabler/icons-react';

export function RankOverviewCard() {
    const [userData, setUserData] = useState(() => getRankData());
    const isMobile = useMediaQuery('(max-width: 480px)');
    const isTablet = useMediaQuery('(max-width: 768px)');

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

    const ringSize = isMobile ? 136 : (isTablet ? 165 : 200);
    const ringThickness = isMobile ? 11 : (isTablet ? 13 : 16);
    const gradeFontSize = isMobile ? '2.4rem' : (isTablet ? '2.8rem' : '3.5rem');

    return (
        <Container
            className={classes.leftCard}
            px={{ base: 'xs', sm: 'lg' }}
            py={{ base: 'sm', sm: 'xl' }}
            style={{ '--rank-color': `var(--mantine-color-${rank.color.replace('.', '-')})` }}
        >
            <Stack gap={{ base: 'sm', sm: 'xl' }} align="stretch">
                <Flex
                    direction={{ base: 'column', md: 'row' }}
                    justify="space-between"
                    align="center"
                    gap={{ base: 'xs', md: 'xl' }}
                    w="100%"
                >
                    {/* Ring Progress of Rank (Thematic Circle) */}
                    <Group justify="center" className={classes.ringSection}>
                        <RingProgress
                            size={ringSize}
                            thickness={ringThickness}
                            roundCaps
                            sections={[{ value: rank.progressValue, color: rank.color }]}
                            label={
                                <Stack gap={0} align="center" justify="center">
                                    <Text size={gradeFontSize} fw={900} c={rank.color} lh={1} className={classes.rankGrade}>
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
