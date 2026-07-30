import { Modal } from '@mantine/core';
import DailyResultsView from './DailyResultsView.jsx';

export default function DailyVictoryModal({ isOpen, onClose, gameState }) {
    if (!gameState) return null;
    const isVictory = gameState.status === 'victory';

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            centered
            size="md"
            title={'Daily Challenge'}
            overlayProps={{
                backgroundOpacity: 0.55,
                blur: 3,
            }}
            styles={{
                title: {
                    fontFamily: 'var(--font-family-deltarune)',
                    color: isVictory ? 'var(--mantine-color-emeraldGreen-6)' : 'var(--mantine-color-royalMagenta-6)',
                    fontSize: 'var(--mantine-font-size-xl)'
                },
                content: {
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: 'var(--size-2) solid var(--color-border-primary)',
                    color: 'var(--color-text-primary)'
                },
                header: {
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderBottom: 'var(--size-1) solid var(--color-border-primary)'
                }
            }}
        >
            <DailyResultsView gameState={gameState} />
        </Modal>
    );
}
