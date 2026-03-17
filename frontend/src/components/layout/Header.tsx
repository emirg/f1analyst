import React from 'react';
import { Box, TextField, MenuItem, Typography, useMediaQuery } from '@mui/material';
import { useYear } from '../../contexts/YearContext';

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

const Header: React.FC = () => {
    const { year, setYear } = useYear();
    const collapsed = useMediaQuery('(max-width:1024px)');

    return (
        <Box sx={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
        }}>
            <Typography variant="h6" color="text.secondary">
                Season Overview
            </Typography>
            <TextField
                select
                size="small"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                sx={{ minWidth: 100 }}
            >
                {YEARS.map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
            </TextField>
        </Box>
    );
};

export default Header;
