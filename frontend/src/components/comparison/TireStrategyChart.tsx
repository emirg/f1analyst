import React, { useMemo } from 'react';
import { Paper, Typography, Skeleton, Box, Button } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { ComparisonStrategyResponse, Stint } from '../../types/f1';

interface TireStrategyChartProps {
    data: ComparisonStrategyResponse | null;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
}

const COMPOUND_COLORS: Record<string, string> = {
    SOFT: '#ef4444',
    MEDIUM: '#f59e0b',
    HARD: '#e4e4e7',
    INTERMEDIATE: '#22c55e',
    WET: '#3b82f6',
    UNKNOWN: '#6b7280',
};

interface StintBar {
    driver: string;
    stints: Stint[];
    [key: string]: number | string | Stint[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const entry = payload[0]?.payload as StintBar;
    if (!entry) return null;

    return (
        <Box sx={{ bgcolor: '#1a1b25', border: '1px solid #2a2b3d', borderRadius: 1, p: 1.5 }}>
            <Typography variant="body2" sx={{ color: '#e4e4e7', fontWeight: 600, mb: 0.5 }}>
                {entry.driver}
            </Typography>
            {entry.stints.map((stint) => (
                <Typography key={stint.stint_number} variant="body2" sx={{ color: '#8b8b9e' }}>
                    Stint {stint.stint_number}: {stint.compound} (Laps {stint.lap_start}-{stint.lap_end})
                </Typography>
            ))}
        </Box>
    );
};

const TireStrategyChart: React.FC<TireStrategyChartProps> = ({ data, loading, error, onRetry }) => {
    const { chartData, maxStints } = useMemo(() => {
        if (!data) return { chartData: [], maxStints: 0 };

        const buildRow = (strategy: typeof data.driver1): StintBar => {
            const row: StintBar = { driver: strategy.driver, stints: strategy.stints };
            strategy.stints.forEach((stint, i) => {
                row[`stint${i}`] = stint.laps;
            });
            return row;
        };

        const d1 = buildRow(data.driver1);
        const d2 = buildRow(data.driver2);
        const max = Math.max(data.driver1.stints.length, data.driver2.stints.length);

        return { chartData: [d1, d2], maxStints: max };
    }, [data]);

    return (
        <Paper sx={{ p: 2, height: '100%', minHeight: 350 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
                Tire Strategy
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
                    <BarChart data={chartData} layout="vertical" barSize={40}>
                        <XAxis
                            type="number"
                            tick={{ fill: '#8b8b9e', fontSize: 12 }}
                            stroke="#2a2b3d"
                            label={{ value: 'Laps', position: 'insideBottom', offset: -5, fill: '#8b8b9e' }}
                        />
                        <YAxis
                            type="category"
                            dataKey="driver"
                            tick={{ fill: '#8b8b9e', fontSize: 12 }}
                            stroke="#2a2b3d"
                            width={60}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {Array.from({ length: maxStints }, (_, i) => (
                            <Bar key={`stint${i}`} dataKey={`stint${i}`} stackId="stints">
                                {chartData.map((entry, j) => {
                                    const stint = entry.stints[i];
                                    const compound = stint?.compound?.toUpperCase() || 'UNKNOWN';
                                    return (
                                        <Cell
                                            key={`cell-${j}`}
                                            fill={COMPOUND_COLORS[compound] || COMPOUND_COLORS.UNKNOWN}
                                        />
                                    );
                                })}
                            </Bar>
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            )}

            {/* Compound legend */}
            {!loading && !error && data && (
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 1, flexWrap: 'wrap' }}>
                    {['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'].map((compound) => (
                        <Box key={compound} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    bgcolor: COMPOUND_COLORS[compound],
                                }}
                            />
                            <Typography variant="body2" sx={{ color: '#8b8b9e', fontSize: 11 }}>
                                {compound}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}
        </Paper>
    );
};

export default TireStrategyChart;
