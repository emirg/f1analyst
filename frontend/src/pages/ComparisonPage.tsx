import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import ComparisonSelectors from '../components/comparison/ComparisonSelectors';
import LapTimesChart from '../components/comparison/LapTimesChart';
import TelemetryChart from '../components/comparison/TelemetryChart';
import SectorTimesChart from '../components/comparison/SectorTimesChart';
import TireStrategyChart from '../components/comparison/TireStrategyChart';
import PositionHistoryChart from '../components/comparison/PositionHistoryChart';
import AIAnalysisPanel from '../components/comparison/AIAnalysisPanel';
import {
    ComparisonQueryParams,
    ComparisonLapsResponse,
    ComparisonTelemetryResponse,
    ComparisonSectorsResponse,
    ComparisonStrategyResponse,
    ComparisonPositionsResponse,
} from '../types/f1';
import {
    getComparisonLaps,
    getComparisonTelemetry,
    getComparisonSectors,
    getComparisonStrategy,
    getComparisonPositions,
} from '../services/api';

interface ChartState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

function initialState<T>(): ChartState<T> {
    return { data: null, loading: false, error: null };
}

const ComparisonPage: React.FC = () => {
    const [params, setParams] = useState<ComparisonQueryParams | null>(null);

    const [laps, setLaps] = useState<ChartState<ComparisonLapsResponse>>(initialState());
    const [telemetry, setTelemetry] = useState<ChartState<ComparisonTelemetryResponse>>(initialState());
    const [sectors, setSectors] = useState<ChartState<ComparisonSectorsResponse>>(initialState());
    const [strategy, setStrategy] = useState<ChartState<ComparisonStrategyResponse>>(initialState());
    const [positions, setPositions] = useState<ChartState<ComparisonPositionsResponse>>(initialState());

    const fetchLaps = useCallback((p: ComparisonQueryParams) => {
        setLaps({ data: null, loading: true, error: null });
        getComparisonLaps(p)
            .then((data) => setLaps({ data, loading: false, error: null }))
            .catch((err) => setLaps({ data: null, loading: false, error: err.message }));
    }, []);

    const fetchTelemetry = useCallback((p: ComparisonQueryParams) => {
        setTelemetry({ data: null, loading: true, error: null });
        getComparisonTelemetry(p)
            .then((data) => setTelemetry({ data, loading: false, error: null }))
            .catch((err) => setTelemetry({ data: null, loading: false, error: err.message }));
    }, []);

    const fetchSectors = useCallback((p: ComparisonQueryParams) => {
        setSectors({ data: null, loading: true, error: null });
        getComparisonSectors(p)
            .then((data) => setSectors({ data, loading: false, error: null }))
            .catch((err) => setSectors({ data: null, loading: false, error: err.message }));
    }, []);

    const fetchStrategy = useCallback((p: ComparisonQueryParams) => {
        setStrategy({ data: null, loading: true, error: null });
        getComparisonStrategy(p)
            .then((data) => setStrategy({ data, loading: false, error: null }))
            .catch((err) => setStrategy({ data: null, loading: false, error: err.message }));
    }, []);

    const fetchPositions = useCallback((p: ComparisonQueryParams) => {
        setPositions({ data: null, loading: true, error: null });
        getComparisonPositions(p)
            .then((data) => setPositions({ data, loading: false, error: null }))
            .catch((err) => setPositions({ data: null, loading: false, error: err.message }));
    }, []);

    const handleSubmit = useCallback(
        (p: ComparisonQueryParams) => {
            setParams(p);
            // Fire all 5 fetches independently (not Promise.all)
            fetchLaps(p);
            fetchTelemetry(p);
            fetchSectors(p);
            fetchStrategy(p);
            fetchPositions(p);
        },
        [fetchLaps, fetchTelemetry, fetchSectors, fetchStrategy, fetchPositions]
    );

    const isRace = params?.session?.toLowerCase() === 'race';

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Selectors */}
            <ComparisonSelectors onSubmit={handleSubmit} />

            {/* Chart grid */}
            {params && (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                        gap: 2,
                        mt: 3,
                    }}
                >
                    <LapTimesChart
                        data={laps.data}
                        loading={laps.loading}
                        error={laps.error}
                        onRetry={() => fetchLaps(params)}
                    />
                    <TelemetryChart
                        data={telemetry.data}
                        loading={telemetry.loading}
                        error={telemetry.error}
                        onRetry={() => fetchTelemetry(params)}
                    />
                    <SectorTimesChart
                        data={sectors.data}
                        loading={sectors.loading}
                        error={sectors.error}
                        onRetry={() => fetchSectors(params)}
                    />
                    <TireStrategyChart
                        data={strategy.data}
                        loading={strategy.loading}
                        error={strategy.error}
                        onRetry={() => fetchStrategy(params)}
                    />
                    <PositionHistoryChart
                        data={positions.data}
                        loading={positions.loading}
                        error={positions.error}
                        onRetry={() => fetchPositions(params)}
                        visible={isRace}
                    />
                    <AIAnalysisPanel params={params} />
                </Box>
            )}
        </Box>
    );
};

export default ComparisonPage;
