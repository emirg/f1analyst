import React from 'react';
import { Paper, Typography, Skeleton, Box } from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

interface StandingsDataItem {
    name: string;
    points: number;
    color: string;
}

interface StandingsChartProps {
    title: string;
    data: StandingsDataItem[] | null;
}

const StandingsChart: React.FC<StandingsChartProps> = ({ title, data }) => {
    if (!data) {
        return (
            <Paper sx={{ p: 3 }}>
                <Skeleton variant="text" width="30%" height={28} />
                <Skeleton variant="rectangular" height={300} sx={{ mt: 2, borderRadius: 1 }} />
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
                {title}
            </Typography>
            <Box sx={{ width: '100%', height: Math.max(300, data.length * 40) }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                        style={{ backgroundColor: 'transparent' }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2b3d" horizontal={false} />
                        <XAxis
                            type="number"
                            tick={{ fill: '#8b8b9e', fontSize: 12 }}
                            axisLine={{ stroke: '#2a2b3d' }}
                            tickLine={{ stroke: '#2a2b3d' }}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fill: '#8b8b9e', fontSize: 12 }}
                            axisLine={{ stroke: '#2a2b3d' }}
                            tickLine={false}
                            width={75}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1b25',
                                border: '1px solid #2a2b3d',
                                borderRadius: 6,
                                color: '#e4e4e7',
                            }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            formatter={(value: any) => [`${value} pts`, 'Points']}
                        />
                        <Bar dataKey="points" radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default StandingsChart;
