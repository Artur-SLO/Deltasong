import { TextInput, Text } from '@mantine/core';
import { useState } from 'react';
import classes from '../../styles/Account.module.css';
import deltaruneCharacters from '../../assets/data/deltarune_characters.json';
import { getCharacterImage } from '../../utils/image.js';

const allCharacters = deltaruneCharacters.filter(c => c.image && c.name);

export default function AvatarSelector({ selectedAvatar, onSelect }) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCharacters = allCharacters.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    return (
        <div>
            <TextInput
                label="Search Avatar Sprite"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                mb="xs"
                size="sm"
            />
            <div className={classes.scrollContainer}>
                <div className={classes.columnsContainer}>
                    {filteredCharacters.map((c, index) => (
                        <div
                            key={`sel-${c.name}-${index}`}
                            className={`${classes.avatarOption} ${selectedAvatar === c.image ? classes.avatarOptionActive : ''}`}
                            onClick={() => onSelect(c.image)}
                        >
                            <div className={classes.avatarImageWrapper}>
                                <img src={getCharacterImage(c.image)} alt={c.name} className={classes.avatarImage} />
                            </div>
                            <div className={classes.avatarLabel}>{c.name}</div>
                        </div>
                    ))}
                </div>
                {filteredCharacters.length === 0 && (
                    <Text size="sm" color="dimmed" ta="center" className={classes.noCharacters}>
                        No characters found
                    </Text>
                )}
            </div>
        </div>
    );
}
