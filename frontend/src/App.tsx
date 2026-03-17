import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import theme from './theme';
import { YearProvider } from './contexts/YearContext';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import ComparisonPage from './pages/ComparisonPage';
import StandingsPage from './pages/StandingsPage';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <YearProvider>
                    <Routes>
                        <Route element={<AppLayout />}>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/calendar" element={<CalendarPage />} />
                            <Route path="/comparison" element={<ComparisonPage />} />
                            <Route path="/standings" element={<StandingsPage />} />
                        </Route>
                    </Routes>
                </YearProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
