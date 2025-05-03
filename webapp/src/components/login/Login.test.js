import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { BrowserRouter } from "react-router-dom";
import Login from "./Login";

// Mock de las dependencias
jest.mock("axios");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));
jest.mock("@mui/material", () => ({
  ...jest.requireActual("@mui/material"),
  Snackbar: ({ open, message, onClose, children }) =>
    open ? <div data-testid="snackbar">{message || children}</div> : null,
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        identify: "Identifícate",
        introduceData: "Introduce tus datos",
        username: "Nombre de usuario",
        password: "Contraseña",
        login: "Iniciar sesión",
        signup: "Registrarse",
        loginMessageInPanel: "Mensaje en panel",
        loginSuccessful: "Inicio de sesión exitoso",
        failedLogin: "Error al iniciar sesión",
      };
      return translations[key] || key;
    },
  }),
}));

// Variables globales para los mocks
const mockNavigate = jest.fn();
const mockToggleView = jest.fn();

// Configuración antes de cada test
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  // Mock de console.error para suprimir errores de UI esperados durante las pruebas
  jest.spyOn(console, "error").mockImplementation(() => {});
});

// Función auxiliar para renderizar el componente
const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login handleToggleView={mockToggleView} />
    </BrowserRouter>
  );
};

describe("Login Component", () => {
  test("renderiza correctamente el formulario de login", () => {
    renderLogin();

    expect(screen.getByText("Identifícate")).toBeInTheDocument();
    expect(screen.getByText("Introduce tus datos")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre de usuario")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
    expect(screen.getByText("Registrarse")).toBeInTheDocument();
  });

  test("actualiza los valores de username y password al escribir", async () => {
    renderLogin();

    const usernameInput = screen.getByLabelText("Nombre de usuario");
    const passwordInput = screen.getByLabelText("Contraseña");

    await userEvent.type(usernameInput, "testuser");
    await userEvent.type(passwordInput, "password123");

    expect(usernameInput).toHaveValue("testuser");
    expect(passwordInput).toHaveValue("password123");
  });

  test("muestra el botón de mostrar/ocultar contraseña y funciona correctamente", async () => {
    renderLogin();

    const passwordInput = screen.getByLabelText("Contraseña");
    const toggleButton = screen.getByText("👁️‍🗨️");

    // Inicialmente la contraseña está oculta
    expect(passwordInput).toHaveAttribute("type", "password");

    // Mostrar la contraseña
    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    // Ocultar de nuevo la contraseña
    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("redirige al home tras login exitoso", async () => {
    axios.post.mockResolvedValueOnce({
      data: { token: "fake-token" },
    });

    renderLogin();

    const usernameInput = screen.getByLabelText("Nombre de usuario");
    const passwordInput = screen.getByLabelText("Contraseña");
    const loginButton = screen.getByText("Iniciar sesión");

    await userEvent.type(usernameInput, "testuser");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("http://localhost:8000/login", {
        username: "testuser",
        password: "password123",
      });
      expect(localStorage.getItem("token")).toBe("fake-token");
      expect(localStorage.getItem("username")).toBe("testuser");
      expect(mockNavigate).toHaveBeenCalledWith("/home");
    });
  });

  test("muestra error cuando falla el login", async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { error: "Credenciales inválidas" } },
    });

    renderLogin();

    const usernameInput = screen.getByLabelText("Nombre de usuario");
    const passwordInput = screen.getByLabelText("Contraseña");
    const loginButton = screen.getByText("Iniciar sesión");

    await userEvent.type(usernameInput, "testuser");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText("Credenciales inválidas")).toBeInTheDocument();
    });
  });

  test("muestra error genérico cuando la respuesta no contiene detalles", async () => {
    axios.post.mockRejectedValueOnce({});

    renderLogin();

    const usernameInput = screen.getByLabelText("Nombre de usuario");
    const passwordInput = screen.getByLabelText("Contraseña");
    const loginButton = screen.getByText("Iniciar sesión");

    await userEvent.type(usernameInput, "testuser");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText("Error al iniciar sesión")).toBeInTheDocument();
    });
  });

  test("redirige a la página de autenticación después de cerrar sesión", async () => {
    // Simular que el usuario ya está autenticado
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("username", "testuser");

    renderLogin();

    // Debería mostrar el botón de cerrar sesión
    const logoutButton = screen.getByText("Cerrar Sesión");
    await userEvent.click(logoutButton);

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("username")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/auth");
  });

  test("cambia a la vista de registro al hacer clic en el botón de registrarse", async () => {
    renderLogin();

    const registerButton = screen.getByText("Registrarse");
    await userEvent.click(registerButton);

    expect(mockToggleView).toHaveBeenCalled();
  });

  test("detecta el token almacenado y establece loginSuccess en true", () => {
    localStorage.setItem("token", "fake-token");

    renderLogin();

    expect(screen.getByText("Cerrar Sesión")).toBeInTheDocument();
  });

  test("inicia sesión cuando se presiona la tecla Enter en el campo de contraseña", async () => {
    axios.post.mockResolvedValueOnce({
      data: { token: "fake-token" },
    });

    renderLogin();

    const usernameInput = screen.getByLabelText("Nombre de usuario");
    const passwordInput = screen.getByLabelText("Contraseña");

    await userEvent.type(usernameInput, "testuser");
    await userEvent.type(passwordInput, "password123{enter}");

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("http://localhost:8000/login", {
        username: "testuser",
        password: "password123",
      });
      expect(localStorage.getItem("token")).toBe("fake-token");
      expect(mockNavigate).toHaveBeenCalledWith("/home");
    });
  });

  test("inicia sesión cuando se presiona la tecla Enter en el campo de usuario", async () => {
    axios.post.mockResolvedValueOnce({
      data: { token: "fake-token" },
    });

    renderLogin();

    const usernameInput = screen.getByLabelText("Nombre de usuario");

    await userEvent.type(usernameInput, "testuser{enter}");

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("http://localhost:8000/login", {
        username: "testuser",
        password: "",
      });
      expect(localStorage.getItem("token")).toBe("fake-token");
      expect(mockNavigate).toHaveBeenCalledWith("/home");
    });
  });

  test("usa la URL del gateway del entorno si está definida", async () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      REACT_APP_GATEWAY_SERVICE_URL: "https://api.example.com",
    };

    axios.post.mockResolvedValueOnce({
      data: { token: "fake-token" },
    });

    renderLogin();

    const loginButton = screen.getByText("Iniciar sesión");
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("https://api.example.com/login", {
        username: "",
        password: "",
      });
    });

    // Restaurar el entorno original
    process.env = originalEnv;
  });
});
