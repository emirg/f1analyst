import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import DriverComparison from './components/DriverComparison';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#e10600', // F1 Red
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DriverComparison />
    </ThemeProvider>
  );
}

export default App;
