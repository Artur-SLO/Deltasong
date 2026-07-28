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
                <Title order={2} ta="center" mb="lg" c="cyberCyan.5" className={`${homeClasses.gameTitle} ${classes.title || ''}`}>
                    Guess the Character
                </Title>
                {/* <Text size="lg" ta="center" mb="lg" c="dimmed"> */}
                {/*     Guess the character from Deltarune! */}
                {/* </Text> */}
                <GuessGrid />
            </Paper>
        </Container>
    );
}
