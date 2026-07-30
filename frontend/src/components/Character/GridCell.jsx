import { Paper } from '@mantine/core';
import styles from '../../styles/Character.module.css';

export default function GridCell({ children, bg, className }) {
    return (
        <Paper
            bg={bg || "var(--color-border-primary)"}
            shadow="md"
            withBorder
            p="xs"
            className={`${styles.gridCell} ${className || ''}`}
        >
            <div className={styles.cellContent}>
                {children}
            </div>
        </Paper>
    );
}
