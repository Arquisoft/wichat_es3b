import React, { useState } from "react";
import Nav from "../../components/nav/Nav.js";
import Footer from "../../components/Footer.js";
import { Box, Typography, Grid, Container, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import "./Settings.css";

const Settings = () => {
    const [timeLimit, setTimeLimit] = useState(40);
    const [theme, setTheme] = useState("default");
    const [questionCount, setQuestionCount] = useState(10);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Nav />

            <Container maxWidth="lg" sx={{ textAlign: "center", paddingTop: 4, flexGrow: 1 }}>
                <Box sx={{ backgroundColor: "#E3F2FD", padding: 4, borderRadius: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: "bold", color: "#2196F3" }}>Game Settings</Typography>
                    <Typography variant="h6" sx={{ fontStyle: "italic", marginBottom: 3 }}>Adjust your game preferences</Typography>

                    <Grid container spacing={2} justifyContent="center">
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Time Limit</InputLabel>
                                <Select value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)}>
                                    <MenuItem value={30}>30 seconds</MenuItem>
                                    <MenuItem value={40}>40 seconds</MenuItem>
                                    <MenuItem value={60}>60 seconds</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Theme</InputLabel>
                                <Select value={theme} onChange={(e) => setTheme(e.target.value)}>
                                    <MenuItem value="default">Default</MenuItem>
                                    <MenuItem value="dark">Dark</MenuItem>
                                    <MenuItem value="light">Light</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Number of Questions</InputLabel>
                                <Select value={questionCount} onChange={(e) => setQuestionCount(e.target.value)}>
                                    <MenuItem value={5}>5</MenuItem>
                                    <MenuItem value={10}>10</MenuItem>
                                    <MenuItem value={15}>15</MenuItem>
                                    <MenuItem value={20}>20</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>
            </Container>

            <Footer />
        </Box>
    );
};

export default Settings;