import { TextInput, PasswordInput, Button, Text } from '@mantine/core';
import { useState } from 'react';
import { loginUser } from '../../utils/auth';
import { notifications } from '@mantine/notifications';

export default function LoginForm() {
    const [loginName, setLoginName] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        setLoginError('');
        try {
            loginUser(loginName, loginPassword);
            setLoginName('');
            setLoginPassword('');
            notifications.show({
                title: 'Logged In',
                message: 'Welcome back to Deltasong!',
                color: 'cyberCyan',
            });
        } catch (err) {
            setLoginError(err.message);
        }
    };

    return (
        <form onSubmit={handleLogin}>
            <TextInput 
                label="Username" 
                placeholder="Your username"
                required
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                mb="md"
            />
            <PasswordInput 
                label="Password" 
                placeholder="Your password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                mb="md"
            />

            {loginError && (
                <Text color="red" size="sm" mb="md" ta="center">
                    {loginError}
                </Text>
            )}

            <Button type="submit" color="cyberCyan" fullWidth mt="lg">
                Login
            </Button>
        </form>
    );
}
