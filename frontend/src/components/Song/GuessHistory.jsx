import { Grid, Text, Paper } from '@mantine/core';
import { IconArrowUp, IconArrowDown } from '@tabler/icons-react';
import styles from '../../styles/Song.module.css';

function SongGridCell({ children, bg, className }) {
    return (
        <Paper
            bg={bg || "var(--color-border-primary)"}
            shadow="md"
            withBorder
            p="xs"
            className={`${styles.gridCell} ${className || ''}`}
        >
            <div className={styles.cellContent}>
                {children}
            </div>
        </Paper>
    );
}

export default function GuessHistory({ guesses }) {
    const columns = [
        { label: 'SONG TITLE', key: 'title', span: 6 },
        { label: 'CHAPTER', key: 'chapter', span: 3 },
        { label: 'DURATION', key: 'duration', span: 3 }
    ];

    return (
        <div className={styles.historyContainer}>
            {/* Headers */}
            <Grid columns={12} gutter="md" w="100%" align="center">
                {columns.map((col) => (
                    <Grid.Col key={col.label} span={col.span}>
                        <SongGridCell>
                            <Text size="sm" fw="bold" className={styles.title}>
                                {col.label}
                            </Text>
                        </SongGridCell>
                    </Grid.Col>
                ))}
            </Grid>

            {/* Rows */}
            {guesses && guesses.map((guess, idx) => {
                return (
                    <Grid columns={12} gutter="md" w="100%" align="center" key={guess.title.value}>
                        {columns.map((col, colIdx) => {
                            const field = guess[col.key];
                            if (!field) return null;

                            const isCorrect = field.correct;
                            let cellBg = "var(--color-border-primary)";
                            let showHint = null;

                            if (isCorrect) {
                                cellBg = "emeraldGreen.8";
                            } else {
                                if (field.hint === 'higher') {
                                    showHint = 'higher';
                                    cellBg = "cyberCyan.8";
                                } else if (field.hint === 'lower') {
                                    showHint = 'lower';
                                    cellBg = "cyberCyan.8";
                                } else {
                                    cellBg = "royalMagenta.8";
                                }
                            }

                            return (
                                <Grid.Col key={col.key} span={col.span}>
                                    <SongGridCell bg={cellBg} className={styles[`flipCell${colIdx}`]}>
                                        <div className={styles.guessContent}>
                                            <Text fw="bold" className={styles.guessText}>
                                                {field.value}
                                            </Text>
                                            {showHint === 'higher' && <IconArrowUp size={16} />}
                                            {showHint === 'lower' && <IconArrowDown size={16} />}
                                        </div>
                                    </SongGridCell>
                                </Grid.Col>
                            );
                        })}
                    </Grid>
                );
            })}
        </div>
    );
}
