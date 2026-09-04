import { Container, Title, Paper } from '@mantine/core';
import classes from '../../styles/Character.module.css';
import homeClasses from '../../styles/Home.module.css';
import GuessGrid from './GuessGrid';

export default function Characters() {
    return (
        <Container size="md" className={`${homeClasses.gameContainer} ${classes.container || ''}`}>
            <Paper
                shadow="md"
                p="xl"
                radius="md"
                withBorder
                className={`${homeClasses.gamePaper} ${classes.paper || ''}`}
            >
                <Title order={2} ta="center" mb="lg" className={homeClasses.charactersTitle}>
                    Characters Mode
                </Title>
                <GuessGrid />
            </Paper>
        </Container>
    );
}
