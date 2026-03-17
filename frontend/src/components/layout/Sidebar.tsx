import React from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, useMediaQuery } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/calendar', label: 'Calendar', icon: <CalendarMonthIcon /> },
    { path: '/comparison', label: 'Comparison', icon: <CompareArrowsIcon /> },
    { path: '/standings', label: 'Standings', icon: <LeaderboardIcon /> },
];

const SIDEBAR_WIDTH = 220;
const SIDEBAR_COLLAPSED = 64;

const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const collapsed = useMediaQuery('(max-width:1024px)');

    return (
        <Box sx={{
            width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
            minHeight: '100vh',
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
            transition: 'width 200ms',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 1200,
        }}>
            <Box sx={{ p: 2, textAlign: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Box component="span" sx={{ fontWeight: 700, fontSize: collapsed ? '0.75rem' : '1.1rem', color: 'text.primary' }}>
                    {collapsed ? 'F1' : 'F1 Analyst'}
                </Box>
            </Box>
            <List>
                {NAV_ITEMS.map((item) => (
                    <ListItemButton
                        key={item.path}
                        selected={location.pathname === item.path}
                        onClick={() => navigate(item.path)}
                        sx={{
                            mx: 1,
                            borderRadius: 1,
                            mb: 0.5,
                            '&.Mui-selected': {
                                bgcolor: 'rgba(59, 130, 246, 0.12)',
                                color: 'primary.main',
                                '& .MuiListItemIcon-root': { color: 'primary.main' },
                            },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: 'text.secondary' }}>
                            {item.icon}
                        </ListItemIcon>
                        {!collapsed && <ListItemText primary={item.label} />}
                    </ListItemButton>
                ))}
            </List>
        </Box>
    );
};

export { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED };
export default Sidebar;
