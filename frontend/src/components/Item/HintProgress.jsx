import { Paper, Text, Group } from '@mantine/core';
import { 
    IconFileDescription, 
    IconSparkles, 
    IconCoin, 
    IconCategory, 
    IconMapPin,
    IconLock,
    IconLockOpen
} from '@tabler/icons-react';
import styles from '../../styles/Item.module.css';

export default function HintProgress({ target, incorrectGuessesCount }) {
    if (!target) return null;

    const mainClue = {
        key: 'description',
        label: 'Description',
        icon: <IconFileDescription size={18} />,
        value: target.description,
        isUnlocked: true
    };

    const secondaryClues = [
        {
            key: 'effects',
            label: 'Effects',
            icon: <IconSparkles size={16} />,
            value: target.effects || 'None',
            reqGuesses: 1,
            color: '#c084fc'
        },
        {
            key: 'buy',
            label: 'Buy Price',
            icon: <IconCoin size={16} />,
            value: target.buy ? `${target.buy} D$` : 'Not for sale / Free',
            reqGuesses: 2,
            color: '#ffd43b'
        },
        {
            key: 'type',
            label: 'Item Type',
            icon: <IconCategory size={16} />,
            value: target.type,
            reqGuesses: 3,
            color: '#38bdf8'
        },
        {
            key: 'source',
            label: 'Source / Location',
            icon: <IconMapPin size={16} />,
            value: target.source || 'Unknown',
            reqGuesses: 4,
            color: '#4ade80'
        }
    ];

    return (
        <div className={styles.hintDashboard}>
            {/* Primary Clue: Description (Always Visible) */}
            <Paper className={styles.descriptionCard} withBorder>
                <div className={styles.hintHeader}>
                    <Group gap="xs" align="center">
                        <span className={styles.hintIconMain}>{mainClue.icon}</span>
                        <Text className={styles.hintLabelMain}>Item Description</Text>
                    </Group>
                </div>
                <Text className={styles.descriptionText}>
                    "{mainClue.value}"
                </Text>
            </Paper>

            {/* Secondary Clues: 2x2 Grid */}
            <div className={styles.cluesGrid}>
                {secondaryClues.map((clue) => {
                    const isUnlocked = incorrectGuessesCount >= clue.reqGuesses;
                    const remaining = clue.reqGuesses - incorrectGuessesCount;

                    return (
                        <Paper
                            key={clue.key}
                            className={`${styles.clueBox} ${isUnlocked ? styles.clueBoxUnlocked : styles.clueBoxLocked}`}
                            withBorder
                        >
                            <div className={styles.clueBoxHeader}>
                                <Group gap={6} align="center">
                                    <span style={{ color: isUnlocked ? clue.color : 'var(--color-text-dimmed)', display: 'flex' }}>
                                        {clue.icon}
                                    </span>
                                    <Text className={styles.clueBoxLabel}>
                                        {clue.label}
                                    </Text>
                                </Group>

                                {isUnlocked ? (
                                    <IconLockOpen size={15} color={clue.color} />
                                ) : (
                                    <IconLock size={15} color="var(--color-text-dimmed)" />
                                )}
                            </div>

                            {isUnlocked ? (
                                <Text className={styles.clueBoxValue} style={{ color: clue.color }}>
                                    {clue.value}
                                </Text>
                            ) : (
                                <Text className={styles.clueBoxLockedText}>
                                    Locked — {remaining === 1 ? '1 guess to reveal' : `${remaining} guesses to reveal`}
                                </Text>
                            )}
                        </Paper>
                    );
                })}
            </div>
        </div>
    );
}
