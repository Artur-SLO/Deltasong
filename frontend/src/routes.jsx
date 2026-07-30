import App from './App.jsx';
import Home from './components/Home/Home.jsx';
import ErrorPage from './components/Common/ErrorPage.jsx';
import ItemsPage from './components/Item/ItemsPage.jsx';
import SongsPage from './components/Song/SongsPage.jsx';
import AccountPage from './components/Profile/AccountPage.jsx';
import Characters from './components/Character/Characters.jsx';
import DailyGame from './components/Daily/DailyGame.jsx';

const routes = [
    {
        path: "/",
        element: <App />, // Root element
        errorElement: <ErrorPage />, // Fallback in case of misrouting
        children: [
            {
                index: true, // Default route
                element: <Home />
            },
            {
                path: "characters",
                element: <Characters />
            },
            {
                path: "items",
                element: <ItemsPage />
            },
            {
                path: "songs",
                element: <SongsPage />
            },
            {
                path: "daily",
                element: <DailyGame />
            },
            {
                path: "account",
                element: <AccountPage />
            }
       ]
    }
];

export default routes;
