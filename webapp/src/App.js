import React, { useState } from 'react';
import './App.css';

import { Container, CssBaseline, Link, Typography } from '@mui/material';
import { Outlet } from 'react-router';

function App() {
  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Typography component="h1" variant="h5" align="center" sx={{ marginTop: 2 }}>
        Welcome to the 2025 edition of the Software Architecture course!
      </Typography>
      <Outlet />
    </Container>
  );
}

export default App;