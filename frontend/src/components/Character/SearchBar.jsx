import { Autocomplete, Group, Text } from "@mantine/core";
import styles from '../../styles/Character.module.css';

export default function SearchBar({ data, charactersMap, input, setInput, handleGuess }) {
    const filteredSuggestions = input.trim() === '' ? []
        : data.filter(name => name.toLowerCase().includes(input.toLowerCase().trim()));

    const submitSelection = (valueToSubmit) => {
        if (!valueToSubmit) return;

        handleGuess(null, valueToSubmit);

        setTimeout(() => {
            setInput('');
        }, 0);
    };

    const handleSubmitForm = (e) => {
        e.preventDefault();
        if (filteredSuggestions.length > 0) {
            submitSelection(filteredSuggestions[0]);
        }
    };

    return (
        <form onSubmit={handleSubmitForm} className={styles.searchBar}>
            <Autocomplete
                placeholder="Type a character name..."
                data={filteredSuggestions}
                value={input}
                onChange={setInput}
                onOptionSubmit={(val) => submitSelection(val)}
                selectFirstOptionOnChange
                limit={5}
                renderOption={({ option }) => {
                    const character = charactersMap[option.value];

                    return (
                        <Group gap="xs" wrap="nowrap" style={{ padding: '2px 0' }}>
                            {character?.image && (
                                <img
                                    src={character.image}
                                    alt={option.value}
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        objectFit: 'contain',
                                        imageRendering: 'pixelated'
                                    }}
                                />
                            )}
                            <Text size="md">
                                {option.value}
                            </Text>
                        </Group>
                    );
                }}
                style={{ width: '100%' }}
                size="md"
            />
        </form>
    );
}
