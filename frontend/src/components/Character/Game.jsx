import { Container, Title, Text, Button, Paper, Group } from '@mantine/core';
import { useNavigate } from 'react-router';
import classes from '../../styles/Character.module.css';
import homeClasses from '../../styles/Home.module.css';

export default function Game() {
    const navigate = useNavigate();

    return (
        <Container size="md" className={`${homeClasses.gameContainer} ${classes.container || ''}`}>
            <Paper 
                shadow="md" 
                p="xl" 
                radius="md" 
                withBorder 
                className={`${homeClasses.gamePaper} ${classes.paper || ''}`}
            >
                <Title order={2} ta="center" mb="md" c="cyberCyan.5" className={`${homeClasses.gameTitle} ${classes.title || ''}`}>
                    Characters Game Mode
                </Title>
                <Text size="lg" ta="center" mb="lg" c="dimmed">
                    This is the starting point for the Characters guessing game. The core game logic and UI will be built here!
                </Text>
                <Group justify="center">
                    <Button color="cyberCyan" variant="light" size="md" onClick={() => navigate('/')}>
                        Back to Home
                    </Button>
                </Group>
            </Paper>
        </Container>
    );
}
