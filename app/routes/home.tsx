import { PrismaClient } from '@prisma/client';
import { ActionFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { getSession } from '~/sessions.server';

export const meta: MetaFunction = () => {
    return [
        { title: 'Home' },
        { description: 'Check your stats, join a game, and so on.' },
    ];
};

export const loader = async ({ request }: ActionFunctionArgs) => {
    const session = await getSession(request);
    const playerId = session.get('playerId');
    const prisma = new PrismaClient();

    if (!playerId) {
        return redirect('/');
    }

    const player = await prisma.player.findUnique({
        where: {
            id: playerId,
        },
    });
    return player;
};

export default function Home() {
    const player = useLoaderData<typeof loader>();
    return (
        <div className="flex h-screen flex-col items-center justify-center">
            <h1 className="text-3xl font-bold">Welcome {player?.name}!</h1>
        </div>
    );
}
