import React, { useMemo, useState } from 'react';
import { Paper, Typography, Skeleton, Box, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
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
import { ComparisonTelemetryResponse } from '../../types/f1';

interface TelemetryChartProps {
    data: ComparisonTelemetryResponse | null;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
}

type TelemetryChannel = 'speed' | 'throttle' | 'brake';

interface MergedPoint {
    distance: number;
    [key: string]: number;
}

const CHANNEL_LABELS: Record<TelemetryChannel, string> = {
    speed: 'Speed (km/h)',
    throttle: 'Throttle (%)',
    brake: 'Brake',
};

const TelemetryChart: React.FC<TelemetryChartProps> = ({ data, loading, error, onRetry }) => {
    const [channel, setChannel] = useState<TelemetryChannel>('speed');

    const chartData = useMemo(() => {
        if (!data) return [];

        // Merge both drivers' telemetry by distance
        const pointMap: Record<number, MergedPoint> = {};
        const addPoints = (driverData: typeof data.driver1) => {
            for (const pt of driverData.data) {
                const dist = Math.round(pt.distance);
                if (!pointMap[dist]) {
                    pointMap[dist] = { distance: dist };
                }
                const val =
                    channel === 'speed'
                        ? pt.speed
                        : channel === 'throttle'
                          ? pt.throttle
                          : pt.brake
                            ? 1
                            : 0;
                pointMap[dist][driverData.driver] = val;
            }
        };

        addPoints(data.driver1);
        addPoints(data.driver2);

        return Object.values(pointMap).sort((a, b) => a.distance - b.distance);
    }, [data, channel]);

    const color1 = data?.driver1.team_color || '#3b82f6';
    const color2 = data?.driver2.team_color || '#f59e0b';

    return (
        <Paper sx={{ p: 2, height: '100%', minHeight: 350 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h4">Telemetry</Typography>
                <ToggleButtonGroup
                    value={channel}
                    exclusive
                    onChange={(_, v) => v && setChannel(v as TelemetryChannel)}
                    size="small"
                >
                    <ToggleButton value="speed">Speed</ToggleButton>
                    <ToggleButton value="throttle">Throttle</ToggleButton>
                    <ToggleButton value="brake">Brake</ToggleButton>
                </ToggleButtonGroup>
            </Box>

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
                            dataKey="distance"
                            tick={{ fill: '#8b8b9e', fontSize: 12 }}
                            stroke="#2a2b3d"
                            label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5, fill: '#8b8b9e' }}
                        />
                        <YAxis
                            tick={{ fill: '#8b8b9e', fontSize: 12 }}
                            stroke="#2a2b3d"
                            label={{
                                value: CHANNEL_LABELS[channel],
                                angle: -90,
                                position: 'insideLeft',
                                fill: '#8b8b9e',
                            }}
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
                            type="monotone"
                            dataKey={data.driver1.driver}
                            stroke={color1}
                            dot={false}
                            strokeWidth={2}
                        />
                        <Line
                            type="monotone"
                            dataKey={data.driver2.driver}
                            stroke={color2}
                            dot={false}
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </Paper>
    );
};

export default TelemetryChart;
