import '@mantine/core/styles.css';
import { Outlet } from 'react-router';
import { AppShell } from '@mantine/core';
import Header from './components/Common/Header.jsx';
import Background from './components/Common/Background.jsx';
import HelpWidget from './components/Common/HelpWidget.jsx';


export default function App() {
    return (
        <>
            <Background />
            <AppShell header={{ height: 60 }} padding="md">
                <AppShell.Header>
                    <Header />
                </AppShell.Header>

                <AppShell.Main>
                    <Outlet />
                    <HelpWidget />
                </AppShell.Main>
            </AppShell>
        </>
    );
}
