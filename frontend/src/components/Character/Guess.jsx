import { Flex, Paper, Title, Text } from "@mantine/core";

export default function Guess({ image, name, gender, type, chapter, role, first_appearence, index }) {
    return (
        <Flex
            mih={50}
            gap="md"
            justify="center"
            align="center"
            direction="row"
            wrap="nowrap"
        >
            <Paper shadow="md" p="xl" radius="md" withBorder>
                <Text size="lg" ta="center" mb="lg" c="dimmed">
                    hello test
                </Text>
                <Text size="lg" ta="center" mb="lg" c="dimmed">
                    hello test
                </Text>
                <Text size="lg" ta="center" mb="lg" c="dimmed">
                    hello test
                </Text>
            </Paper>
        </Flex>
    )
}

