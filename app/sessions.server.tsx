import {
    CookieSerializeOptions,
    Session,
    createCookieSessionStorage,
} from '@remix-run/node';
import { createThemeSessionResolver } from 'remix-themes';

// You can default to 'development' if process.env.NODE_ENV is not set
const isProduction = process.env.NODE_ENV === 'production';

export const sessionStorage = createCookieSessionStorage({
    cookie: {
        name: '__session',
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secrets: ['s3cr3t'],
        // Set domain and secure only if in production
        ...(isProduction
            ? { domain: process.env.PRODUCTION_DOMAIN_URL, secure: true }
            : {}),
    },
});

export async function getSession(request: Request) {
    const cookie = request.headers.get('Cookie');
    return await sessionStorage.getSession(cookie);
}

export async function commitSession(
    session: Session,
    options?: CookieSerializeOptions | undefined
) {
    return await sessionStorage.commitSession(session, options);
}

export const themeSessionResolver = createThemeSessionResolver(sessionStorage);
