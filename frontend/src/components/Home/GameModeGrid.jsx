import { SimpleGrid } from '@mantine/core';
import { useNavigate } from 'react-router';
import { GAME_MODES } from '../../config/Constants';
import GameModeCard from './GameModeCard';
import classes from '../../styles/Home.module.css';

export default function GameModeGrid() {
    const navigate = useNavigate();

    return (
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            {GAME_MODES.map((mode) => (
                <div key={mode.title} className={classes.cardWrapper}>
                    <GameModeCard 
                        {...mode}
                        onPlay={() => navigate(mode.link)}
                    />
                </div>
            ))}
        </SimpleGrid>
    );
}
