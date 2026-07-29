import { Modal, Stack, Text, Paper, Button, Group } from '@mantine/core';
import { useEffect } from 'react';
import { ITEM_DETAILS_CONFIG } from '../../config/Constants.js';
import styles from '../../styles/Item.module.css';

export default function ItemModal({ isOpen, onClose, modalType, target, onPlayAgain, onChangeFilter }) {
    if (!target) return null;

    const isVictory = modalType === 'victory';

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onPlayAgain();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onPlayAgain]);

    const details = []; // not used directly anymore

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            centered
            size="md"
            title={isVictory ? 'Victory!' : 'Game Over'}
            classNames={{
                content: styles.modalContent,
                header: styles.modalHeader,
                title: isVictory ? styles.modalTitleVictory : styles.modalTitleSurrender
            }}
        >
            <Stack align="center" gap="md" p="md">
                <Text size="lg" ta="center">
                    {isVictory
                        ? "Congratulations! You guessed the item!"
                        : "Too bad! The secret item was:"}
                </Text>

                <Paper className={styles.targetCard} withBorder>
                    {target.image && (
                        <img
                            src={target.image}
                            alt={target.name}
                            className={styles.targetImage}
                        />
                    )}
                    <Text className={styles.modalTextTitle}>
                        {target.name.toUpperCase()}
                    </Text>

                    <div className={styles.detailsList}>
                        {ITEM_DETAILS_CONFIG.map((detail) => (
                            <div key={detail.label} className={styles.detailItem}>
                                <div className={styles.detailLabel}>
                                    {detail.label}:
                                </div>
                                <div className={styles.detailValue}>
                                    {target[detail.key] || 'N/A'}
                                </div>
                            </div>
                        ))}
                    </div>
                </Paper>

                <Group gap="sm" justify="center">
                    <Button
                        color="emeraldGreen"
                        size="md"
                        onClick={onPlayAgain}
                        className={styles.playAgainBtn}
                    >
                        Play Again
                    </Button>
                    <Button
                        color="royalMagenta"
                        variant="outline"
                        size="md"
                        onClick={onChangeFilter}
                        className={styles.playAgainBtn}
                    >
                        Change Mode
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
