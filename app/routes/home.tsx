import { PrismaClient } from '@prisma/client';
import {
    ActionFunctionArgs,
    LoaderFunctionArgs,
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

export const loader = async ({ request }: LoaderFunctionArgs) => {
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

    // Get number of game sessions where player is in
    const playerGameSessionCount = await prisma.playerInSession.count({
        where: {
            playerId: playerId,
        },
    });

    // TODO: Get number of game sessions where player is in

    // Get number of game rounds where player won
    const winningRoundCount = await prisma.gameRound.count({
        where: {
            playerId: playerId,
        },
    });

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
            rounds: {
                include: {
                    winner: true,
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
            rounds: {
                include: {
                    winner: true,
                },
            },
        },
    });

    return {
        player,
        playerGameSessionCount,
        winningRoundCount,
        futureGameSessions,
        pastGameSessions,
    };
};

export default function Home() {
    const {
        player,
        playerGameSessionCount,
        winningRoundCount,
        futureGameSessions,
        pastGameSessions,
    } = useLoaderData<typeof loader>();

    return (
        <div className="container space-y-12">
            <h1 className="text-3xl font-bold">Welcome {player.name}!</h1>

            <div className="grid gap-8 md:grid-cols-3">
                <Card>
                    <CardHeader>Sessions participated</CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">
                            {playerGameSessionCount}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>Round played</CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">TBD</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>Winning rounds</CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{winningRoundCount}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {futureGameSessions.length > 0 && (
                    <div className="space-y-8">
                        <h2 className="border-b-4 border-teal-500 text-xl font-bold uppercase text-teal-500">
                            Game sessions - Coming soon
                        </h2>
                        <ul className="grid grid-cols-1 gap-4">
                            {futureGameSessions.map((gameSession) => {
                                const isPlayerInGameSession =
                                    gameSession.players.some(
                                        (p) => p.playerId === player.id
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
                                                <CardContent>
                                                    <div className="flex flex-wrap gap-2">
                                                        {gameSession.players.map(
                                                            (p) => (
                                                                <Badge
                                                                    key={p.id}
                                                                >
                                                                    {
                                                                        p.player
                                                                            .name
                                                                    }
                                                                </Badge>
                                                            )
                                                        )}
                                                    </div>
                                                    {gameSession.rounds.length >
                                                        0 && (
                                                        <div>
                                                            {gameSession.rounds.map(
                                                                (r) => (
                                                                    <div
                                                                        key={
                                                                            r.id
                                                                        }
                                                                        className="text-red"
                                                                    >
                                                                        {
                                                                            r
                                                                                .winner
                                                                                .name
                                                                        }
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
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
                                                        size="sm"
                                                        variant={
                                                            isPlayerInGameSession
                                                                ? 'secondary'
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
                    <div className="space-y-8">
                        <h2 className="border-b-4 border-neutral-500 text-xl font-bold uppercase text-neutral-500">
                            Ended sessions
                        </h2>
                        <ul className="grid grid-cols-1 gap-4">
                            {pastGameSessions.map((gameSession) => (
                                <li key={gameSession.id}>
                                    <Card className="text-neutral-500">
                                        <CardHeader>
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
                                            <CardContent className="space-y-4">
                                                <div className="flex flex-wrap gap-2">
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
                                                </div>
                                                {gameSession.rounds.length >
                                                    0 && (
                                                    <div className="flex flex-col gap-2 pt-6">
                                                        <h3 className="mb-2 text-lg font-bold">
                                                            Winners 🎉🎉
                                                        </h3>
                                                        <div>
                                                            {gameSession.rounds.map(
                                                                (r) => (
                                                                    <div
                                                                        className="flex justify-between gap-4 border-t p-2 last:border-b"
                                                                        key={
                                                                            r.id
                                                                        }
                                                                    >
                                                                        <div>{`Round ${r.number}`}</div>
                                                                        <div>
                                                                            {
                                                                                r
                                                                                    .winner
                                                                                    .name
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
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
