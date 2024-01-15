import { FC } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';

type FigureCardProps = {
    text: string;
    value: number;
};

const FigureCard: FC<FigureCardProps> = ({ text, value }) => (
    <Card>
        <CardHeader>{text}</CardHeader>
        <CardContent>
            <p className="text-xl font-bold">{value}</p>
        </CardContent>
    </Card>
);

export { FigureCard };
