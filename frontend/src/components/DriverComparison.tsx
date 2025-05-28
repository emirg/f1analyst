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
import { ComparisonFormData, CalendarEvent, SessionInfo } from '../types/f1';
import Markdown from 'react-markdown'

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

const DriverComparison: React.FC = () => {
    const [formData, setFormData] = useState<ComparisonFormData>({
        year: new Date().getFullYear(),
        grand_prix: '',
        session: '',
        driver1: '',
        driver2: '',
    });

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [comparisonResult, setComparisonResult] = useState<string>('');
    
    // States for loaded data
    const [grandPrixList, setGrandPrixList] = useState<CalendarEvent[]>([]);
    const [sessionsList, setSessionsList] = useState<SessionInfo[]>([]);
    const [driversList, setDriversList] = useState<string[]>([]);

    // Load Grand Prix when year changes
    useEffect(() => {
        const fetchGrandPrix = async () => {
            if (!formData.year) return;
            
            setLoadingData(true);
            try {
                const response = await fetch(`http://localhost:5000/year-calendar/${formData.year}`);
                const data = await response.json();
                if (data.error) {
                    console.error('Error fetching calendar:', data.error);
                    return;
                }
                setGrandPrixList(data.calendar);
                // Reset selections when year changes
                setFormData(prev => ({
                    ...prev,
                    grand_prix: '',
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
            if (!formData.year || !formData.grand_prix) return;
            
            setLoadingData(true);
            try {
                const response = await fetch(
                    `http://localhost:5000/gp-sessions/${formData.year}/${formData.grand_prix}`
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
    }, [formData.year, formData.grand_prix]);

    // Load drivers when session changes
    useEffect(() => {
        const fetchDrivers = async () => {
            if (!formData.year || !formData.grand_prix || !formData.session) return;
            
            setLoadingData(true);
            try {
                const response = await fetch(
                    `http://localhost:5000/session-drivers/${formData.year}/${formData.grand_prix}/${formData.session}`
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
    }, [formData.year, formData.grand_prix, formData.session]);

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
                <Paper sx={{ p: 3 }}>
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
                                        disabled={loadingData}
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
                                        name="grand_prix"
                                        value={formData.grand_prix}
                                        onChange={handleInputChange}
                                        disabled={loadingData || !formData.year}
                                    >
                                        {grandPrixList.map((gp) => (
                                            <MenuItem key={gp.event_name} value={gp.event_name}>
                                                {gp.event_name}
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
                                        disabled={loadingData || !formData.grand_prix}
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
                                        disabled={loading || loadingData || !formData.grand_prix || !formData.session || !formData.driver1 || !formData.driver2}
                                    >
                                        {loading ? <CircularProgress size={24} /> : 'Compare Drivers'}
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </form>
                </Paper>

                {comparisonResult && (
                    <Paper sx={{ p: 3, mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Comparison Result
                        </Typography>
                        <Markdown>{comparisonResult}</Markdown>
                    </Paper>
                )}
            </Box>
        </Container>
    );
};

export default DriverComparison; 