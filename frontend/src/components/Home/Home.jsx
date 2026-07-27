import { Container } from '@mantine/core';
import Hero from './Hero';
import GameModeGrid from './GameModeGrid';
import classes from '../../styles/Home.module.css';

export default function Home() {
    return (
        <Container size="lg" py="xl" className={classes.container}>
            <Hero />
            <GameModeGrid />
        </Container>
    );
}
