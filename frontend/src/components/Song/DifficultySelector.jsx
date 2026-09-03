import { SONG_DIFFICULTIES, DIFFICULTY_HEX } from '../../config/Constants.js';
import { IconCheck, IconChevronRight } from '@tabler/icons-react';
import styles from '../../styles/Song.module.css';

const CLASSIC_KEYS = ['easy', 'medium', 'hard', 'madness'];

export default function DifficultySelector({ 
    activeDifficulty, 
    onChangeDifficulty, 
    disabled,
    isRushMode = false,
    rushStages = [],
    currentStageIndex = 0
}) {
    if (isRushMode) {
        return (
            <div className={styles.rushStepperContainer}>
                {rushStages.map((stage, idx) => {
                    const isCleared = idx < currentStageIndex;
                    const isActive = idx === currentStageIndex;
                    const isUpcoming = idx > currentStageIndex;

                    let pillClass = styles.rushStepPill;
                    if (isActive) pillClass += ` ${styles.rushStepPillActive}`;
                    else if (isCleared) pillClass += ` ${styles.rushStepPillCleared}`;
                    else if (isUpcoming) pillClass += ` ${styles.rushStepPillUpcoming}`;

                    return (
                        <div key={stage.id} className={styles.rushStepItem}>
                            <div 
                                className={pillClass} 
                                style={isActive ? { '--glow-color': stage.hexColor } : undefined}
                            >
                                {isCleared && <IconCheck size={14} stroke={3} />}
                                {stage.label}
                            </div>
                            {idx < rushStages.length - 1 && (
                                <IconChevronRight 
                                    size={14} 
                                    className={`${styles.rushStepArrow} ${isCleared ? styles.rushStepArrowCleared : ''}`} 
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={styles.difficultyContainer}>
            {CLASSIC_KEYS.map((key) => {
                const config = SONG_DIFFICULTIES[key];
                if (!config) return null;
                const isActive = activeDifficulty === key;
                const hexColor = DIFFICULTY_HEX[key] || '#00ff27';

                return (
                    <button
                        type="button"
                        key={key}
                        onClick={() => !disabled && onChangeDifficulty(key)}
                        disabled={disabled}
                        className={`${styles.rushStepPill} ${isActive ? styles.rushStepPillActive : styles.rushStepPillUpcoming}`}
                        style={isActive ? { '--glow-color': hexColor } : undefined}
                    >
                        {config.label}
                    </button>
                );
            })}
        </div>
    );
}
