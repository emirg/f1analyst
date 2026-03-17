import React, { useMemo } from 'react';
import { Paper, Typography, Skeleton, Box, Button } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { ComparisonSectorsResponse } from '../../types/f1';

interface SectorTimesChartProps {
    data: ComparisonSectorsResponse | null;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
}

const FASTER_COLOR = '#22c55e';
const SLOWER_COLOR = '#ef4444';

const formatTime = (seconds: number): string => {
    return `${seconds.toFixed(3)}s`;
};

const SectorTimesChart: React.FC<SectorTimesChartProps> = ({ data, loading, error, onRetry }) => {
    const chartData = useMemo(() => {
        if (!data) return [];

        const sectors = ['sector1', 'sector2', 'sector3'] as const;
        const labels = ['S1', 'S2', 'S3'];

        return sectors.map((key, i) => ({
            sector: labels[i],
            [data.driver1.driver]: data.driver1[key],
            [data.driver2.driver]: data.driver2[key],
            d1Faster: data.driver1[key] <= data.driver2[key],
            d2Faster: data.driver2[key] <= data.driver1[key],
        }));
    }, [data]);

    return (
        <Paper sx={{ p: 2, height: '100%', minHeight: 350 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
                Sector Times
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
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2b3d" />
                        <XAxis
                            dataKey="sector"
                            tick={{ fill: '#8b8b9e', fontSize: 12 }}
                            stroke="#2a2b3d"
                        />
                        <YAxis
                            tick={{ fill: '#8b8b9e', fontSize: 12 }}
                            stroke="#2a2b3d"
                            tickFormatter={(v) => formatTime(v)}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1b25',
                                border: '1px solid #2a2b3d',
                                borderRadius: 4,
                                color: '#e4e4e7',
                            }}
                            formatter={(value: any) => formatTime(value as number)}
                        />
                        <Legend wrapperStyle={{ color: '#8b8b9e' }} />
                        <Bar dataKey={data.driver1.driver} barSize={30}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`d1-${index}`}
                                    fill={entry.d1Faster ? FASTER_COLOR : SLOWER_COLOR}
                                />
                            ))}
                        </Bar>
                        <Bar dataKey={data.driver2.driver} barSize={30}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`d2-${index}`}
                                    fill={entry.d2Faster ? FASTER_COLOR : SLOWER_COLOR}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </Paper>
    );
};

export default SectorTimesChart;
