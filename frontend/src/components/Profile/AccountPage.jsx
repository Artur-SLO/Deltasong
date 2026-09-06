import { Container, Paper, Tabs, Text } from '@mantine/core';
import { useState, useEffect } from 'react';
import classes from '../../styles/Account.module.css';
import { getActiveUser } from '../../utils/auth';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ProfileDashboard from './ProfileDashboard';
import gersonBoomImage from '../../assets/images/gerson-boom.gif';
import { IconBrandGithub } from '@tabler/icons-react';

export default function AccountPage() {
    const [activeUser, setActiveUser] = useState(() => getActiveUser());
    const [activeTab, setActiveTab] = useState('login');

    useEffect(() => {
        const handleSync = () => {
            const user = getActiveUser();
            setActiveUser(user ? { ...user } : null);
        };

        handleSync();

        window.addEventListener('deltasong_auth_change', handleSync);
        window.addEventListener('deltasong_rank_change', handleSync);
        return () => {
            window.removeEventListener('deltasong_auth_change', handleSync);
            window.removeEventListener('deltasong_rank_change', handleSync);
        };
    }, []);

    return (
        <Container size={activeUser ? 'sm' : 'xs'} className={classes.container}>
            {/* Floating GitHub Mascot on the left */}
            <a
                href="https://github.com/Artur-SLO/Deltasong"
                target="_blank"
                rel="noopener noreferrer"
                className={classes.githubMascotLink}
                title="View Deltasong repository on GitHub"
                aria-label="GitHub Repository"
            >
                <div className={classes.mascotBubble}>GitHub ↗</div>
                <div className={classes.mascotOrb}>
                    <IconBrandGithub size={36} stroke={1.8} />
                </div>
            </a>

            <Paper shadow="md" p="xl" radius="md" withBorder className={classes.paper}>
                {activeUser ? (
                    <ProfileDashboard activeUser={activeUser} />
                ) : (
                    <>
                        <div className={classes.welcomeHeader}>
                            <img src={gersonBoomImage} alt="Gerson Welcome" className={classes.ralseiWelcome} />
                            <div className={classes.welcomeTitle}>
                                Deltasong Account
                            </div>
                        </div>
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
                    </>
                )}

                {!activeUser && (
                    <Paper p="sm" radius="xs" withBorder className={classes.privacyNote}>
                        <Text size="xs" ta="center" c="dimmed" lh={1.45}>
                            <Text component="span" fw={700} c="gray.4">Privacy & Account Note:</Text>{' '}
                            Registering stores your chosen nickname, avatar, and game stats to sync your progress and rank on the leaderboard. Passwords are securely hashed and encrypted. We do not collect real personal data or track you across the web.
                        </Text>
                    </Paper>
                )}
            </Paper>
        </Container>
    );
}
