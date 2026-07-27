import { TextInput, PasswordInput, Button, Text } from '@mantine/core';
import { useState } from 'react';
import { registerUser } from '../../utils/auth';
import { notifications } from '@mantine/notifications';
import AvatarSelector from './AvatarSelector';
import deltaruneCharacters from '../../assets/deltarune_characters.json';

const defaultAvatar = deltaruneCharacters.find(c => c.name.toUpperCase() === 'KRIS')?.image || deltaruneCharacters[0]?.image || '';

export default function RegisterForm({ onRegisterSuccess }) {
    const [regName, setRegName] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(defaultAvatar);
    const [regError, setRegError] = useState('');

    const handleRegister = (e) => {
        e.preventDefault();
        setRegError('');
        try {
            registerUser(regName, regPassword, selectedAvatar);
            setRegName('');
            setRegPassword('');
            notifications.show({
                title: 'Account Created',
                message: 'Your account was successfully created! You can now login.',
                color: 'emeraldGreen',
            });
            if (onRegisterSuccess) {
                onRegisterSuccess();
            }
        } catch (err) {
            setRegError(err.message);
        }
    };

    return (
        <form onSubmit={handleRegister}>
            <TextInput 
                label="Username" 
                placeholder="Choose a username"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                mb="md"
            />
            <PasswordInput 
                label="Password" 
                placeholder="Choose a password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                mb="md"
            />
            
            <AvatarSelector 
                selectedAvatar={selectedAvatar} 
                onSelect={setSelectedAvatar} 
            />

            {regError && (
                <Text color="red" size="sm" mb="md" ta="center">
                    {regError}
                </Text>
            )}

            <Button type="submit" color="royalMagenta" fullWidth mt="lg">
                Create Account
            </Button>
        </form>
    );
}
