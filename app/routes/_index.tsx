import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
    return [
        { title: 'Mahjong Club' },
        { name: 'description', content: 'Welcome to Mahjong Club!' },
    ];
};

export default function Index() {
    return (
        <div className="flex h-screen flex-col items-center justify-center">
            <h1 className="text-3xl font-bold">Welcome to Mahjong Club!</h1>
        </div>
    );
}
