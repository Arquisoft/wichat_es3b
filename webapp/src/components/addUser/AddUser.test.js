// src/components/AddUser.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import AddUser from "./AddUser";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n"; // Asegúrate de importar tu configuración de i18n

// Mock de axios
jest.mock("axios");

// Mock del hook de traducción
jest.mock("react-i18next", () => ({
  // esto es necesario para mantener el HOC
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        createAccount: "Crear cuenta",
        introduceData: "Introduce tus datos",
        email: "Correo electrónico",
        username: "Nombre de usuario",
        password: "Contraseña",
        confirmPassword: "Confirmar contraseña",
        or: "o",
        login: "Iniciar sesión",
        loginSuccessful: "Usuario creado con éxito",
        panel_text: "Texto del panel",
        emptyEmail: "El correo electrónico es obligatorio",
        emptyUsername: "El nombre de usuario es obligatorio",
        emptyPassword: "La contraseña es obligatoria",
        emptyPasswordConfirm: "Confirma la contraseña",
        passwordsDoNotMatch: "Las contraseñas no coinciden",
        addUserError: "Error al crear el usuario",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock para useSubmitOnEnter
const mockSubmitOnEnter = jest.fn();
jest.mock("../../hooks/useSubmitOnEnter", () => {
  return jest.fn(() => mockSubmitOnEnter);
});

describe("AddUser Component", () => {
  const handleToggleViewMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders AddUser component correctly", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AddUser handleToggleView={handleToggleViewMock} />
      </I18nextProvider>
    );

    expect(screen.getByLabelText(/Correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre de usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Contraseña$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmar contraseña/i)).toBeInTheDocument();
    // Usar getByRole para el botón específicamente para evitar duplicados con el título
    expect(
      screen.getByRole("button", { name: /Crear cuenta/i })
    ).toBeInTheDocument();
  });

  test("toggles view when login button is clicked", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AddUser handleToggleView={handleToggleViewMock} />
      </I18nextProvider>
    );

    const loginButton = screen.getByRole("button", { name: /Iniciar sesión/i });
    fireEvent.click(loginButton);

    expect(handleToggleViewMock).toHaveBeenCalledTimes(1);
  });

  test("shows error when email is empty", async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AddUser handleToggleView={handleToggleViewMock} />
      </I18nextProvider>
    );

    const createAccountButton = screen.getByRole("button", {
      name: /Crear cuenta/i,
    });
    fireEvent.click(createAccountButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Error: El correo electrónico es obligatorio/i)
      ).toBeInTheDocument();
    });
  });

  test("shows error when username is empty", async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AddUser handleToggleView={handleToggleViewMock} />
      </I18nextProvider>
    );

    // Llenar el email
    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const createAccountButton = screen.getByRole("button", {
      name: /Crear cuenta/i,
    });
    fireEvent.click(createAccountButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Error: El nombre de usuario es obligatorio/i)
      ).toBeInTheDocument();
    });
  });

  test("shows error when password is empty", async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AddUser handleToggleView={handleToggleViewMock} />
      </I18nextProvider>
    );

    // Llenar el email y username
    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const usernameInput = screen.getByLabelText(/Nombre de usuario/i);
    fireEvent.change(usernameInput, { target: { value: "testuser" } });

    const createAccountButton = screen.getByRole("button", {
      name: /Crear cuenta/i,
    });
    fireEvent.click(createAccountButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Error: La contraseña es obligatoria/i)
      ).toBeInTheDocument();
    });
  });

  test("shows error when password confirmation is empty", async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AddUser handleToggleView={handleToggleViewMock} />
      </I18nextProvider>
    );

    // Llenar el email, username y password
    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const usernameInput = screen.getByLabelText(/Nombre de usuario/i);
    fireEvent.change(usernameInput, { target: { value: "testuser" } });

    const passwordInput = screen.getByLabelText(/^Contraseña$/i);
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const createAccountButton = screen.getByRole("button", {
      name: /Crear cuenta/i,
    });
    fireEvent.click(createAccountButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Error: Confirma la contraseña/i)
      ).toBeInTheDocument();
    });
  });

  test("shows error when passwords do not match", async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AddUser handleToggleView={handleToggleViewMock} />
      </I18nextProvider>
    );

    // Llenar todos los campos pero con contraseñas diferentes
    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const usernameInput = screen.getByLabelText(/Nombre de usuario/i);
    fireEvent.change(usernameInput, { target: { value: "testuser" } });

    const passwordInput = screen.getByLabelText(/^Contraseña$/i);
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const confirmPasswordInput = screen.getByLabelText(/Confirmar contraseña/i);
    fireEvent.change(confirmPasswordInput, {
      target: { value: "differentpassword" },
    });

    const createAccountButton = screen.getByRole("button", {
      name: /Crear cuenta/i,
    });
    fireEvent.click(createAccountButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Error: Las contraseñas no coinciden/i)
      ).toBeInTheDocument();
    });
  });

  test("successfully adds user when all inputs are valid", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <I18nextProvider i18n={i18n}>
        <AddUser handleToggleView={handleToggleViewMock} />
      </I18nextProvider>
    );

    // Llenar todos los campos correctamente
    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const usernameInput = screen.getByLabelText(/Nombre de usuario/i);
    fireEvent.change(usernameInput, { target: { value: "testuser" } });

    const passwordInput = screen.getByLabelText(/^Contraseña$/i);
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const confirmPasswordInput = screen.getByLabelText(/Confirmar contraseña/i);
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
    });

    // Usamos getByRole para ser más específicos y obtener el botón
    const createAccountButton = screen.getByRole("button", {
      name: /Crear cuenta/i,
    });
    fireEvent.click(createAccountButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(expect.any(String), {
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });
      expect(screen.getByText(/Usuario creado con éxito/i)).toBeInTheDocument();
    });
  });

  test("shows error message when API call fails", async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { error: "Usuario ya existe" } },
    });

    render(
      <I18nextProvider i18n={i18n}>
        <AddUser handleToggleView={handleToggleViewMock} />
      </I18nextProvider>
    );

    // Llenar todos los campos correctamente
    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const usernameInput = screen.getByLabelText(/Nombre de usuario/i);
    fireEvent.change(usernameInput, { target: { value: "testuser" } });

    const passwordInput = screen.getByLabelText(/^Contraseña$/i);
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const confirmPasswordInput = screen.getByLabelText(/Confirmar contraseña/i);
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
    });

    const createAccountButton = screen.getByRole("button", {
      name: /Crear cuenta/i,
    });
    fireEvent.click(createAccountButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object)
      );
      expect(screen.getByText(/Error: Usuario ya existe/i)).toBeInTheDocument();
    });
  });

  test("shows generic error message when API fails without response data", async () => {
    axios.post.mockRejectedValueOnce({});

    render(
      <I18nextProvider i18n={i18n}>
        <AddUser handleToggleView={handleToggleViewMock} />
      </I18nextProvider>
    );

    // Llenar todos los campos correctamente
    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const usernameInput = screen.getByLabelText(/Nombre de usuario/i);
    fireEvent.change(usernameInput, { target: { value: "testuser" } });

    const passwordInput = screen.getByLabelText(/^Contraseña$/i);
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const confirmPasswordInput = screen.getByLabelText(/Confirmar contraseña/i);
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
    });

    const createAccountButton = screen.getByRole("button", {
      name: /Crear cuenta/i,
    });
    fireEvent.click(createAccountButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Error: Error al crear el usuario/i)
      ).toBeInTheDocument();
    });
  });

  test("toggles password visibility", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AddUser handleToggleView={handleToggleViewMock} />
      </I18nextProvider>
    );

    const passwordInput = screen.getByLabelText(/^Contraseña$/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const togglePasswordVisibilityButton =
      passwordInput.parentElement.querySelector("span");
    fireEvent.click(togglePasswordVisibilityButton);

    expect(passwordInput).toHaveAttribute("type", "text");

    // Volver a ocultar la contraseña
    fireEvent.click(togglePasswordVisibilityButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("toggles password confirmation visibility", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AddUser handleToggleView={handleToggleViewMock} />
      </I18nextProvider>
    );

    const confirmPasswordInput = screen.getByLabelText(/Confirmar contraseña/i);
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    const togglePasswordVisibilityButton =
      confirmPasswordInput.parentElement.querySelector("span");
    fireEvent.click(togglePasswordVisibilityButton);

    expect(confirmPasswordInput).toHaveAttribute("type", "text");

    // Volver a ocultar la contraseña
    fireEvent.click(togglePasswordVisibilityButton);
    expect(confirmPasswordInput).toHaveAttribute("type", "password");
  });

  test("automatically submits form when Enter key is pressed in an input", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    require("../../hooks/useSubmitOnEnter").mockImplementation((callback) => {
      return (event) => {
        if (event.key === "Enter") {
          callback();
        }
      };
    });

    render(
      <I18nextProvider i18n={i18n}>
        <AddUser handleToggleView={handleToggleViewMock} />
      </I18nextProvider>
    );

    // Llenar todos los campos correctamente
    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const usernameInput = screen.getByLabelText(/Nombre de usuario/i);
    fireEvent.change(usernameInput, { target: { value: "testuser" } });

    const passwordInput = screen.getByLabelText(/^Contraseña$/i);
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const confirmPasswordInput = screen.getByLabelText(/Confirmar contraseña/i);
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
    });

    fireEvent.keyDown(confirmPasswordInput, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  test("closes Snackbar after success message", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    jest.useFakeTimers();
  
    render(
      <I18nextProvider i18n={i18n}>
        <AddUser handleToggleView={handleToggleViewMock} />
      </I18nextProvider>
    );
  
    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Nombre de usuario/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText(/^Contraseña$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirmar contraseña/i), {
      target: { value: "password123" },
    });
  
    fireEvent.click(screen.getByRole("button", { name: /Crear cuenta/i }));
  
    await waitFor(() => {
      expect(screen.getByText(/Usuario creado con éxito/i)).toBeInTheDocument();
    });
  
    jest.advanceTimersByTime(6000);
  
    await waitFor(() => {
      expect(
        screen.queryByText(/Usuario creado con éxito/i)
      ).not.toBeInTheDocument();
    });
  
    jest.useRealTimers();
  });
});  
