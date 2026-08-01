import { Title, Text, Group } from '@mantine/core';
import classes from '../../styles/Home.module.css';
import sethGif from '../../assets/images/seth.gif';
import aquaGif from '../../assets/images/aqua.gif';

export default function Hero() {
    return (
        <div className={classes.heroWrapper}>
            <Group justify="center" align="center" gap="lg" className={classes.heroTitleRow}>
                <img 
                    src={sethGif} 
                    alt="Seth Mascot" 
                    className={classes.heroMascot} 
                />
                <Title 
                    order={1} 
                    className={classes.heroTitle}
                >
                    deltAsong
                </Title>
                <img 
                    src={aquaGif} 
                    alt="Aqua Mascot" 
                    className={classes.heroMascot} 
                />
            </Group>

            <Text size="xl" c="dimmed" maxW={600} mx="auto" className={classes.heroSubtitle}>
                A guessing game set in the Dark World
            </Text>

            <Text size="xl" c="dimmed" maxW={600} mx="auto" className={classes.heroSubtitle}>
                Test Your Deltarune knowledge!
            </Text>
        </div>
    );
}
