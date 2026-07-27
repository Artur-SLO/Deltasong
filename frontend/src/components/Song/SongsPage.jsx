import { Container, Title, Text, Button, Paper, Group } from '@mantine/core';
import { useNavigate } from 'react-router';
import classes from '../../styles/Song.module.css';

export default function SongsPage() {
    const navigate = useNavigate();

    return (
        <Container size="md" className={`game-container ${classes.container || ''}`}>
            <Paper 
                shadow="md" 
                p="xl" 
                radius="md" 
                withBorder 
                className={`game-paper ${classes.paper || ''}`}
            >
                <Title order={2} ta="center" mb="md" c="emeraldGreen.5" className={`game-title ${classes.title || ''}`}>
                    Songs Game Mode
                </Title>
                <Text size="lg" ta="center" mb="lg" c="dimmed">
                    This is the starting point for the Songs guessing game.
                </Text>
                <Group justify="center">
                    <Button color="emeraldGreen" variant="light" size="md" onClick={() => navigate('/')}>
                        Back to Home
                    </Button>
                </Group>
            </Paper>
        </Container>
    );
}
