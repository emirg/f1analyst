import { createTheme } from '@mui/material';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#3b82f6' },
        success: { main: '#22c55e' },
        error: { main: '#ef4444' },
        warning: { main: '#f59e0b' },
        background: {
            default: '#0a0a0f',
            paper: '#12131a',
        },
        text: {
            primary: '#e4e4e7',
            secondary: '#8b8b9e',
        },
        divider: '#2a2b3d',
    },
    typography: {
        fontFamily: '"Inter", system-ui, sans-serif',
        h3: { fontWeight: 700, fontSize: '1.5rem' },
        h4: { fontWeight: 600, fontSize: '1.25rem' },
        h6: { fontWeight: 500, fontSize: '0.875rem' },
        body2: { fontFamily: '"JetBrains Mono", monospace' },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    border: '1px solid #2a2b3d',
                    borderRadius: 8,
                },
            },
        },
        MuiSkeleton: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1a1b25',
                },
            },
        },
    },
});

export default theme;
