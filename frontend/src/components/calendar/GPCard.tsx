import React, { useState, useCallback } from 'react';
import {
    Paper,
    Box,
    Typography,
    Collapse,
    Chip,
    CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CalendarEvent, SessionInfo } from '../../types/f1';
import { getGPSessions } from '../../services/api';
import { useYear } from '../../contexts/YearContext';

type GPStatus = 'completed' | 'upcoming' | 'future';

interface GPCardProps {
    event: CalendarEvent;
    status: GPStatus;
    sessions?: SessionInfo[];
}

const statusStyles: Record<GPStatus, object> = {
    completed: {
        opacity: 0.6,
    },
    upcoming: {
        borderColor: '#3b82f6',
        borderWidth: 2,
        borderStyle: 'solid',
    },
    future: {},
};

const GPCard: React.FC<GPCardProps> = ({ event, status, sessions: initialSessions }) => {
    const { year } = useYear();
    const [expanded, setExpanded] = useState(false);
    const [sessions, setSessions] = useState<SessionInfo[] | null>(initialSessions ?? null);
    const [loading, setLoading] = useState(false);

    const handleToggle = useCallback(async () => {
        const willExpand = !expanded;
        setExpanded(willExpand);

        if (willExpand && sessions === null) {
            setLoading(true);
            try {
                const response = await getGPSessions(year, event.event_name);
                setSessions(response.sessions);
            } catch {
                setSessions([]);
            } finally {
                setLoading(false);
            }
        }
    }, [expanded, sessions, year, event.event_name]);

    const formatBadgeColor = (format: string): 'default' | 'primary' | 'secondary' | 'warning' => {
        switch (format.toLowerCase()) {
            case 'sprint':
            case 'sprint_shootout':
            case 'sprint_qualifying':
                return 'warning';
            case 'conventional':
                return 'default';
            default:
                return 'secondary';
        }
    };

    return (
        <Paper
            sx={{
                p: 2,
                cursor: 'pointer',
                border: '1px solid #2a2b3d',
                transition: 'border-color 0.2s, opacity 0.2s',
                '&:hover': {
                    borderColor: status === 'upcoming' ? '#3b82f6' : '#3d3e52',
                },
                ...statusStyles[status],
            }}
            onClick={handleToggle}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'text.secondary',
                            fontWeight: 600,
                            minWidth: 32,
                        }}
                    >
                        R{event.round_number}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        {event.event_name}
                    </Typography>
                    <Chip
                        label={event.event_format}
                        size="small"
                        color={formatBadgeColor(event.event_format)}
                        variant="outlined"
                    />
                    {status === 'upcoming' && (
                        <Chip
                            label="UPCOMING"
                            size="small"
                            sx={{
                                bgcolor: '#3b82f6',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                            }}
                        />
                    )}
                </Box>
                <ExpandMoreIcon
                    sx={{
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        color: 'text.secondary',
                    }}
                />
            </Box>

            <Collapse in={expanded}>
                <Box sx={{ mt: 2, pl: 6 }}>
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    )}
                    {!loading && sessions && sessions.length === 0 && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            No session data available.
                        </Typography>
                    )}
                    {!loading &&
                        sessions &&
                        sessions.length > 0 &&
                        sessions.map((session) => {
                            const sessionDate = new Date(session.date);
                            const formatted = sessionDate.toLocaleDateString('en-GB', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                            });
                            return (
                                <Box
                                    key={session.session_key}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        py: 0.75,
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                        '&:last-child': { borderBottom: 'none' },
                                    }}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {session.type}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        {formatted}
                                    </Typography>
                                </Box>
                            );
                        })}
                </Box>
            </Collapse>
        </Paper>
    );
};

export default GPCard;
