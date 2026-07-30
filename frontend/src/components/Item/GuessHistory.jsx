import { Badge, Paper, Text } from '@mantine/core';
import styles from '../../styles/Item.module.css';

export default function GuessHistory({ guesses }) {
    if (!guesses || guesses.length === 0) return null;

    return (
        <div className={styles.historyContainer}>
            <Text className={styles.historyHeader}>
                GUESS HISTORY
            </Text>
            {guesses.map((g, idx) => {
                const item = g.item;
                const isCorrect = g.isCorrect;

                return (
                    <Paper
                        key={`${item.name}-${idx}`}
                        className={`${styles.guessRow} ${isCorrect ? styles.guessRowCorrect : styles.guessRowIncorrect}`}
                        withBorder
                    >
                        <div className={styles.guessLeft}>
                            <Text className={styles.guessName}>
                                {item.name.toUpperCase()}
                            </Text>
                            <Text className={styles.guessType}>
                                {item.type}
                            </Text>
                        </div>
                        <Badge
                            color={isCorrect ? 'emeraldGreen' : 'royalMagenta'}
                            variant="filled"
                            className={styles.guessBadge}
                            radius="xs"
                        >
                            {isCorrect ? 'Correct' : 'Incorrect'}
                        </Badge>
                    </Paper>
                );
            })}
        </div>
    );
}
