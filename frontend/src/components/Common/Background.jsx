import { Box } from '@mantine/core';
import styles from '../../styles/Background.module.css';

export default function Background() {
    return (
        <Box className={styles.backgroundContainer}>
            <Box className={styles.backgroundImage} />
            <Box className={styles.overlay} />
        </Box>
    );
}