import { TextInput, Paper, Text } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import styles from '../../styles/Item.module.css';

export default function ItemSearchBar({ data, input, setInput, handleGuess }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const filteredSuggestions = (() => {
        const query = input.toLowerCase().trim();
        if (query === '') return [];
        return data
            .filter(item => item.name.toLowerCase().includes(query))
            .sort((a, b) => {
                const aLower = a.name.toLowerCase();
                const bLower = b.name.toLowerCase();
                const aStartsWith = aLower.startsWith(query);
                const bStartsWith = bLower.startsWith(query);

                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;
                return aLower.localeCompare(bLower);
            });
    })();

    const limit = Math.min(5, filteredSuggestions.length);

    const submitSelection = (itemToSubmit) => {
        if (!itemToSubmit) return;

        handleGuess(null, itemToSubmit.name);
        setInput('');
        setIsOpen(false);
        setActiveIndex(0);
    };

    const handleSubmitForm = (e) => {
        e.preventDefault();
        if (filteredSuggestions.length > 0) {
            submitSelection(filteredSuggestions[activeIndex] || filteredSuggestions[0]);
        }
    };

    const handleKeyDown = (e) => {
        if (!isOpen || filteredSuggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => (prev + 1) % limit);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => (prev - 1 + limit) % limit);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
        }
    };

    return (
        <div className={styles.searchBar}>
            <form onSubmit={handleSubmitForm}>
                <TextInput
                    leftSection={<IconSearch size={18} opacity={0.6} />}
                    placeholder="Search item name..."
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setIsOpen(true);
                        setActiveIndex(0);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => {
                        setTimeout(() => setIsOpen(false), 200);
                    }}
                    onKeyDown={handleKeyDown}
                    size="md"
                    autoComplete="off"
                />
            </form>
            {isOpen && filteredSuggestions.length > 0 && (
                <Paper className={styles.dropdown} shadow="md" withBorder>
                    {filteredSuggestions.slice(0, 5).map((item, index) => {
                        return (
                            <div
                                key={`${item.name}-${item.type}-${index}`}
                                className={`${styles.dropdownOption} ${index === activeIndex ? styles.dropdownOptionActive : ''}`}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    submitSelection(item);
                                }}
                                onMouseEnter={() => setActiveIndex(index)}
                            >
                                <Text className={styles.dropdownText}>
                                    {item.name}
                                </Text>
                                <Text className={styles.dropdownMeta}>
                                    {item.type}
                                </Text>
                            </div>
                        );
                    })}
                </Paper>
            )}
        </div>
    );
}
