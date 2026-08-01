import { SimpleGrid, Stack } from '@mantine/core';
import { useNavigate } from 'react-router';
import { GAME_MODES } from '../../config/Constants';
import GameModeCard from './GameModeCard';
import classes from '../../styles/Home.module.css';

export default function GameModeGrid() {
    const navigate = useNavigate();

    const traditionalModes = GAME_MODES.filter(mode => mode.link !== "/daily");
    const dailyMode = GAME_MODES.find(mode => mode.link === "/daily");

    return (
        <Stack gap="lg" w="100%">
            {dailyMode && (
                <div className={classes.dailyCardWrapper}>
                    <GameModeCard 
                        {...dailyMode}
                        isDaily={true}
                        onPlay={() => navigate(dailyMode.link)}
                    />
                </div>
            )}

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                {traditionalModes.map((mode) => (
                    <div key={mode.title} className={classes.cardWrapper}>
                        <GameModeCard 
                            {...mode}
                            onPlay={() => navigate(mode.link)}
                        />
                    </div>
                ))}
            </SimpleGrid>
        </Stack>
    );
}
