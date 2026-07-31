import '@mantine/core/styles.css';
import { Outlet } from 'react-router';
import { AppShell } from '@mantine/core';
import { useState } from 'react';
import Header from './components/Common/Header.jsx';
import Background from './components/Common/Background.jsx';
import HelpWidget from './components/Common/HelpWidget.jsx';
import { HelpWidgetContext } from './utils/HelpWidgetContext.js';

export default function App() {
    const [isHelpWidgetHidden, setIsHelpWidgetHidden] = useState(false);

    return (
        <HelpWidgetContext.Provider value={{ isHelpWidgetHidden, setIsHelpWidgetHidden }}>
            <Background />
            <AppShell header={{ height: 60 }} padding="md">
                <AppShell.Header>
                    <Header />
                </AppShell.Header>

                <AppShell.Main>
                    <Outlet />
                    {!isHelpWidgetHidden && <HelpWidget />}
                </AppShell.Main>
            </AppShell>
        </HelpWidgetContext.Provider>
    );
}