import React, { useEffect, useState } from 'react';
import { Box, Grid } from '@mui/material';
import { useYear } from '../contexts/YearContext';
import { getDashboardOverview } from '../services/api';
import { NextRace, LastRaceResult } from '../types/f1';
import NextRaceCard from '../components/dashboard/NextRaceCard';
import LastRaceCard from '../components/dashboard/LastRaceCard';
import StandingsChart from '../components/dashboard/StandingsChart';

interface StandingsDataItem {
    name: string;
    points: number;
    color: string;
}

const DashboardPage: React.FC = () => {
    const { year } = useYear();

    const [nextRace, setNextRace] = useState<NextRace | null>(null);
    const [lastRace, setLastRace] = useState<LastRaceResult | null>(null);
    const [driverStandings, setDriverStandings] = useState<StandingsDataItem[] | null>(null);
    const [constructorStandings, setConstructorStandings] = useState<StandingsDataItem[] | null>(null);

    useEffect(() => {
        // Reset all panels to loading state
        setNextRace(null);
        setLastRace(null);
        setDriverStandings(null);
        setConstructorStandings(null);

        getDashboardOverview(year)
            .then((overview) => {
                setNextRace(overview.next_race ?? null);
                setLastRace(overview.last_race ?? null);

                setDriverStandings(
                    overview.driver_standings_top10.map((d) => ({
                        name: d.driver_abbreviation,
                        points: d.points,
                        color: d.team_color ? `#${d.team_color}` : '#3b82f6',
                    }))
                );

                setConstructorStandings(
                    overview.constructor_standings_top10.map((c) => ({
                        name: c.team,
                        points: c.points,
                        color: c.team_color ? `#${c.team_color}` : '#3b82f6',
                    }))
                );
            })
            .catch((err) => {
                console.error('Failed to load dashboard overview:', err);
            });
    }, [year]);

    return (
        <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
                {/* Top row: two columns */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <NextRaceCard data={nextRace} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <LastRaceCard data={lastRace} />
                </Grid>

                {/* Full width: Driver Standings */}
                <Grid size={12}>
                    <StandingsChart title="Driver Standings — Top 10" data={driverStandings} />
                </Grid>

                {/* Full width: Constructor Standings */}
                <Grid size={12}>
                    <StandingsChart title="Constructor Standings — Top 10" data={constructorStandings} />
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;
