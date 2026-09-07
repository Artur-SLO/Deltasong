import { Container, Group, Title, Burger, Drawer, Stack } from '@mantine/core';
import { Link, useLocation } from 'react-router';
import { useState, useEffect } from 'react';
import { IconFlame, IconLogin } from '@tabler/icons-react';
import classes from '../../styles/Mantine/Header.module.css';
import { getActiveUser, updateActiveUserStreak } from '../../utils/auth';
import { getCharacterImage } from '../../utils/image.js';

import { LINKS } from '../../config/Constants';

export default function Header() {
    const location = useLocation();
    const [activeUser, setActiveUser] = useState(() => getActiveUser());
    const [mobileOpened, setMobileOpened] = useState(false);

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

    // Close mobile menu on route change or when resized to desktop
    useEffect(() => {
        setMobileOpened(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 960 && window.innerHeight > 550) {
                setMobileOpened(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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
        <>
            <header className={classes.header}>
                <Container fluid className={classes.inner}>

                    <div className={classes.brandGroup}>
                        <Burger
                            opened={mobileOpened}
                            onClick={() => setMobileOpened((o) => !o)}
                            size="sm"
                            color="var(--color-text-primary)"
                            className={classes.burger}
                            aria-label="Toggle navigation"
                        />
                        <Link to="/" className={classes.linkWrapper}>
                            <Title order={3} className={classes.title}>deltAsong</Title>
                        </Link>
                    </div>

                    <Group gap={3} className={classes.subjects}>
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
                                    src={getCharacterImage(activeUser.avatar)}
                                    alt={activeUser.name}
                                    className={classes.headerAvatar}
                                />
                            </Group>
                        ) : (
                            <div className={classes.loginButton}>
                                <IconLogin size={15} className={classes.loginIcon} />
                                <span className={classes.buttonText}>Login</span>
                            </div>
                        )}
                    </Link>
                </Container>
            </header>

            <Drawer
                opened={mobileOpened}
                onClose={() => setMobileOpened(false)}
                size="75%"
                transitionProps={{ duration: 0 }}
                title={<Title order={4} className={classes.title}>deltAsong</Title>}
                classNames={{
                    content: classes.drawerContent,
                    header: classes.drawerHeader,
                    body: classes.drawerBody,
                    overlay: classes.drawerOverlay,
                }}
            >
                <Stack gap={0}>
                    {items}
                </Stack>

                {!activeUser ? (
                    <div className={classes.drawerAuthSection}>
                        <div className={classes.drawerAuthCard}>
                            <div className={classes.drawerAuthTextGroup}>
                                <div className={classes.drawerAuthTitle}>Join Deltasong</div>
                                <div className={classes.drawerAuthSubtitle}>
                                    Save streaks, stats and climb the leaderboard!
                                </div>
                            </div>
                            <Link
                                to="/account"
                                className={classes.drawerAuthButton}
                                onClick={() => setMobileOpened(false)}
                            >
                                <IconLogin size={16} className={classes.drawerAuthIcon} />
                                <span>Login / Register</span>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className={classes.drawerUserSection}>
                        <Link
                            to="/account"
                            className={classes.drawerUserCard}
                            onClick={() => setMobileOpened(false)}
                        >
                            <img
                                src={getCharacterImage(activeUser.avatar)}
                                alt={activeUser.name}
                                className={classes.drawerUserAvatar}
                            />
                            <div className={classes.drawerUserInfo}>
                                <span className={classes.drawerUserName}>{activeUser.name}</span>
                                <span className={classes.drawerUserStreak}>
                                    <IconFlame size={14} className={classes.flameIcon} /> {activeUser.streak} streak
                                </span>
                            </div>
                        </Link>
                    </div>
                )}
            </Drawer>
        </>
    );
}
