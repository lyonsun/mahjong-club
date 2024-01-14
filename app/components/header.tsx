import { Link } from '@remix-run/react';
import { ModeToggle } from './mode-toggle';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from './ui/navigation-menu';
const Header = () => (
    <header className="container flex items-center justify-between py-4">
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
    </header>
);

export { Header };
