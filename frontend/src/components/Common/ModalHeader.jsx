import { ActionIcon, Tooltip, CloseButton, Group } from '@mantine/core';
import { IconRotateClockwise } from '@tabler/icons-react';
import styles from '../../styles/ModalHeader.module.css';

export default function ModalHeader({
    title,
    isVictory = true,
    onPlayAgain,
    onClose,
    playAgainTooltip = 'Play Again (Enter)'
}) {
    return (
        <div className={styles.modalTitleGroup}>
            <span className={isVictory ? styles.modalTitleVictory : styles.modalTitleSurrender}>
                {title}
            </span>
            <Group gap="xs" align="center">
                {onPlayAgain && (
                    <Tooltip label={playAgainTooltip} withArrow position="bottom">
                        <ActionIcon
                            size="lg"
                            radius="md"
                            onClick={onPlayAgain}
                            aria-label={playAgainTooltip}
                            className={styles.modalPlayAgainBtn}
                        >
                            <IconRotateClockwise size={20} stroke={2.5} />
                        </ActionIcon>
                    </Tooltip>
                )}
                {onClose && (
                    <CloseButton
                        onClick={onClose}
                        aria-label="Close"
                        size="md"
                        radius="md"
                        className={styles.modalCloseBtn}
                    />
                )}
            </Group>
        </div>
    );
}
