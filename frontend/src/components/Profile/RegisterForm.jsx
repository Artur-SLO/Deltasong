import { TextInput, PasswordInput, Button, Text } from '@mantine/core';
import { useState } from 'react';
import { registerUser } from '../../utils/auth';
import { notifications } from '@mantine/notifications';
import AvatarSelector from './AvatarSelector';
import deltaruneCharacters from '../../assets/data/deltarune_characters.json';

const defaultAvatar = deltaruneCharacters.find(c => c.name.toUpperCase() === 'KRIS')?.image || deltaruneCharacters[0]?.image || '';

export default function RegisterForm({ onRegisterSuccess }) {
    const [regName, setRegName] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(defaultAvatar);
    const [regError, setRegError] = useState('');

    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setRegError('');
        setLoading(true);
        try {
            await registerUser(regName, regPassword, selectedAvatar);
            setRegName('');
            setRegPassword('');
            notifications.show({
                title: 'Account Created',
                message: 'Your account was successfully created! You are now logged in.',
                color: 'emeraldGreen',
            });
            if (onRegisterSuccess) {
                onRegisterSuccess();
            }
        } catch (err) {
            setRegError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleRegister}>
            <TextInput 
                label="Username" 
                placeholder="Choose a username (max 18 chars)"
                required
                maxLength={18}
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

            <Button type="submit" color="royalMagenta" fullWidth mt="lg" loading={loading}>
                Create Account
            </Button>
        </form>
    );
}
