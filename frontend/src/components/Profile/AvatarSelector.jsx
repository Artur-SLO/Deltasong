import { TextInput, Text } from '@mantine/core';
import { useState } from 'react';
import classes from '../../styles/Account.module.css';
import deltaruneCharacters from '../../assets/deltarune_characters.json';

const allCharacters = deltaruneCharacters.filter(c => c.image && c.name);

export default function AvatarSelector({ selectedAvatar, onSelect }) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCharacters = allCharacters.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    const col1 = [];
    const col2 = [];
    const col3 = [];
    filteredCharacters.forEach((c, index) => {
        if (index % 3 === 0) col1.push({ c, index });
        else if (index % 3 === 1) col2.push({ c, index });
        else col3.push({ c, index });
    });

    return (
        <div>
            <TextInput 
                label="Search Avatar Sprite" 
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                mb="xs"
                size="xs"
            />
            <div className={classes.scrollContainer} style={{ maxHeight: '200px' }}>
                <div className={classes.columnsContainer} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--mantine-spacing-xs)', width: '100%', boxSizing: 'border-box' }}>
                    <div className={classes.avatarColumn} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mantine-spacing-xs)', minWidth: 0 }}>
                        {col1.map(({ c, index }) => (
                            <div 
                                key={`sel-${c.name}-${index}`}
                                className={`${classes.avatarOption} ${selectedAvatar === c.image ? classes.avatarOptionActive : ''}`}
                                onClick={() => onSelect(c.image)}
                            >
                                <div className={classes.avatarImageWrapper}>
                                    <img src={c.image} alt={c.name} className={classes.avatarImage} />
                                </div>
                                <div className={classes.avatarLabel}>{c.name}</div>
                            </div>
                        ))}
                    </div>
                    <div className={classes.avatarColumn} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mantine-spacing-xs)', minWidth: 0 }}>
                        {col2.map(({ c, index }) => (
                            <div 
                                key={`sel-${c.name}-${index}`}
                                className={`${classes.avatarOption} ${selectedAvatar === c.image ? classes.avatarOptionActive : ''}`}
                                onClick={() => onSelect(c.image)}
                            >
                                <div className={classes.avatarImageWrapper}>
                                    <img src={c.image} alt={c.name} className={classes.avatarImage} />
                                </div>
                                <div className={classes.avatarLabel}>{c.name}</div>
                            </div>
                        ))}
                    </div>
                    <div className={classes.avatarColumn} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mantine-spacing-xs)', minWidth: 0 }}>
                        {col3.map(({ c, index }) => (
                            <div 
                                key={`sel-${c.name}-${index}`}
                                className={`${classes.avatarOption} ${selectedAvatar === c.image ? classes.avatarOptionActive : ''}`}
                                onClick={() => onSelect(c.image)}
                            >
                                <div className={classes.avatarImageWrapper}>
                                    <img src={c.image} alt={c.name} className={classes.avatarImage} />
                                </div>
                                <div className={classes.avatarLabel}>{c.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
                {filteredCharacters.length === 0 && (
                    <Text size="sm" color="dimmed" ta="center" style={{ width: '100%', padding: 'var(--mantine-spacing-md)', gridColumn: 'span 3' }}>
                        No characters found
                    </Text>
                )}
            </div>
        </div>
    );
}
