import type { MetaFunction } from '@remix-run/node';
import { ModeToggle } from 'components/mode-toggle';

export const meta: MetaFunction = () => {
    return [
        { title: 'Mahjong Club' },
        { name: 'description', content: 'Welcome to Mahjong Club!' },
    ];
};

export default function Index() {
    return (
        <div className="flex w-screen items-center justify-between p-2">
            <h1 className="text-3xl font-bold">Welcome to Mahjong Club!</h1>

            <ModeToggle />
        </div>
    );
}
