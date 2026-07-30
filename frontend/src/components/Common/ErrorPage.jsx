import { Button, Container, Group, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router';
import classes from '../../styles/Mantine/ErrorPage.module.css';

const starwalkerImage = "https://deltarune.wiki/images/Starwalker_overworld_walk.gif?cb=2szett&h=thumb.php&f=Starwalker_overworld_walk.gif";

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
                    <img 
                        src={starwalkerImage} 
                        alt="Original Starwalker" 
                        className={classes.lancerGif404} 
                    />
                    <Title className={classes.title}>Nothing to see here</Title>
                    <Text c="dimmed" size="lg" ta="center" className={classes.description}>
                        This Page is pissing me off...
                    </Text>
                    <Group justify="center">
                        <Button className={classes.btn} size="md" onClick={() => navigate('/')}>
                            Return to home page
                        </Button>
                    </Group>
                </div>
            </div>
        </Container>
    );
}
