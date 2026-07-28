import { Grid, Image, Text } from "@mantine/core";
import { IconArrowUp, IconArrowDown } from "@tabler/icons-react";
import GridCell from "./GridCell";
import styles from '../../styles/Character.module.css';

export default function Guess({ character, widths, totalColumns }) {
    if (!character) return null;

    return (
        <Grid columns={totalColumns} gutter="md" w="100%" align="center">
            {widths.map((col) => {
                let content = null;
                let cellBg = "var(--color-border-primary)";

                if (col.key === 'image') {
                    content = character.image ? (
                        <Image
                            src={character.image}
                            alt="Guess Sprite"
                            w={48}
                            h={48}
                            fit="contain"
                            className={styles.pixelatedImage}
                        />
                    ) : null;
                    if (character.isVictory) {
                        cellBg = "emeraldGreen.8";
                    }
                } else {
                    const fieldResult = character[col.key];
                    if (fieldResult) {
                        const val = fieldResult.value;
                        const isCorrect = fieldResult.correct;

                        let showHint = null;

                        if (col.key === 'chapter' && fieldResult.hint) {
                            if (fieldResult.hint === 'higher') showHint = 'higher';
                            if (fieldResult.hint === 'lower') showHint = 'lower';
                        }

                        if (col.key === 'first_appearance' && character.first_appearance_index?.hint) {
                            const indexHint = character.first_appearance_index.hint;
                            if (indexHint === 'higher') showHint = 'higher';
                            if (indexHint === 'lower') showHint = 'lower';
                        }

                        content = (
                            <div className={styles.guessContent}>
                                <Text size="sm" fw="bold">
                                    {val}
                                </Text>
                                {showHint === 'higher' && <IconArrowUp size={16} />}
                                {showHint === 'lower' && <IconArrowDown size={16} />}
                            </div>
                        );

                        if (isCorrect) {
                            cellBg = "emeraldGreen.8";
                        } else if (showHint) {
                            cellBg = "cyberCyan.8";
                        } else {
                            cellBg = "royalMagenta.8";
                        }
                    }
                }

                return (
                    <Grid.Col key={col.key} span={col.span}>
                        <GridCell bg={cellBg}>
                            {content}
                        </GridCell>
                    </Grid.Col>
                );
            })}
        </Grid>
    );
}
