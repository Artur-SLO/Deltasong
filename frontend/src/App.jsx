import '@mantine/core/styles.css';
import { Outlet } from 'react-router';
import { AppShell } from '@mantine/core';
import Header from './components/Common/Header.jsx';


export default function App() {
    return (
        <AppShell header={{ height: 60 }} padding="md">
            <AppShell.Header>
                <Header />
            </AppShell.Header>

            <AppShell.Main bg="blue.3">
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
}
