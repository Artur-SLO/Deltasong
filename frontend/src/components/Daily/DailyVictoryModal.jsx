import { Modal } from '@mantine/core';
import DailyResultsView from './DailyResultsView.jsx';
import classes from '../../styles/Daily.module.css';

export default function DailyVictoryModal({ isOpen, onClose, gameState }) {
    if (!gameState) return null;
    const isVictory = gameState.status === 'victory';

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            centered
            size="md"
            transitionProps={{ duration: 0 }}
            title={'Daily Challenge'}
            overlayProps={{
                backgroundOpacity: 0.55,
                blur: 3,
            }}
            classNames={{
                content: classes.modalContent,
                header: classes.modalHeader
            }}
            styles={{
                title: {
                    fontFamily: 'var(--font-family-deltarune)',
                    color: isVictory ? 'var(--mantine-color-emeraldGreen-6)' : 'var(--mantine-color-royalMagenta-6)',
                    fontSize: 'var(--mantine-font-size-xl)'
                }
            }}
        >
            <DailyResultsView gameState={gameState} />
        </Modal>
    );
}
