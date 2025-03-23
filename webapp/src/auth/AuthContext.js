import { createContext, useContext, useState, useEffect } from "react";

import axios from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(null);

    const verifyAuth = async () => {
        try {
            const response = await axios.get("/protected", { withCredentials: true });
            if (response.status === 200) {
                setAuth(true);
            } else {
                setAuth(false);
            }
        } catch (error) {
            console.error("Error verifying authentication:", error);
            setAuth(false);
        }
    };

    useEffect(() => {
        verifyAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);