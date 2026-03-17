import React, { useMemo } from 'react';
import { Paper, Typography, Skeleton, Box, Button } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { ComparisonPositionsResponse } from '../../types/f1';

interface PositionHistoryChartProps {
    data: ComparisonPositionsResponse | null;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    visible: boolean;
}

const CHART_COLORS = ['#3b82f6', '#f59e0b'];

interface LapRow {
    lap: number;
    [key: string]: number | undefined;
}

const PositionHistoryChart: React.FC<PositionHistoryChartProps> = ({ data, loading, error, onRetry, visible }) => {
    const chartData = useMemo(() => {
        if (!data) return [];
        const lapMap: Record<number, LapRow> = {};
        for (const entry of data.positions) {
            if (!lapMap[entry.lap_number]) {
                lapMap[entry.lap_number] = { lap: entry.lap_number };
            }
            lapMap[entry.lap_number][entry.driver] = entry.position;
        }
        return Object.values(lapMap).sort((a, b) => a.lap - b.lap);
    }, [data]);

    if (!visible) return null;

    return (
        <Paper sx={{ p: 2, height: '100%', minHeight: 350 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
                Position History
            </Typography>

            {loading && (
                <Box>
                    <Skeleton variant="rectangular" height={280} />
                </Box>
            )}

            {error && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
                    <Typography color="error">{error}</Typography>
                    <Button variant="outlined" startIcon={<ReplayIcon />} onClick={onRetry} size="small">
                        Retry
                    </Button>
                </Box>
            )}

            {!loading && !error && data && (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2b3d" />
                        <XAxis
                            dataKey="lap"
                            tick={{ fill: '#8b8b9e', fontSize: 12 }}
                            stroke="#2a2b3d"
                            label={{ value: 'Lap', position: 'insideBottom', offset: -5, fill: '#8b8b9e' }}
                        />
                        <YAxis
                            reversed
                            tick={{ fill: '#8b8b9e', fontSize: 12 }}
                            stroke="#2a2b3d"
                            domain={['dataMin', 'dataMax']}
                            allowDecimals={false}
                            label={{ value: 'Position', angle: -90, position: 'insideLeft', fill: '#8b8b9e' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1b25',
                                border: '1px solid #2a2b3d',
                                borderRadius: 4,
                                color: '#e4e4e7',
                            }}
                        />
                        <Legend wrapperStyle={{ color: '#8b8b9e' }} />
                        <Line
                            type="stepAfter"
                            dataKey={data.driver1}
                            stroke={CHART_COLORS[0]}
                            dot={false}
                            strokeWidth={2}
                        />
                        <Line
                            type="stepAfter"
                            dataKey={data.driver2}
                            stroke={CHART_COLORS[1]}
                            dot={false}
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </Paper>
    );
};

export default PositionHistoryChart;
