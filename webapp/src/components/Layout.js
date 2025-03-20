import { AppBar, Box, Container, IconButton } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home'; 
import { Outlet, NavLink } from 'react-router';

const StyledNavlink = ({to, label, icon}) => {
    return (
        <NavLink to={to}>
            <IconButton sx={{color: "white", gap: "0.5rem", "&:hover": {backgroundColor: "rgba(255, 255, 255, 0.1)"}}}>
                {icon && (icon)}
                {label}
            </IconButton>
        </NavLink>
    );
}

const Layout = () => {
    return (
        <Container component="main" disableGutters sx={{
            minWidth: "100vw",
            minHeight: "100vh",
            p: 0,
            background: "linear-gradient(to bottom right,rgb(200, 240, 255), rgb(255, 240, 200))"
        }}>
            <AppBar position="static" sx={{
                display: "flex",
                flexDirection: "row",
                padding: "0.5rem",
                background: "linear-gradient(to right,rgb(70, 80, 180),rgb(100, 90, 200))"
            }}>
                <StyledNavlink to="/" label="Home" icon={<HomeIcon />} />
                <Box sx={{ml: "auto"}}>
                    <StyledNavlink to="/login" label="Login" />
                    <StyledNavlink to="/signup" label="Sign Up" />
                </Box>
            </AppBar>

            <Outlet />
        </Container>
    );
}

export default Layout;