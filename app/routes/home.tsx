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
import { FigureCard } from '~/components/figure-card';
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

const prisma = new PrismaClient();

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const gameSessionId = formData.get('gameSessionId');
    const playerId = formData.get('playerId');
    const gameRoundId = formData.get('gameRoundId');
    const action = formData.get('action');

    if (action === 'join-game-session') {
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

        const playerAlreadyInGameSession =
            await prisma.playerInSession.findFirst({
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
    }

    if (action === 'join-game-round') {
        // Validation payload
        if (
            typeof playerId !== 'string' ||
            typeof gameRoundId !== 'string' ||
            !playerId ||
            !gameRoundId
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

        const playerAlreadyInGameRound = await prisma.playerInRound.findFirst({
            where: {
                gameRoundId: parseInt(gameRoundId, 10),
                playerId: parseInt(playerId, 10),
            },
        });

        if (playerAlreadyInGameRound) {
            // Remove player from game round
            await prisma.playerInRound.delete({
                where: {
                    id: playerAlreadyInGameRound.id,
                },
            });

            return json({
                playerAlreadyInGameRound,
            });
        }

        // Create player in game round
        const playerInGameRound = await prisma.playerInRound.create({
            data: {
                gameRoundId: parseInt(gameRoundId, 10),
                playerId: parseInt(playerId, 10),
            },
        });

        return json({
            playerInGameRound,
        });
    }

    return json(
        {
            error: 'Invalid action',
        },
        {
            status: 400,
        }
    );
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const session = await getSession(request);
    const playerId = session.get('playerId');

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

    //Get number of game rounds where player is in
    const playerGameRoundCount = await prisma.playerInRound.count({
        where: {
            playerId: playerId,
        },
    });

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
        orderBy: {
            date: 'asc',
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
                    PlayerInRound: true,
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
        orderBy: {
            date: 'desc',
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
        playerGameRoundCount,
        winningRoundCount,
        futureGameSessions,
        pastGameSessions,
    };
};

export default function Home() {
    const {
        player,
        playerGameSessionCount,
        playerGameRoundCount,
        winningRoundCount,
        futureGameSessions,
        pastGameSessions,
    } = useLoaderData<typeof loader>();

    return (
        <div className="container space-y-12">
            <h1 className="text-3xl font-bold">Welcome {player.name}!</h1>

            <div className="grid gap-8 md:grid-cols-3">
                <FigureCard
                    text="Sessions participated"
                    value={playerGameSessionCount}
                />
                <FigureCard text="Rounds played" value={playerGameRoundCount} />
                <FigureCard text="Winning rounds" value={winningRoundCount} />
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
                                                <CardContent className="space-y-6">
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
                                                        <div className="flex flex-col gap-4">
                                                            {gameSession.rounds.map(
                                                                (r) => {
                                                                    const isPlayerInGameRound =
                                                                        r.PlayerInRound.some(
                                                                            (
                                                                                p
                                                                            ) =>
                                                                                p.playerId ===
                                                                                player.id
                                                                        );

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                r.id
                                                                            }
                                                                            className="flex items-center justify-between gap-4 border p-4"
                                                                        >
                                                                            <div>
                                                                                {`Round ${r.number}`}
                                                                            </div>

                                                                            <Form method="post">
                                                                                <input
                                                                                    type="hidden"
                                                                                    name="playerId"
                                                                                    value={
                                                                                        player.id
                                                                                    }
                                                                                />
                                                                                <input
                                                                                    type="hidden"
                                                                                    name="gameRoundId"
                                                                                    value={
                                                                                        r.id
                                                                                    }
                                                                                />
                                                                                <input
                                                                                    type="hidden"
                                                                                    name="action"
                                                                                    value="join-game-round"
                                                                                />

                                                                                <Button
                                                                                    size="sm"
                                                                                    variant={
                                                                                        isPlayerInGameRound
                                                                                            ? 'secondary'
                                                                                            : 'default'
                                                                                    }
                                                                                >
                                                                                    {isPlayerInGameRound
                                                                                        ? 'Played'
                                                                                        : 'Not played'}
                                                                                </Button>
                                                                            </Form>
                                                                        </div>
                                                                    );
                                                                }
                                                            )}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            )}
                                            <CardFooter className="justify-end">
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
                                                    <input
                                                        type="hidden"
                                                        name="action"
                                                        value="join-game-session"
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
                                                        <h3 className="mb-2 font-bold">
                                                            🎉 Winners 🎉
                                                        </h3>
                                                        <div>
                                                            {gameSession.rounds.map(
                                                                (r) => (
                                                                    <div
                                                                        className="flex justify-between gap-4 border-t p-2"
                                                                        key={
                                                                            r.id
                                                                        }
                                                                    >
                                                                        <div>{`Round ${r.number}`}</div>
                                                                        <div>
                                                                            {
                                                                                r
                                                                                    .winner
                                                                                    ?.name
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
