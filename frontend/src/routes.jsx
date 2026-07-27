import App from './App.jsx';
import Home from './components/Home/Home.jsx';
import ErrorPage from './components/Common/ErrorPage.jsx';
import Game from './components/Character/Game.jsx';
import ItemsPage from './components/Item/ItemsPage.jsx';
import SongsPage from './components/Song/SongsPage.jsx';

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
                element: <Game />
            },
            {
                path: "items",
                element: <ItemsPage />
            },
            {
                path: "songs",
                element: <SongsPage />
            }
       ]
    }
];

export default routes;
