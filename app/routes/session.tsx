import { PrismaClient } from '@prisma/client';
import { ActionFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { Form, useActionData, json } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader } from '~/components/ui/card';

export const meta: MetaFunction = () => {
    return [
        {
            title: 'Game sessions',
        },
    ];
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const prisma = new PrismaClient();
    const formData = await request.formData();
    const date = formData.get('date');

    if (!date) {
        return json({
            error: 'Date is required',
        });
    }

    // Check if game session already exists for the date
    const gameSession = await prisma.gameSession.findFirst({
        where: {
            date: new Date(date as string),
        },
    });

    if (gameSession) {
        return json({
            error: 'Game session already exists for this date',
        });
    }

    // Create game session
    await prisma.gameSession.create({
        data: {
            date: new Date(date as string),
        },
    });

    return redirect('/home');
};

const GameSession = () => {
    const actionData = useActionData<typeof action>();
    // Get tomorrow
    const tomorrow = new Date(+new Date() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

    return (
        <div className="container mt-12">
            <h1 className="mb-12 text-3xl font-bold">Game Session</h1>
            <Card className="text-left">
                <CardHeader>
                    <h2 className="text-xl font-bold">
                        Create a new game session
                    </h2>
                </CardHeader>
                <CardContent>
                    <Form method="post" className="space-y-6">
                        <label className="flex items-center gap-4">
                            Date
                            <input
                                type="date"
                                name="date"
                                min={tomorrow}
                                className="w-40 border bg-transparent px-2"
                                defaultValue={tomorrow}
                            />
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

export default GameSession;
