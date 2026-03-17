import React from 'react';
import {
    Paper,
    Typography,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Box,
} from '@mui/material';
import { LastRaceResult } from '../../types/f1';

interface LastRaceCardProps {
    data: LastRaceResult | null;
}

const LastRaceCard: React.FC<LastRaceCardProps> = ({ data }) => {
    if (!data) {
        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Skeleton variant="text" width="40%" height={28} />
                <Skeleton variant="text" width="60%" height={36} sx={{ mt: 2 }} />
                <Box sx={{ mt: 2 }}>
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} variant="text" height={32} sx={{ mt: 0.5 }} />
                    ))}
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                Last Race Result
            </Typography>
            <Typography variant="h3" sx={{ mb: 2 }}>
                {data.event_name}
            </Typography>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 600, borderColor: 'divider' }}>
                                Pos
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 600, borderColor: 'divider' }}>
                                Driver
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 600, borderColor: 'divider' }}>
                                Team
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{ color: 'text.secondary', fontWeight: 600, borderColor: 'divider' }}
                            >
                                Pts
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.top5.map((entry) => (
                            <TableRow key={entry.position} sx={{ '&:last-child td': { border: 0 } }}>
                                <TableCell sx={{ borderColor: 'divider' }}>
                                    {entry.position}
                                </TableCell>
                                <TableCell sx={{ borderColor: 'divider', fontWeight: 500 }}>
                                    {entry.driver}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        borderColor: 'divider',
                                        color: entry.team_color ? `#${entry.team_color}` : 'text.primary',
                                    }}
                                >
                                    {entry.team}
                                </TableCell>
                                <TableCell align="right" sx={{ borderColor: 'divider' }}>
                                    {entry.points}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default LastRaceCard;
