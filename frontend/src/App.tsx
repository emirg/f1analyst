import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Navbar from './components/Navbar';
import DriverComparisonForm from './components/DriverComparisonForm';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#141414', // Dark gray
    },
    background: {
      default: '#ffffff', // White background
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 800,
      fontSize: 20
    },    
    h4: {
      fontWeight: 700,
      fontSize: 18
    },
    h6: {
      fontWeight: 500,
      fontSize: 14
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar />
      <DriverComparisonForm />
    </ThemeProvider>
  );
}

export default App;
