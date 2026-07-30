import { Container, Group, Title } from '@mantine/core';
import { Link, useLocation } from 'react-router';
import { useState, useEffect } from 'react';
import { IconFlame } from '@tabler/icons-react';
import classes from '../../styles/Mantine/Header.module.css';
import { getActiveUser, updateActiveUserStreak } from '../../utils/auth';

import { LINKS } from '../../config/Constants';

export default function Header() {
    const location = useLocation();
    const [activeUser, setActiveUser] = useState(null);

    useEffect(() => {
        // Update streak if applicable, then fetch active user
        updateActiveUserStreak();
        setActiveUser(getActiveUser());

        const handleAuthChange = () => {
            setActiveUser(getActiveUser());
        };

        window.addEventListener('deltasong_auth_change', handleAuthChange);
        return () => {
            window.removeEventListener('deltasong_auth_change', handleAuthChange);
        };
    }, []);

    const items = LINKS.map((link) => (
        <Link
            key={link.label}
            to={link.link}
            className={classes.link}
            data-active={location.pathname === link.link || undefined}
        >
            <span className={classes.linkText}>{link.label}</span>
        </Link>
    ));

    return (
        <header className={classes.header}>
            <Container fluid className={classes.inner}>

                <Link to="/" className={classes.linkWrapper}>
                        <Title order={3} className={classes.title}>deltAsong</Title>
                </Link>
                <Group gap={3} visibleFrom="xs" className={classes.subjects}>
                    {items}
                </Group>

                <Link to="/account" className={classes.linkWrapper}>
                    {activeUser ? (
                        <Group gap="xs" className={classes.profileGroup}>
                            <div className={classes.streakBadge}>
                                <IconFlame size={20} className={classes.flameIcon} /> {activeUser.streak}
                            </div>
                            <span className={classes.headerName}>{activeUser.name}</span>
                            <img 
                                src={activeUser.avatar} 
                                alt={activeUser.name} 
                                className={classes.headerAvatar} 
                            />
                        </Group>
                    ) : (
                            <div className={classes.loginButton}>
                                <span className={classes.buttonText}>Login</span>
                            </div>
                        )}
                </Link>
            </Container>
        </header>
    );
}
