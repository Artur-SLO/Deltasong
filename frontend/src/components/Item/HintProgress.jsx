import { Paper, Text } from '@mantine/core';
import { IconLock, IconLockOpen } from '@tabler/icons-react';
import styles from '../../styles/Item.module.css';

export default function HintProgress({ target, incorrectGuessesCount }) {
    if (!target) return null;

    const clues = [
        {
            key: 'description',
            label: 'Description',
            value: target.description,
            reqGuesses: 0
        },
        {
            key: 'effects',
            label: 'Effects',
            value: target.effects,
            reqGuesses: 1
        },
        {
            key: 'buy',
            label: 'Buy Price',
            value: target.buy,
            reqGuesses: 2
        },
        {
            key: 'type',
            label: 'Item Type',
            value: target.type,
            reqGuesses: 3
        },
        {
            key: 'source',
            label: 'Source',
            value: target.source,
            reqGuesses: 4
        }
    ];

    return (
        <div className={styles.hintDashboard}>
            {clues.map((clue) => {
                const isUnlocked = incorrectGuessesCount >= clue.reqGuesses;

                return (
                    <Paper
                        key={clue.key}
                        className={`${styles.hintCard} ${isUnlocked ? styles.hintCardUnlocked : styles.hintCardLocked}`}
                        withBorder
                    >
                        <div className={styles.hintHeader}>
                            <Text
                                className={`${styles.hintLabel} ${isUnlocked ? styles.hintLabelUnlocked : styles.hintLabelLocked}`}
                            >
                                {clue.label}
                            </Text>
                            {isUnlocked ? (
                                <IconLockOpen size={16} color="var(--mantine-color-royalMagenta-4)" />
                            ) : (
                                    <IconLock size={16} color="var(--color-text-dimmed)" />
                                )}
                        </div>
                        {isUnlocked ? (
                            <Text className={styles.hintContent}>
                                {clue.value || 'N/A'}
                            </Text>
                        ) : (
                                <div className={styles.hintContentLocked}>
                                    <Text size="sm">
                                        Locked — Guess {clue.reqGuesses} time{clue.reqGuesses > 1 ? 's' : ''} to reveal
                                    </Text>
                                </div>
                            )}
                    </Paper>
                );
            })}
        </div>
    );
}
