import { useState } from 'react';
import { Button, Text } from '@mantine/core';
import { ITEM_CATEGORIES } from '../../config/Constants.js';
import styles from '../../styles/Item.module.css';

export default function ItemModeSelector({ onSelect }) {
    const [tempMode, setTempMode] = useState('');

    return (
        <div className={styles.modeSelectorContainer}>
            <Text size="sm" className={styles.detailLabel}>
                Choose a Game Mode to Start
            </Text>
            <div className={styles.modeButtonGroup}>
                <Button
                    onClick={() => onSelect('all', '')}
                    color="royalMagenta"
                    variant="filled"
                    className={styles.modeButton}
                    size="sm"
                >
                    All Items
                </Button>
                <Button
                    onClick={() => setTempMode('category')}
                    color="royalMagenta"
                    variant="filled"
                    className={styles.modeButton}
                    size="sm"
                >
                    By Category
                </Button>
            </div>

            {tempMode === 'category' && (
                <div className={styles.categoryGroup}>
                    {ITEM_CATEGORIES.map((cat) => {
                        return (
                            <Button
                                key={cat.value}
                                onClick={() => onSelect('category', cat.value)}
                                color="royalMagenta"
                                variant="light"
                                className={styles.categoryButton}
                                size="xs"
                                radius="md"
                            >
                                {cat.label}
                            </Button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
