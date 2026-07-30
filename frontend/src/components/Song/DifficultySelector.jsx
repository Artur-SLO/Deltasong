import { SONG_DIFFICULTIES } from '../../config/Constants.js';
import { Button } from '@mantine/core';
import styles from '../../styles/Song.module.css';

export default function DifficultySelector({ activeDifficulty, onChangeDifficulty, disabled }) {
    return (
        <div className={styles.difficultyContainer}>
            {Object.entries(SONG_DIFFICULTIES).map(([key, config]) => {
                const isActive = activeDifficulty === key;
                return (
                    <Button
                        key={key}
                        onClick={() => onChangeDifficulty(key)}
                        color={config.color}
                        variant={isActive ? "filled" : "outline"}
                        disabled={disabled}
                        className={styles.difficultyButton}
                        size="sm"
                    >
                        {config.label} ({config.duration}s)
                    </Button>
                );
            })}
        </div>
    );
}
