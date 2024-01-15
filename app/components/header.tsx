import { Link, useLocation } from '@remix-run/react';
import { ModeToggle } from './mode-toggle';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuLink,
} from './ui/navigation-menu';

const Header = () => {
    const location = useLocation();
    const activeMenu = (pathname: string) =>
        location.pathname === pathname ? '' : 'text-neutral-500';

    return (
        <header className="border-b py-2">
            <div className="container flex items-center justify-between">
                <div className="flex flex-nowrap gap-8">
                    <Link to="/" className="text-xl font-bold">
                        Mahjong Club!
                    </Link>
                    <NavigationMenu className="text-sm">
                        <NavigationMenuList className="flex gap-4">
                            <NavigationMenuItem>
                                <NavigationMenuLink
                                    href="/home"
                                    className={activeMenu('/home')}
                                >
                                    Home
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink
                                    href="/session"
                                    className={activeMenu('/session')}
                                >
                                    Session
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink
                                    href="/round"
                                    className={activeMenu('/round')}
                                >
                                    Round
                                </NavigationMenuLink>
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
