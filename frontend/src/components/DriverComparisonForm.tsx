import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    MenuItem,
    CircularProgress,
    Paper,
    Collapse,
    IconButton,
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { ComparisonFormData, CalendarEvent, SessionInfo } from '../types/f1';
import ComparisonResult from './ComparisonResult';
import { getYearCalendar, getGPSessions, getSessionDrivers } from '../services/api';

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

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
    const [showResult, setShowResult] = useState(true);
    const [hasResult, setHasResult] = useState(false);
    
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
                const response = await getYearCalendar(formData.year);
                setGrandPrixList(response.calendar);
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
                const response = await getGPSessions(formData.year, formData.grand_prix);
                setSessionsList(response.sessions);
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
                const response = await getSessionDrivers(formData.year, formData.grand_prix, formData.session);
                setDriversList(response.drivers);
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

            // Create the request body with the names instead of keys
            const requestBody = {
                ...formData,
                grand_prix: selectedGP?.event_name || '',
                session: selectedSession?.type || '',
            };

            const response = await fetch(`${API_BASE}/agent/compare-drivers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            const data = await response.json();
            setComparisonResult(data.analysis);
            setHasResult(true);
            setShowResult(true);
        } catch (error) {
            console.error('Error:', error);
            setComparisonResult('Error al obtener la comparación. Por favor, intente nuevamente.');
            setHasResult(true);
            setShowResult(true);
        } finally {
            setLoading(false);
        }
    };

    const toggleResultPanel = () => {
        setShowResult(!showResult);
    };

    return (
        <Box sx={{ mx: { xs: 2, sm: 4, md: 6 }, my: { xs: 2, sm: 4 } }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
                Compare Drivers
            </Typography>
           
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                gap: 4,
                alignItems: 'flex-start'
            }}>
                {/* Form Panel */}
                <Box sx={{
                    width: { xs: '100%', lg: hasResult ? '50%' : '100%' },
                    maxWidth: hasResult ? 'none' : '600px',
                    mx: hasResult ? 0 : 'auto'
                }}>
                    <Paper sx={{ p: 3, height: 'fit-content' }}>
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
                            <MenuItem key={driver} value={driver}>
                                {driver}
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
                            <MenuItem key={driver} value={driver}>
                                {driver}
                            </MenuItem>
                        ))}
                    </TextField>
                    
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    disabled={loading || loadingData || !formData.grand_prix || !formData.session || !formData.driver1 || !formData.driver2}
                                    startIcon={loading ? null : <CompareArrowsIcon />}
                                    sx={{ py: 1.5 }}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Compare Drivers'}
                                </Button>
                            </Box>
                        </form>
                    </Paper>
                </Box>

                {/* Results Panel */}
                {hasResult && (
                    <Box sx={{
                        width: { xs: '100%', lg: '50%' },
                        display: { xs: 'none', lg: 'block' }
                    }}>
                        <Paper sx={{ height: 'fit-content', maxHeight: '80vh', overflow: 'hidden' }}>
                            {/* Results Header */}
                            <Box 
                                sx={{ 
                                    p: 2, 
                                    borderBottom: 1, 
                                    borderColor: 'divider',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer'
                                }}
                                onClick={toggleResultPanel}
                            >
                                <Typography variant="h4" component="h2">
                                    Comparison Result
                                </Typography>
                                <IconButton size="small">
                                    {showResult ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>
                            
                            {/* Results Content */}
                            <Collapse in={showResult}>
                                <Box sx={{ 
                                    p: 3, 
                                    maxHeight: { lg: '60vh' }, 
                                    overflow: 'auto',
                                    '& h1, & h2, & h3, & h4, & h5, & h6': {
                                        mt: 2,
                                        mb: 1,
                                        fontWeight: 600
                                    },
                                    '& p': {
                                        mb: 2
                                    },
                                    '& ul, & ol': {
                                        pl: 2,
                                        mb: 2
                                    }
                                }}>
                                    <ComparisonResult result={comparisonResult} isInPanel={true} />
                                </Box>
                            </Collapse>
                        </Paper>
                    </Box>
                )}
            </Box>

            {/* Mobile Results (when no side panel) */}
            {hasResult && (
                <Box sx={{ display: { xs: 'block', lg: 'none' }, mt: 3 }}>
                    <ComparisonResult result={comparisonResult} isInPanel={false} />
                </Box>
            )}
        </Box>
    );
};

export default DriverComparisonForm; 