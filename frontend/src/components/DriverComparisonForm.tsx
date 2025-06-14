import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    MenuItem,
    CircularProgress,
} from '@mui/material';
import { ComparisonFormData, CalendarEvent, SessionInfo } from '../types/f1';
import ComparisonResult from './ComparisonResult';
import { fetchYearCalendar, fetchGPSessions, fetchSessionDrivers } from '../services/openF1Api';

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

const DriverComparisonForm: React.FC = () => {
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
    const [driversList, setDriversList] = useState<Array<{fullName: string, nameAcronym: string}>>([]);

    // Load Grand Prix when year changes
    useEffect(() => {
        const fetchGrandPrix = async () => {
            if (!formData.year) return;
            
            setLoadingData(true);
            try {
                const calendar = await fetchYearCalendar(formData.year);
                setGrandPrixList(calendar);
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
                const sessions = await fetchGPSessions(formData.year, formData.grand_prix);
                setSessionsList(sessions);
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
                const drivers = await fetchSessionDrivers(formData.grand_prix, formData.session);
                setDriversList(drivers);
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
            // Find the selected Grand Prix and Session objects
            const selectedGP = grandPrixList.find(gp => gp.meeting_key === formData.grand_prix);
            const selectedSession = sessionsList.find(session => session.session_key === formData.session);
            
            // Find the selected drivers to get their name_acronym
            const selectedDriver1 = driversList.find(driver => driver.fullName === formData.driver1);
            const selectedDriver2 = driversList.find(driver => driver.fullName === formData.driver2);

            // Create the request body with the names instead of keys
            const requestBody = {
                ...formData,
                grand_prix: selectedGP?.event_name || '',
                session: selectedSession?.type || '',
                driver1: selectedDriver1?.nameAcronym || '',
                driver2: selectedDriver2?.nameAcronym || ''
            };

            const response = await fetch('http://localhost:8000/api/v1/agent/compare-drivers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
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
        <Box maxWidth="sm" sx={{ mx: 24, my: 10 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{my: 3}}>
                Compare Drivers
            </Typography>
           
            <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                            <MenuItem key={gp.meeting_key} value={gp.meeting_key}>
                                {gp.event_name}
                            </MenuItem>
                        ))}
                    </TextField>

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
                            <MenuItem key={session.session_key} value={session.session_key}>
                                {session.type}
                            </MenuItem>
                        ))}
                    </TextField>

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
                            <MenuItem key={driver.fullName} value={driver.fullName}>
                                {driver.fullName}
                            </MenuItem>
                        ))}
                    </TextField>

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
                            <MenuItem key={driver.fullName} value={driver.fullName}>
                                {driver.fullName}
                            </MenuItem>
                        ))}
                    </TextField>
                    
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
            </form>

            <ComparisonResult result={comparisonResult} />
        </Box>
    );
};

export default DriverComparisonForm; 