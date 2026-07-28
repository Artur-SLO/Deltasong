import { Paper, Text } from '@mantine/core';

export default function GridCell({ children }) {
    return (
        <Paper
            ff="var(--font-family-deltarune)"
            bg="var(--color-border-primary)"
            shadow="md"
            withBorder
            p="lg"
        >
            <Text size="lg" style={{ whiteSpace: 'nowrap' }}>{children}</Text>
        </Paper>
    );
}
