import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();
const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    const verifyAuth = async () => {
        try {
            const response = await axios.get(apiEndpoint + "/protected", { withCredentials: true });
            if (response.status === 200) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error("Error verifying authentication:", error);
            setIsAuthenticated(false);
        }
    };

    useEffect(() => {
        verifyAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await axios.post(apiEndpoint + "/login", { username, password }, { withCredentials: true });
            setIsAuthenticated(true);
            return response.data;
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);