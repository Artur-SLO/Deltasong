import { Title, Text } from '@mantine/core';
import classes from '../../styles/Home.module.css';

export default function Hero() {
    return (
        <div className={classes.heroWrapper}>
            <Title 
                order={1} 
                className={classes.heroTitle}
            >
                deltAsong
            </Title>

            <Text size="xl" c="dimmed" maxW={600} mx="auto" className={classes.heroSubtitle}>
                A guessing game set in the Dark World
            </Text>

            <Text size="xl" c="dimmed" maxW={600} mx="auto" className={classes.heroSubtitle}>
                Test Your Deltarune knowledge!
            </Text>
        </div>
    );
}
