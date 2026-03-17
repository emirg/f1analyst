import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Skeleton, Stack } from '@mui/material';
import { useYear } from '../contexts/YearContext';
import { getYearCalendar } from '../services/api';
import { CalendarEvent } from '../types/f1';
import GPCard from '../components/calendar/GPCard';

type GPStatus = 'completed' | 'upcoming' | 'future';

const CalendarPage: React.FC = () => {
    const { year } = useYear();
    const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        getYearCalendar(year)
            .then((res) => {
                if (!cancelled) {
                    setCalendar(res.calendar);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setCalendar([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [year]);

    const statusMap = useMemo(() => {
        const map = new Map<number, GPStatus>();
        if (calendar.length === 0) return map;

        // Use current date to find the upcoming round.
        // Since CalendarEvent doesn't have dates, we rely on round ordering.
        // We fetch sessions lazily, so we use a simple heuristic:
        // current month/year approximation — or just mark the first future-looking
        // round as upcoming. For a more precise approach we'd need session dates,
        // but per the task spec we use round_number ordering.
        //
        // Strategy: treat all rounds as future, then mark earlier ones as completed.
        // The "upcoming" one is the first non-completed round.
        // We approximate: assume roughly even distribution of rounds across the year.
        const now = new Date();
        const currentYear = now.getFullYear();

        if (year < currentYear) {
            // Past season — all completed
            calendar.forEach((e) => map.set(e.round_number, 'completed'));
            return map;
        }

        if (year > currentYear) {
            // Future season — first is upcoming, rest are future
            if (calendar.length > 0) {
                map.set(calendar[0].round_number, 'upcoming');
                calendar.slice(1).forEach((e) => map.set(e.round_number, 'future'));
            }
            return map;
        }

        // Current year — estimate which round is upcoming based on month progression
        const dayOfYear = Math.floor(
            (now.getTime() - new Date(currentYear, 0, 1).getTime()) / (1000 * 60 * 60 * 24)
        );
        // F1 season roughly spans March (day ~60) to December (day ~340), ~280 days
        const seasonStart = 60;
        const seasonLength = 280;
        const progress = Math.max(0, Math.min(1, (dayOfYear - seasonStart) / seasonLength));
        const estimatedCompletedRounds = Math.floor(progress * calendar.length);

        let upcomingSet = false;
        calendar.forEach((e, idx) => {
            if (idx < estimatedCompletedRounds) {
                map.set(e.round_number, 'completed');
            } else if (!upcomingSet) {
                map.set(e.round_number, 'upcoming');
                upcomingSet = true;
            } else {
                map.set(e.round_number, 'future');
            }
        });

        return map;
    }, [calendar, year]);

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                {year} Calendar
            </Typography>

            {loading ? (
                <Stack spacing={2}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            variant="rectangular"
                            height={64}
                            sx={{ borderRadius: 1 }}
                        />
                    ))}
                </Stack>
            ) : calendar.length === 0 ? (
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    No calendar data available for {year}.
                </Typography>
            ) : (
                <Stack spacing={1.5}>
                    {calendar.map((event) => (
                        <GPCard
                            key={event.round_number}
                            event={event}
                            status={statusMap.get(event.round_number) ?? 'future'}
                        />
                    ))}
                </Stack>
            )}
        </Box>
    );
};

export default CalendarPage;
