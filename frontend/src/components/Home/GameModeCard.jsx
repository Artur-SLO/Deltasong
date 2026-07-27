import { Title, Text, Card, Group, Badge, Button } from '@mantine/core';
import classes from '../../styles/Home.module.css';

export default function GameModeCard({ title, description, badge, color, onPlay }) {
    return (
        <Card 
            shadow="md" 
            padding="lg" 
            radius="md" 
            withBorder
            onClick={onPlay}
        >
            <div className={classes.cardContent}>
                <Group justify="space-between" mb="xs">
                    <Title order={3} className={classes.cardTitle}>
                        {title}
                    </Title>
                    <Badge color={color} variant="light" size="sm">
                        {badge}
                    </Badge>
                </Group>

                <Text size="sm" c="dimmed" mt="sm" mb="md" className={classes.cardDescription}>
                    {description}
                </Text>
                
                <Button 
                    color={color} 
                    fullWidth 
                    mt="md" 
                    radius="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPlay();
                    }}
                >
                    Play
                </Button>
            </div>
        </Card>
    );
}
