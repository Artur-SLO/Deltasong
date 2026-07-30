import { TextInput, Group, Text, Paper } from "@mantine/core";
import { useState } from 'react';
import styles from '../../styles/Song.module.css';

export default function SongSearchBar({ data, songsMap, input, setInput, handleGuess }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const filteredSuggestions = (() => {
        const query = input.toLowerCase().trim();
        if (query === '') return [];
        return data
            .filter(title => title.toLowerCase().includes(query))
            .sort((a, b) => {
                const aLower = a.toLowerCase();
                const bLower = b.toLowerCase();
                const aStartsWith = aLower.startsWith(query);
                const bStartsWith = bLower.startsWith(query);

                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;
                return aLower.localeCompare(bLower);
            });
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
                    placeholder="Type a song title"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setIsOpen(true);
                        setActiveIndex(0);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => {
                        // Delay to allow clicking option before closing
                        setTimeout(() => setIsOpen(false), 50);
                    }}
                    onKeyDown={handleKeyDown}
                    size="md"
                />
            </form>
            {isOpen && filteredSuggestions.length > 0 && (
                <Paper className={styles.dropdown} shadow="md" withBorder>
                    {filteredSuggestions.slice(0, 5).map((title, index) => {
                        const song = songsMap[title];

                        return (
                            <div
                                key={title}
                                className={`${styles.dropdownOption} ${index === activeIndex ? styles.dropdownOptionActive : ''}`}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    submitSelection(title);
                                }}
                                onMouseEnter={() => setActiveIndex(index)}
                            >
                                <Text size="md" className={styles.dropdownText}>
                                    {title}
                                </Text>
                                {song && (
                                    <Text size="xs" className={styles.dropdownMeta}>
                                        Ch. {song.chapter} ({song.duration_formatted})
                                    </Text>
                                )}
                            </div>
                        );
                    })}
                </Paper>
            )}
        </div>
    );
}
