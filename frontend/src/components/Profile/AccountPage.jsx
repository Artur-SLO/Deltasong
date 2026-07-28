import { Container, Paper, Tabs, Text } from '@mantine/core';
import { useState, useEffect } from 'react';
import classes from '../../styles/Account.module.css';
import { getActiveUser } from '../../utils/auth';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ProfileDashboard from './ProfileDashboard';

export default function AccountPage() {
    const [activeUser, setActiveUser] = useState(null);
    const [activeTab, setActiveTab] = useState('login');

    useEffect(() => {
        setActiveUser(getActiveUser());

        const handleAuthChange = () => {
            setActiveUser(getActiveUser());
        };

        window.addEventListener('deltasong_auth_change', handleAuthChange);
        return () => {
            window.removeEventListener('deltasong_auth_change', handleAuthChange);
        };
    }, []);

    return (
        <Container size={activeUser ? 'sm' : 'xs'} className={classes.container}>
            <Paper shadow="md" p="xl" radius="md" withBorder className={classes.paper}>
                {activeUser ? (
                    <ProfileDashboard activeUser={activeUser} />
                ) : (
                    <Tabs value={activeTab} onChange={setActiveTab} color="cyberCyan">
                        <Tabs.List grow mb="md">
                            <Tabs.Tab value="login" className={classes.tabButton}>Login</Tabs.Tab>
                            <Tabs.Tab value="register" className={classes.tabButton}>Register</Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="login">
                            <LoginForm />
                        </Tabs.Panel>

                        <Tabs.Panel value="register">
                            <RegisterForm onRegisterSuccess={() => setActiveTab('login')} />
                        </Tabs.Panel>
                    </Tabs>
                )}

                {!activeUser && (
                    <Paper p="sm" radius="xs" withBorder className={classes.privacyNote}>
                        <Text size="xs" ta="center" c="dimmed">
                            Privacy Note: Your username, password, and stats are stored 100% locally on your computer via localStorage. No data is ever sent to any server.
                        </Text>
                    </Paper>
                )}
            </Paper>
        </Container>
    );
}
