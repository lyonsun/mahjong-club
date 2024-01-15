import { Link } from '@remix-run/react';
import { ModeToggle } from './mode-toggle';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from './ui/navigation-menu';
const Header = () => (
    <header className="border-b py-2">
        <div className="container flex items-center justify-between">
            <Link to="/" className="text-xl font-bold">
                Mahjong Club!
            </Link>
            <NavigationMenu>
                <NavigationMenuList className="flex gap-4">
                    <NavigationMenuItem>
                        <Link to="/">Home</Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <Link to="/session">Session</Link>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
            <ModeToggle />
        </div>
    </header>
);

export { Header };
