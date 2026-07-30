import { Container, Title, Paper } from '@mantine/core';
import classes from '../../styles/Song.module.css';
import homeClasses from '../../styles/Home.module.css';
import SongGame from './SongGame.jsx';

export default function SongsPage() {
    return (
        <Container size="md" className={`${homeClasses.gameContainer} ${classes.container || ''}`}>
            <Paper 
                shadow="md" 
                p="xl" 
                radius="md" 
                withBorder 
                className={`${homeClasses.gamePaper} ${classes.paper || ''}`}
            >
                <Title order={2} ta="center" mb="lg" c="emeraldGreen.5" className={homeClasses.conventionalTitle}>
                    Song Mode
                </Title>
                <SongGame />
            </Paper>
        </Container>
    );
}
