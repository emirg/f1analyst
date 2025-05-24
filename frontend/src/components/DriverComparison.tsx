import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    TextField,
    Button,
    Typography,
    Paper,
    MenuItem,
    CircularProgress,
} from '@mui/material';
import { ComparisonFormData } from '../types/f1';
import Markdown from 'react-markdown'

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

interface GPInfo {
    roundNumber: number;
    eventName: string;
    eventFormat: string;
}

interface SessionInfo {
    type: string;
    date: string;
}

const DriverComparison: React.FC = () => {
    const [formData, setFormData] = useState<ComparisonFormData>({
        year: new Date().getFullYear(),
        grandPrix: '',
        session: '',
        driver1: '',
        driver2: '',
    });

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [comparisonResult, setComparisonResult] = useState<string>('');
    
    // States for loaded data
    const [grandPrixList, setGrandPrixList] = useState<GPInfo[]>([]);
    const [sessionsList, setSessionsList] = useState<SessionInfo[]>([]);
    const [driversList, setDriversList] = useState<string[]>([]);

    // Load Grand Prix when year changes
    useEffect(() => {
        const fetchGrandPrix = async () => {
            if (!formData.year) return;
            
            setLoadingData(true);
            try {
                const response = await fetch(`http://localhost:5000/get-year-calendar?year=${formData.year}`);
                const data = await response.json();
                if (data.error) {
                    console.error('Error fetching calendar:', data.error);
                    return;
                }
                setGrandPrixList(data.calendar);
                // Reset selections when year changes
                setFormData(prev => ({
                    ...prev,
                    grandPrix: '',
                    session: '',
                    driver1: '',
                    driver2: ''
                }));
                setSessionsList([]);
                setDriversList([]);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchGrandPrix();
    }, [formData.year]);

    // Load sessions when Grand Prix changes
    useEffect(() => {
        const fetchSessions = async () => {
            if (!formData.year || !formData.grandPrix) return;
            
            setLoadingData(true);
            try {
                const response = await fetch(
                    `http://localhost:5000/get-gp-sessions?year=${formData.year}&grandPrix=${formData.grandPrix}`
                );
                const data = await response.json();
                if (data.error) {
                    console.error('Error fetching sessions:', data.error);
                    return;
                }
                setSessionsList(data.sessions);
                // Reset session and driver selections
                setFormData(prev => ({
                    ...prev,
                    session: '',
                    driver1: '',
                    driver2: ''
                }));
                setDriversList([]);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchSessions();
    }, [formData.year, formData.grandPrix]);

    // Load drivers when session changes
    useEffect(() => {
        const fetchDrivers = async () => {
            if (!formData.year || !formData.grandPrix || !formData.session) return;
            
            setLoadingData(true);
            try {
                const response = await fetch(
                    `http://localhost:5000/get-session-drivers?year=${formData.year}&grandPrix=${formData.grandPrix}&session=${formData.session}`
                );
                const data = await response.json();
                if (data.error) {
                    console.error('Error fetching drivers:', data.error);
                    return;
                }
                setDriversList(data.drivers);
                // Reset driver selections
                setFormData(prev => ({
                    ...prev,
                    driver1: '',
                    driver2: ''
                }));
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchDrivers();
    }, [formData.year, formData.grandPrix, formData.session]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/compare-drivers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            setComparisonResult(data.analysis);
        } catch (error) {
            console.error('Error:', error);
            setComparisonResult('Error al obtener la comparación. Por favor, intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    F1 Driver Comparison
                </Typography>
                
                <Paper sx={{ p: 3, mb: 3 }}>
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                <Box sx={{ flex: '1 1 300px' }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Year"
                                        name="year"
                                        value={formData.year}
                                        onChange={handleInputChange}
                                    >
                                        {YEARS.map((year) => (
                                            <MenuItem key={year} value={year}>
                                                {year}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                                
                                <Box sx={{ flex: '1 1 300px' }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Grand Prix"
                                        name="grandPrix"
                                        value={formData.grandPrix}
                                        onChange={handleInputChange}
                                        disabled={loadingData || !formData.year}
                                    >
                                        {grandPrixList.map((gp) => (
                                            <MenuItem key={gp.eventName} value={gp.eventName}>
                                                {gp.eventName}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                <Box sx={{ flex: '1 1 300px' }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Session"
                                        name="session"
                                        value={formData.session}
                                        onChange={handleInputChange}
                                        disabled={loadingData || !formData.grandPrix}
                                    >
                                        {sessionsList.map((session) => (
                                            <MenuItem key={session.type} value={session.type}>
                                                {session.type}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                                
                                <Box sx={{ flex: '1 1 300px' }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="First Driver"
                                        name="driver1"
                                        value={formData.driver1}
                                        onChange={handleInputChange}
                                        disabled={loadingData || !formData.session}
                                    >
                                        {driversList.map((driver) => (
                                            <MenuItem key={driver} value={driver}>
                                                {driver}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                <Box sx={{ flex: '1 1 300px' }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Second Driver"
                                        name="driver2"
                                        value={formData.driver2}
                                        onChange={handleInputChange}
                                        disabled={loadingData || !formData.session}
                                    >
                                        {driversList.map((driver) => (
                                            <MenuItem key={driver} value={driver}>
                                                {driver}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                                
                                <Box sx={{ flex: '1 1 300px' }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        disabled={loading || loadingData || !formData.grandPrix || !formData.session || !formData.driver1 || !formData.driver2}
                                    >
                                        {loading ? <CircularProgress size={24} /> : 'Compare Drivers'}
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </form>
                </Paper>

                {comparisonResult && (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Analysis Result
                        </Typography>
                        <Markdown>{comparisonResult}</Markdown>
                    </Paper>
                )}
            </Box>
        </Container>
    );
};

export default DriverComparison; 