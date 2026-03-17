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
import { ComparisonLapsResponse } from '../../types/f1';

interface LapTimesChartProps {
    data: ComparisonLapsResponse | null;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
}

interface LapRow {
    lap: number;
    [key: string]: number | undefined;
}

const CHART_COLORS = ['#3b82f6', '#f59e0b'];

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}s`;
};

const CustomTooltip = ({
    active,
    payload,
    label,
    driver1,
    driver2,
}: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const d1Val = payload.find((p: any) => p.dataKey === driver1)?.value as number | undefined;
    const d2Val = payload.find((p: any) => p.dataKey === driver2)?.value as number | undefined;
    const delta = d1Val != null && d2Val != null ? d1Val - d2Val : null;

    return (
        <Box sx={{ bgcolor: '#1a1b25', border: '1px solid #2a2b3d', borderRadius: 1, p: 1.5 }}>
            <Typography variant="body2" sx={{ color: '#e4e4e7', mb: 0.5 }}>
                Lap {label}
            </Typography>
            {payload.map((entry: any) => (
                <Typography key={entry.dataKey} variant="body2" sx={{ color: entry.color }}>
                    {entry.dataKey}: {entry.value != null ? formatTime(entry.value as number) : 'N/A'}
                </Typography>
            ))}
            {delta != null && (
                <Typography
                    variant="body2"
                    sx={{ color: delta > 0 ? '#ef4444' : '#22c55e', mt: 0.5, borderTop: '1px solid #2a2b3d', pt: 0.5 }}
                >
                    Delta: {delta > 0 ? '+' : ''}
                    {formatTime(Math.abs(delta))}
                </Typography>
            )}
        </Box>
    );
};

const LapTimesChart: React.FC<LapTimesChartProps> = ({ data, loading, error, onRetry }) => {
    const chartData = useMemo(() => {
        if (!data) return [];
        const lapMap: Record<number, LapRow> = {};
        for (const entry of data.laps) {
            if (!lapMap[entry.lap_number]) {
                lapMap[entry.lap_number] = { lap: entry.lap_number };
            }
            lapMap[entry.lap_number][entry.driver] = entry.time_seconds;
        }
        return Object.values(lapMap).sort((a, b) => a.lap - b.lap);
    }, [data]);

    return (
        <Paper sx={{ p: 2, height: '100%', minHeight: 350 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
                Lap Times
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
                            tick={{ fill: '#8b8b9e', fontSize: 12 }}
                            stroke="#2a2b3d"
                            tickFormatter={(v) => formatTime(v)}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            content={<CustomTooltip driver1={data.driver1} driver2={data.driver2} />}
                        />
                        <Legend wrapperStyle={{ color: '#8b8b9e' }} />
                        <Line
                            type="monotone"
                            dataKey={data.driver1}
                            stroke={CHART_COLORS[0]}
                            dot={false}
                            strokeWidth={2}
                        />
                        <Line
                            type="monotone"
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

export default LapTimesChart;
