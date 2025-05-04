import React from "react";
import { Navigate } from "react-router-dom";

// Función para verificar si el usuario está autenticado
const isAuthenticated = () => {
    return localStorage.getItem("username") !== null; // Puedes cambiarlo según tu lógica
};

const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/auth" />;
    //return children; // Cambiar la línea anterior por esta para desactivar la protección de rutas
};

export default PrivateRoute;
