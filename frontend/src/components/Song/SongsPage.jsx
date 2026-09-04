import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Container, Title, Paper } from '@mantine/core';
import classes from '../../styles/Song.module.css';
import homeClasses from '../../styles/Home.module.css';
import SongGame from './SongGame.jsx';

export default function SongsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const modeParam = searchParams.get('mode');
    const [currentMode, setCurrentMode] = useState(modeParam === 'classic' ? 'classic' : 'rush');

    const handleModeChange = (newMode) => {
        setCurrentMode(newMode);
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('mode', newMode);
            return next;
        });
    };

    return (
        <Container size="md" className={`${homeClasses.gameContainer} ${classes.container || ''}`}>
            <Paper
                shadow="md"
                p="xl"
                radius="md"
                withBorder
                className={`${homeClasses.gamePaper} ${classes.paper || ''}`}
            >
                <Title order={2} ta="center" mb="lg" className={homeClasses.songsTitle}>
                    {currentMode === 'rush' ? 'Rush Mode' : 'Song Mode'}
                </Title>
                <SongGame initialMode={currentMode} onModeChange={handleModeChange} />
            </Paper>
        </Container>
    );
}
