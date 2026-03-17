import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    TextField,
    Button,
    MenuItem,
    CircularProgress,
    Typography,
    Paper,
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useYear } from '../../contexts/YearContext';
import { getYearData, getGPSessions } from '../../services/api';
import { ComparisonQueryParams, SessionInfo } from '../../types/f1';

interface ComparisonSelectorsProps {
    onSubmit: (params: ComparisonQueryParams) => void;
}

const ComparisonSelectors: React.FC<ComparisonSelectorsProps> = ({ onSubmit }) => {
    const { year } = useYear();

    const [gp, setGp] = useState('');
    const [session, setSession] = useState('');
    const [driver1, setDriver1] = useState('');
    const [driver2, setDriver2] = useState('');

    const [gpList, setGpList] = useState<string[]>([]);
    const [sessionsList, setSessionsList] = useState<SessionInfo[]>([]);
    const [driversList, setDriversList] = useState<string[]>([]);

    const [loadingGps, setLoadingGps] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(false);

    // Load GPs and drivers when year changes
    useEffect(() => {
        let cancelled = false;
        setLoadingGps(true);
        setGp('');
        setSession('');
        setDriver1('');
        setDriver2('');
        setSessionsList([]);
        setDriversList([]);

        getYearData(year)
            .then((data) => {
                if (!cancelled) {
                    setGpList(data.grand_prix);
                    setDriversList(data.drivers);
                }
            })
            .catch((err) => {
                console.error('Failed to load year data:', err);
            })
            .finally(() => {
                if (!cancelled) setLoadingGps(false);
            });

        return () => {
            cancelled = true;
        };
    }, [year]);

    // Load sessions when GP changes
    useEffect(() => {
        if (!gp) {
            setSessionsList([]);
            setSession('');
            return;
        }

        let cancelled = false;
        setLoadingSessions(true);
        setSession('');
        setDriver1('');
        setDriver2('');

        getGPSessions(year, gp)
            .then((data) => {
                if (!cancelled) {
                    setSessionsList(data.sessions);
                }
            })
            .catch((err) => {
                console.error('Failed to load sessions:', err);
            })
            .finally(() => {
                if (!cancelled) setLoadingSessions(false);
            });

        return () => {
            cancelled = true;
        };
    }, [year, gp]);

    const handleSubmit = useCallback(() => {
        if (gp && session && driver1 && driver2) {
            onSubmit({ year, gp, session, driver1, driver2 });
        }
    }, [year, gp, session, driver1, driver2, onSubmit]);

    const isLoading = loadingGps || loadingSessions;
    const canSubmit = gp && session && driver1 && driver2 && driver1 !== driver2 && !isLoading;

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>
                    Driver Comparison
                </Typography>

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'auto 1fr 1fr 1fr 1fr auto' },
                        gap: 2,
                        alignItems: 'center',
                    }}
                >
                    {/* Year display (read-only) */}
                    <TextField
                        label="Year"
                        value={year}
                        size="small"
                        slotProps={{ input: { readOnly: true } }}
                        sx={{ minWidth: 80 }}
                    />

                    {/* GP selector */}
                    <TextField
                        select
                        label="Grand Prix"
                        value={gp}
                        onChange={(e) => setGp(e.target.value)}
                        disabled={isLoading || gpList.length === 0}
                        size="small"
                        sx={{ minWidth: 180 }}
                    >
                        {gpList.map((name) => (
                            <MenuItem key={name} value={name}>
                                {name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Session selector */}
                    <TextField
                        select
                        label="Session"
                        value={session}
                        onChange={(e) => setSession(e.target.value)}
                        disabled={isLoading || sessionsList.length === 0}
                        size="small"
                        sx={{ minWidth: 150 }}
                    >
                        {sessionsList.map((s) => (
                            <MenuItem key={s.session_key} value={s.type}>
                                {s.type}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Driver 1 selector */}
                    <TextField
                        select
                        label="Driver 1"
                        value={driver1}
                        onChange={(e) => setDriver1(e.target.value)}
                        disabled={isLoading || driversList.length === 0 || !session}
                        size="small"
                        sx={{ minWidth: 130 }}
                    >
                        {driversList
                            .filter((d) => d !== driver2)
                            .map((d) => (
                                <MenuItem key={d} value={d}>
                                    {d}
                                </MenuItem>
                            ))}
                    </TextField>

                    {/* Driver 2 selector */}
                    <TextField
                        select
                        label="Driver 2"
                        value={driver2}
                        onChange={(e) => setDriver2(e.target.value)}
                        disabled={isLoading || driversList.length === 0 || !session}
                        size="small"
                        sx={{ minWidth: 130 }}
                    >
                        {driversList
                            .filter((d) => d !== driver1)
                            .map((d) => (
                                <MenuItem key={d} value={d}>
                                    {d}
                                </MenuItem>
                            ))}
                    </TextField>

                    {/* Submit button */}
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        startIcon={isLoading ? <CircularProgress size={18} /> : <CompareArrowsIcon />}
                        sx={{ py: 1, minWidth: 120 }}
                    >
                        Compare
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default ComparisonSelectors;
