// src/components/Login.js
import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Snackbar } from '@mui/material';
import { NavLink, useLocation, useNavigate } from 'react-router';

import { useAuth } from '../auth/AuthContext';
import axios from "../api/axios";

const Login = () => {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from.pathname || "/";
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const loginUser = async () => {
    try {
      await axios.post("/login", { username, password });
      setAuth(true);
      navigate(from, { replace: true });
    } catch (error) {
      setError(error.message);
      setAuth(false);
    }
    
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ marginTop: 4 }}>
      <div>
        <Typography component="h1" variant="h5">
          Login
        </Typography>
        <TextField
          margin="normal"
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          margin="normal"
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={loginUser}>
          Login
        </Button>
        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar} message="Login successful" />
        {error && (
          <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} message={`Error: ${error}`} />
        )}
        <Typography component="div" align="center" sx={{ marginTop: 2 }}>
          <NavLink to={"/signup"}>
            Don't have an account? Register here.
          </NavLink>
        </Typography>
      </div>
    </Container>
  );
};

export default Login;
