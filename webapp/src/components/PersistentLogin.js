import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useRefreshToken from "../hooks/useRefreshToken";
import { Typography } from "@mui/material";

const PersistentLogin = () => {
    const { auth } = useAuth();
    const refresh = useRefreshToken();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyRefreshToken = async () => {
            try {
                await refresh();
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        !auth.accessToken ? verifyRefreshToken() : setLoading(false);
    }, []);

    return (
        <>
            {loading
                ? <Typography>Loading...</Typography>
                : <Outlet />
            }
        </>
    );
};

export default PersistentLogin;