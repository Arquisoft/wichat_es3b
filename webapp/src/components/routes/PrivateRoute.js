import React from "react";
import { Navigate } from "react-router-dom";

// Función para verificar si el usuario está autenticado
const isAuthenticated = () => {
    return localStorage.getItem("user") !== null; // Puedes cambiarlo según tu lógica
};

const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/auth" />;
};

export default PrivateRoute;