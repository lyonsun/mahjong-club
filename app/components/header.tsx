import { Link, NavLink, useLocation } from '@remix-run/react';
import { ModeToggle } from './mode-toggle';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from './ui/navigation-menu';

const Header = () => {
    const location = useLocation();
    const activeMenu = (pathname: string) =>
        location.pathname === pathname ? 'active' : 'text-neutral-500';

    return (
        <header className="mb-12 border-b py-2">
            <div className="container flex items-center justify-between">
                <div className="flex flex-nowrap gap-8">
                    <Link to="/" className="text-xl font-bold">
                        Mahjong Club!
                    </Link>
                    <NavigationMenu className="text-sm">
                        <NavigationMenuList className="flex gap-4">
                            <NavigationMenuItem>
                                <NavLink
                                    to="/home"
                                    className={activeMenu('/home')}
                                >
                                    Home
                                </NavLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavLink
                                    to="/session"
                                    className={activeMenu('/session')}
                                >
                                    Session
                                </NavLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavLink
                                    to="/round"
                                    className={activeMenu('/round')}
                                >
                                    Round
                                </NavLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>
                <ModeToggle />
            </div>
        </header>
    );
};

export { Header };
