import { Container, Group, Title } from '@mantine/core';
import { Link, useLocation } from 'react-router';
import classes from '../../styles/Mantine/Header.module.css';

import { LINKS } from '../../config/Constants';

export default function Header() {
    const location = useLocation();
    const items = LINKS.map((link) => (
        <Link
            key={link.label}
            to={link.link}
            className={classes.link}
            data-active={location.pathname === link.link || undefined}
        >
            {link.label}
        </Link>
    ));

    return (
        <header className={classes.header}>
            <Container size="xl" className={classes.inner}>

                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Title order={3} className={classes.title}>deltAsong</Title>
                </Link>
                <Group gap={3} visibleFrom="xs" className={classes.subjects}>
                    {items}
                </Group>
            </Container>
        </header>
    );
}