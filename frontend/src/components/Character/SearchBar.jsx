import { TextInput, Group, Text, Paper } from "@mantine/core";
import { useState } from 'react';
import styles from '../../styles/Character.module.css';

export default function SearchBar({ data, charactersMap, input, setInput, handleGuess }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const filteredSuggestions = (() => {
        const query = input.toLowerCase().trim();
        if (query === '') return [];
        return data
            .filter(name => name.toLowerCase().startsWith(query))
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    })();

    const limit = Math.min(5, filteredSuggestions.length);

    const submitSelection = (valueToSubmit) => {
        if (!valueToSubmit) return;

        handleGuess(null, valueToSubmit);
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
                    placeholder="Type a character name"
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
                />
            </form>
            {isOpen && filteredSuggestions.length > 0 && (
                <Paper className={styles.dropdown} shadow="md" withBorder>
                    {filteredSuggestions.slice(0, 5).map((name, index) => {
                        const character = charactersMap[name];

                        return (
                            <Group
                                key={name}
                                gap="xs"
                                wrap="nowrap"
                                className={`${styles.dropdownOption} ${index === activeIndex ? styles.dropdownOptionActive : ''}`}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    submitSelection(name);
                                }}
                                onMouseEnter={() => setActiveIndex(index)}
                            >
                                {character?.image && (
                                    <img
                                        src={character.image}
                                        alt={name}
                                        className={styles.suggestionImage}
                                    />
                                )}
                                <Text size="md" style={{ color: 'var(--color-text-primary)' }}>
                                    {name}
                                </Text>
                            </Group>
                        );
                    })}
                </Paper>
            )}
        </div>
    );
}
