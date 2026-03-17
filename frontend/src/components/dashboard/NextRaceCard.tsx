import React, { useMemo } from 'react';
import { Paper, Box, Typography, Skeleton } from '@mui/material';
import { NextRace } from '../../types/f1';

interface NextRaceCardProps {
    data: NextRace | null;
}

const NextRaceCard: React.FC<NextRaceCardProps> = ({ data }) => {
    const daysUntilRace = useMemo(() => {
        if (!data) return null;
        const raceDate = new Date(data.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        raceDate.setHours(0, 0, 0, 0);
        const diff = raceDate.getTime() - today.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }, [data]);

    if (!data) {
        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Skeleton variant="text" width="40%" height={28} />
                <Skeleton variant="text" width="70%" height={36} sx={{ mt: 2 }} />
                <Skeleton variant="text" width="50%" height={24} sx={{ mt: 1 }} />
                <Skeleton variant="rectangular" width="30%" height={48} sx={{ mt: 2, borderRadius: 1 }} />
            </Paper>
        );
    }

    const raceDate = new Date(data.date);
    const formattedDate = raceDate.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                Next Race
            </Typography>
            <Typography variant="h3" sx={{ mb: 0.5 }}>
                {data.event_name}
            </Typography>
            {data.country && (
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
                    {data.country}
                </Typography>
            )}
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                {formattedDate}
            </Typography>
            <Box
                sx={{
                    display: 'inline-block',
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    bgcolor: 'primary.main',
                    color: '#fff',
                }}
            >
                <Typography variant="h4" component="span" sx={{ fontWeight: 700 }}>
                    {daysUntilRace}
                </Typography>
                <Typography variant="body2" component="span" sx={{ ml: 1, color: 'rgba(255,255,255,0.8)' }}>
                    {daysUntilRace === 1 ? 'day to go' : 'days to go'}
                </Typography>
            </Box>
        </Paper>
    );
};

export default NextRaceCard;
