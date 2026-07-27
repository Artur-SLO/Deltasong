import { Button, Container, Group, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router';
import classes from '../../styles/Mantine/ErrorPage.module.css';

/**
 * Standard HTTP 404 Error View Component.
 * Intercepts broken routes or invalid application states and provides navigation safety paths.
 */
export default function ErrorPage() {
    const navigate = useNavigate();

    return (
        <Container className={classes.root}>
            <div className={classes.inner}>
                <div className={classes.image}>404</div>
                <div className={classes.content}>
                    <Title className={classes.title}>Nothing to see here</Title>
                    <Text c="dimmed" size="lg" ta="center" className={classes.description}>
                        The page you are trying to open does not exist. You may have typed the address incorrectly or the page has been moved to another URL.
                    </Text>
                    <Group justify="center">
                        <Button size="md" onClick={() => navigate('/')}>
                            Return to home page
                        </Button>
                    </Group>
                </div>
            </div>
        </Container>
    );
}