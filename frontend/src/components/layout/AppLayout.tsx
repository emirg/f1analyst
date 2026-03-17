import React from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED } from './Sidebar';
import Header from './Header';

const AppLayout: React.FC = () => {
    const collapsed = useMediaQuery('(max-width:1024px)');
    const marginLeft = collapsed ? `${SIDEBAR_COLLAPSED}px` : `${SIDEBAR_WIDTH}px`;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <Sidebar />
            <Box sx={{ flex: 1, ml: marginLeft, transition: 'margin-left 200ms' }}>
                <Header />
                <Box sx={{ p: 3 }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default AppLayout;
