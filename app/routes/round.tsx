import { PrismaClient } from '@prisma/client';
import { ActionFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { Form, useActionData, json, useLoaderData } from '@remix-run/react';
import { format } from 'date-fns';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader } from '~/components/ui/card';

export const meta: MetaFunction = () => {
    return [
        {
            title: 'Game rounds',
        },
    ];
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const prisma = new PrismaClient();
    const formData = await request.formData();
    const number = formData.get('number');
    const gameSessionId = formData.get('gameSessionId');

    // Validate form data
    if (typeof number !== 'string' || typeof gameSessionId !== 'string') {
        return json({ error: 'Invalid form data' }, { status: 400 });
    }

    // Create game round
    const gameRound = await prisma.gameRound.create({
        data: {
            number: Number(number),
            gameSessionId: parseInt(gameSessionId, 10),
        },
    });

    if (!gameRound) {
        return json({ error: 'Failed to create game round' }, { status: 500 });
    }

    // Redirect to home page
    return redirect('/home');
};

export const loader = async () => {
    const prisma = new PrismaClient();

    // Get all game sessions
    const gameSessions = await prisma.gameSession.findMany({
        orderBy: {
            date: 'desc',
        },
    });

    return json({
        gameSessions,
    });
};

const GameRound = () => {
    const actionData = useActionData<typeof action>();
    const { gameSessions } = useLoaderData<typeof loader>();

    return (
        <div className="container space-y-12">
            <h1 className="text-3xl font-bold">Game Round</h1>
            <Card className="text-left">
                <CardHeader>
                    <h2 className="text-xl font-bold">Complete a game round</h2>
                </CardHeader>
                <CardContent>
                    <Form method="post" className="space-y-6">
                        <label className="flex items-center gap-4">
                            Round number
                            <input
                                type="number"
                                name="number"
                                className="w-auto border bg-transparent px-2"
                                min={1}
                                defaultValue={1}
                                required
                            />
                        </label>

                        <label className="flex items-center gap-4">
                            Game session
                            <select
                                name="gameSessionId"
                                required
                                className="w-auto border bg-transparent px-2"
                            >
                                <option value="">Select a game session</option>
                                {gameSessions.length > 0 &&
                                    gameSessions.map((gameSession) => (
                                        <option
                                            key={gameSession.id}
                                            value={gameSession.id}
                                        >
                                            {format(
                                                gameSession.date,
                                                'MMMM do, yyyy'
                                            )}
                                        </option>
                                    ))}
                            </select>
                        </label>

                        <Button
                            size="sm"
                            className="inline-block"
                            type="submit"
                        >
                            Create
                        </Button>
                        {actionData?.error && (
                            <p className="text-red-500">{actionData.error}</p>
                        )}
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default GameRound;
