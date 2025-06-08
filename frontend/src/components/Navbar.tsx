import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';

const pages = ['Races', 'Drivers', 'Teams', 'News'];

const Navbar: React.FC = () => {

  return (
    <AppBar position="static" sx={{ backgroundColor: '#ffffff' }} elevation={1}>
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="div" sx={{ color: '#141414' }}>
            Formula One
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 10 }}/>

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
          {pages.map((page) => (
            <Button
              key={page}
              sx={{ mx: 3, color: '#141414', display: 'block', fontWeight: 500, fontSize: 14, textTransform: 'none'  }}
            >
              {page}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 