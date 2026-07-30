// Default imports
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Mantine imports
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from './styles/Mantine/theme.js';
import './styles/global.css';
import './styles/Mantine/overrides.css';
import '@mantine/notifications/styles.css';

// Router config
import routes from "./routes.jsx";
import { createBrowserRouter, RouterProvider } from "react-router";
const router = createBrowserRouter(routes, {
    basename: import.meta.env.BASE_URL,
});

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <MantineProvider theme={theme}>
            <Notifications position="top-right" zIndex={1000} />
            <RouterProvider router={router} />
        </MantineProvider>
    </StrictMode>,
)
