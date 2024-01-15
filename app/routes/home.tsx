import { PrismaClient } from '@prisma/client';
import {
    ActionFunctionArgs,
    MetaFunction,
    json,
    redirect,
} from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { format } from 'date-fns/format';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '~/components/ui/card';
import { commitSession, getSession } from '~/sessions.server';

export const meta: MetaFunction = () => {
    return [
        { title: 'Home' },
        { description: 'Check your stats, join a game, and so on.' },
    ];
};

export type Player = {
    id: number;
    name: string;
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const gameSessionId = formData.get('gameSessionId');
    const playerId = formData.get('playerId');

    // Validation payload
    if (
        typeof gameSessionId !== 'string' ||
        typeof playerId !== 'string' ||
        !gameSessionId ||
        !playerId
    ) {
        return json(
            {
                error: 'Invalid payload',
            },
            {
                status: 400,
            }
        );
    }

    const prisma = new PrismaClient();
    const playerAlreadyInGameSession = await prisma.playerInSession.findFirst({
        where: {
            gameSessionId: parseInt(gameSessionId, 10),
            playerId: parseInt(playerId, 10),
        },
    });

    if (playerAlreadyInGameSession) {
        // Remove player from game session
        await prisma.playerInSession.delete({
            where: {
                id: playerAlreadyInGameSession.id,
            },
        });

        return json({
            playerAlreadyInGameSession,
        });
    }

    // Create player in game session
    const playerInGameSession = await prisma.playerInSession.create({
        data: {
            gameSessionId: parseInt(gameSessionId, 10),
            playerId: parseInt(playerId, 10),
        },
    });

    return json({
        playerInGameSession,
    });
};

export const loader = async ({ request }: ActionFunctionArgs) => {
    const session = await getSession(request);
    const playerId = session.get('playerId');
    const prisma = new PrismaClient();

    if (!playerId) {
        return redirect('/');
    }
    // Get player
    const player = await prisma.player.findUnique({
        where: {
            id: playerId,
        },
    });

    if (!player) {
        session.unset('playerId');
        return redirect('/', {
            headers: {
                'Set-Cookie': await commitSession(session),
            },
        });
    }

    // Get future game session list
    const futureGameSessions = await prisma.gameSession.findMany({
        where: {
            date: {
                gte: new Date(),
            },
        },
        include: {
            players: {
                include: {
                    player: true,
                },
            },
        },
    });

    // Get past game session list
    const pastGameSessions = await prisma.gameSession.findMany({
        where: {
            date: {
                lte: new Date(),
            },
        },
        include: {
            players: {
                include: {
                    player: true,
                },
            },
        },
    });

    return {
        player,
        futureGameSessions,
        pastGameSessions,
    };
};

export default function Home() {
    const { player, futureGameSessions, pastGameSessions } =
        useLoaderData<typeof loader>();

    return (
        <div className="container mt-12 space-y-4">
            <h1 className="mb-12 text-3xl font-bold">
                Welcome {player?.name}!
            </h1>

            <div className="grid gap-8 lg:grid-cols-2">
                {futureGameSessions.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="border-b-4 border-teal-500 text-xl font-bold uppercase text-teal-500">
                            Game sessions - Coming soon
                        </h2>
                        <ul className="grid grid-cols-1 gap-4">
                            {futureGameSessions.map((gameSession) => {
                                const isPlayerInGameSession =
                                    gameSession.players.some(
                                        (p) => p.playerId === player?.id
                                    );
                                return (
                                    <li key={gameSession.id}>
                                        <Card>
                                            <CardHeader className="text-xl font-bold">
                                                <div className="flex items-center justify-between">
                                                    <span>
                                                        {format(
                                                            gameSession.date,
                                                            'MMMM do, yyyy'
                                                        )}
                                                    </span>
                                                    <span>
                                                        {format(
                                                            gameSession.date,
                                                            'EEEE'
                                                        )}
                                                    </span>
                                                </div>
                                            </CardHeader>
                                            {gameSession.players.length > 0 && (
                                                <CardContent className="flex flex-wrap gap-2">
                                                    {gameSession.players.map(
                                                        (p) => (
                                                            <Badge
                                                                key={p.id}
                                                                className="bg-purple-500 text-white hover:bg-purple-500 hover:text-white"
                                                            >
                                                                {p.player.name}
                                                            </Badge>
                                                        )
                                                    )}
                                                </CardContent>
                                            )}
                                            <CardFooter className="justify-end border-t pt-4">
                                                <Form method="post">
                                                    <input
                                                        type="hidden"
                                                        name="gameSessionId"
                                                        value={gameSession.id}
                                                    />
                                                    <input
                                                        type="hidden"
                                                        name="playerId"
                                                        value={player.id}
                                                    />
                                                    <Button
                                                        variant={
                                                            isPlayerInGameSession
                                                                ? 'destructive'
                                                                : 'default'
                                                        }
                                                    >
                                                        {isPlayerInGameSession
                                                            ? 'Cancel revervation'
                                                            : 'Secure a spot'}
                                                    </Button>
                                                </Form>
                                            </CardFooter>
                                        </Card>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
                {pastGameSessions.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="border-b-4 border-neutral-500 text-xl font-bold uppercase text-neutral-500">
                            Ended sessions
                        </h2>
                        <ul className="grid grid-cols-1 gap-4">
                            {pastGameSessions.map((gameSession) => (
                                <li key={gameSession.id}>
                                    <Card>
                                        <CardHeader className="text-gray-400">
                                            <div className="flex items-center justify-between">
                                                <span>
                                                    {format(
                                                        gameSession.date,
                                                        'MMMM do, yyyy'
                                                    )}
                                                </span>
                                                <span>
                                                    {format(
                                                        gameSession.date,
                                                        'EEEE'
                                                    )}
                                                </span>
                                            </div>
                                        </CardHeader>
                                        {gameSession.players.length > 0 && (
                                            <CardContent className="flex flex-wrap gap-2">
                                                {gameSession.players.map(
                                                    (p) => (
                                                        <Badge
                                                            key={p.id}
                                                            className="bg-neutral-500 text-white hover:bg-neutral-500 hover:text-white"
                                                        >
                                                            {p.player.name}
                                                        </Badge>
                                                    )
                                                )}
                                            </CardContent>
                                        )}
                                    </Card>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
