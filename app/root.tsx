import stylesheet from '~/tailwind.css';
import type { LinksFunction } from '@remix-run/node';
import clsx from 'clsx';
import {
    PreventFlashOnWrongTheme,
    ThemeProvider,
    useTheme,
} from 'remix-themes';

import { getSession, themeSessionResolver } from './sessions.server';
import { LoaderFunctionArgs } from '@remix-run/node';
import {
    Links,
    LiveReload,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLoaderData,
} from '@remix-run/react';
import { cssBundleHref } from '@remix-run/css-bundle';
import { Header } from './components/header';
import { Footer } from './components/footer';

export const links: LinksFunction = () => [
    { rel: 'stylesheet', href: stylesheet },
    ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

// Return the theme from the session storage using the loader
export async function loader({ request }: LoaderFunctionArgs) {
    const { getTheme } = await themeSessionResolver(request);
    const session = await getSession(request);

    return {
        theme: getTheme(),
        isLoggedIn: session.get('playerId'),
    };
}
// Wrap your app with ThemeProvider.
// `specifiedTheme` is the stored theme in the session storage.
// `themeAction` is the action name that's used to change the theme in the session storage.
export default function AppWithProviders() {
    const data = useLoaderData<typeof loader>();
    return (
        <ThemeProvider
            specifiedTheme={data.theme}
            themeAction="/action/set-theme"
        >
            <App />
        </ThemeProvider>
    );
}

export function App() {
    const data = useLoaderData<typeof loader>();
    const [theme] = useTheme();
    return (
        <html lang="en" className={clsx(theme)}>
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <Meta />
                <PreventFlashOnWrongTheme ssrTheme={Boolean(data.theme)} />
                <Links />
            </head>
            <body className="flex min-h-screen flex-col">
                {data.isLoggedIn && <Header />}
                <main className="flex-1">
                    <Outlet />
                </main>
                <ScrollRestoration />
                <Scripts />
                <LiveReload />
                {data.isLoggedIn && <Footer />}
            </body>
        </html>
    );
}
