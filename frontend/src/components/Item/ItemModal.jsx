import { Modal, Stack, Text, Paper } from '@mantine/core';
import ModalHeader from '../Common/ModalHeader.jsx';
import { useEffect } from 'react';
import { ITEM_DETAILS_CONFIG } from '../../config/Constants.js';
import styles from '../../styles/Item.module.css';
import rouxlsGif from '../../assets/images/rouxls.gif';

export default function ItemModal({ isOpen, onClose, modalType, target, onPlayAgain }) {
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

    return (
        <Modal
            opened={isOpen}
            onClose={onPlayAgain}
            withCloseButton={false}
            centered
            size="md"
            transitionProps={{ duration: 0 }}
            title={
                <ModalHeader
                    title={isVictory ? 'Victory!' : 'Game Over'}
                    isVictory={isVictory}
                    onPlayAgain={onPlayAgain}
                    onClose={onClose}
                />
            }
            classNames={{
                content: styles.modalContent,
                header: styles.modalHeader
            }}
        >
            <Stack align="center" gap="md" p="md">
                <img 
                    src={rouxlsGif} 
                    alt="Rouxls Kaard Mascot" 
                    className={styles.mascotGif} 
                />
                <Text size="lg" ta="center">
                    {isVictory
                        ? "Congratulations! You guessed the item!"
                        : "Too bad! The secret item was:"}
                </Text>

                <Paper className={`${styles.targetCard} ${isVictory ? styles.targetCardWon : ''}`} withBorder>
                    {target.image && (
                        <img
                            src={target.image}
                            alt={target.name}
                            className={`${styles.targetImage} ${isVictory ? styles.targetImageWon : ''}`}
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
            </Stack>
        </Modal>
    );
}
