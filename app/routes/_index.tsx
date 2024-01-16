import { Player, PrismaClient } from '@prisma/client';
import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    MetaFunction,
} from '@remix-run/node';
import { Form, json, redirect, useActionData } from '@remix-run/react';
import { ModeToggle } from '~/components/mode-toggle';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { commitSession, getSession } from '~/sessions.server';

export const meta: MetaFunction = () => {
    return [
        { title: 'Mahjong Club!' },
        { name: 'description', content: 'Welcome to Mahjong Club!' },
    ];
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const player = formData.get('player');
    const prisma = new PrismaClient();
    const session = await getSession(request);

    // Validate data
    if (!player) {
        return json({
            error: 'Player name is required',
        });
    }

    if (typeof player !== 'string') {
        return json({
            error: 'Player name must be a string',
        });
    }

    let currentPlayer: Player;

    // Check if player exists
    const existingPlayer = await prisma.player.findFirst({
        where: {
            name: player as string,
        },
    });

    if (!existingPlayer) {
        // Save data
        const newPlayer = await prisma.player.create({
            data: {
                name: player as string,
            },
        });
        currentPlayer = newPlayer;
    } else {
        currentPlayer = existingPlayer;
    }

    // Set current player
    session.set('playerId', currentPlayer.id);

    // Redirect to game
    return redirect('/home', {
        headers: {
            'Set-Cookie': await commitSession(session, {
                maxAge: 60 * 60 * 24 * 7, // 7 days,
            }),
        },
    });
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const session = await getSession(request);
    const playerId = session.get('playerId');

    if (playerId) {
        return redirect('/home');
    }
    return null;
};

export default function Index() {
    const actionData = useActionData<typeof action>();

    return (
        <div className="relative">
            <div className="absolute bottom-4 right-4">
                <ModeToggle />
            </div>
            <div className="flex h-screen w-screen flex-col items-center justify-center">
                <Card className="shadow-2xl">
                    <CardHeader>
                        <h1 className="bg-gradient-to-r from-teal-400 to-purple-600 bg-clip-text text-center text-4xl font-bold text-transparent">
                            Mahjong Club!
                        </h1>
                    </CardHeader>
                    <CardContent>
                        <Form
                            method="post"
                            className="flex w-80 flex-col gap-4"
                        >
                            <Input
                                type="text"
                                name="player"
                                placeholder="Your name"
                                className="rounded p-2 text-center text-sm font-bold"
                                required
                            />

                            {actionData?.error && (
                                <p className="text-center text-red-500">
                                    {actionData.error}
                                </p>
                            )}

                            <Button className="font-bold" type="submit">
                                Enter
                            </Button>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
