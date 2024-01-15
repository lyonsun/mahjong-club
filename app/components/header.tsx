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
                                    className={
                                        location.pathname === '/home'
                                            ? ''
                                            : 'text-neutral-500'
                                    }
                                >
                                    Home
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink
                                    href="/session"
                                    className={
                                        location.pathname === '/session'
                                            ? ''
                                            : 'text-neutral-500'
                                    }
                                >
                                    Session
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
