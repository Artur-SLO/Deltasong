import { Title, Text, Card, Group, Badge, Button } from '@mantine/core';
import classes from '../../styles/Home.module.css';
import { 
    GAME_MODE_SPRITES, 
    GAME_MODE_HOVER_COLORS, 
    GAME_MODE_SHADOW_COLORS 
} from '../../config/Constants';

export default function GameModeCard({ title, description, badge, color, onPlay, isDaily }) {
    const hoverColor = GAME_MODE_HOVER_COLORS[color] || '#00ff27';
    const shadowColor = GAME_MODE_SHADOW_COLORS[color] || 'rgba(0, 255, 39, 0.4)';

    if (isDaily) {
        return (
            <Card 
                shadow="xl" 
                padding="xl" 
                radius="md" 
                withBorder
                className={`${classes.modeCard} ${classes.dailyCard}`}
                onClick={onPlay}
            >
                <div className={classes.dailyCardContent}>
                    <Title order={2} className={classes.dailyCardTitle}>
                        {title}
                    </Title>
                    <Button 
                        size="md" 
                        radius="sm"
                        className={classes.dailyPlayBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            onPlay();
                        }}
                    >
                        Play Challenge
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card
            shadow="md"
            padding="lg"
            radius="md"
            withBorder
            className={classes.modeCard}
            style={{
                '--hover-border': hoverColor,
                '--hover-glow': shadowColor
            }}
            onClick={onPlay}
        >
            <div className={classes.cardContent}>
                <Group justify="space-between" mb="xs" align="center" wrap="nowrap">
                    <Title order={3} className={classes.cardTitle}>
                        {title}
                    </Title>
                    {GAME_MODE_SPRITES[title] ? (
                        <img 
                            src={GAME_MODE_SPRITES[title]} 
                            alt={title} 
                            className={classes.cardBadgeImage} 
                        />
                    ) : (
                        <Badge color={color} variant="light" size="sm">
                            {badge}
                        </Badge>
                    )}
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
