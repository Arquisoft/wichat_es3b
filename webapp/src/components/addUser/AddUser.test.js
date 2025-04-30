// src/components/AddUser.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import AddUser from "./AddUser";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";

// Mock de axios
jest.mock("axios");

// Mock del hook de traducción
jest.mock("react-i18next", () => ({
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
  const validUserData = {
    email: "test@example.com",
    username: "testuser",
    password: "password123",
    confirmPassword: "password123"
  };

  // Helper function to render component
  const renderAddUser = () => {
    return render(
      <I18nextProvider i18n={i18n}>
        <AddUser handleToggleView={handleToggleViewMock} />
      </I18nextProvider>
    );
  };

  // Helper function to fill form fields
  const fillFormFields = (fields = {}) => {
    const formData = { ...validUserData, ...fields };
    
    if (formData.email !== null) {
      const emailInput = screen.getByLabelText(/Correo electrónico/i);
      fireEvent.change(emailInput, { target: { value: formData.email } });
    }
    
    if (formData.username !== null) {
      const usernameInput = screen.getByLabelText(/Nombre de usuario/i);
      fireEvent.change(usernameInput, { target: { value: formData.username } });
    }
    
    if (formData.password !== null) {
      const passwordInput = screen.getByLabelText(/^Contraseña$/i);
      fireEvent.change(passwordInput, { target: { value: formData.password } });
    }
    
    if (formData.confirmPassword !== null) {
      const confirmPasswordInput = screen.getByLabelText(/Confirmar contraseña/i);
      fireEvent.change(confirmPasswordInput, { target: { value: formData.confirmPassword } });
    }
  };

  // Helper function to click create account button
  const clickCreateAccountButton = () => {
    const createAccountButton = screen.getByRole("button", { name: /Crear cuenta/i });
    fireEvent.click(createAccountButton);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders AddUser component correctly", () => {
    renderAddUser();

    expect(screen.getByLabelText(/Correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre de usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Contraseña$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmar contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Crear cuenta/i })).toBeInTheDocument();
  });

  test("toggles view when login button is clicked", () => {
    renderAddUser();

    const loginButton = screen.getByRole("button", { name: /Iniciar sesión/i });
    fireEvent.click(loginButton);

    expect(handleToggleViewMock).toHaveBeenCalledTimes(1);
  });

  test("shows error when email is empty", async () => {
    renderAddUser();
    clickCreateAccountButton();

    await waitFor(() => {
      expect(screen.getByText(/Error: El correo electrónico es obligatorio/i)).toBeInTheDocument();
    });
  });

  test("shows error when username is empty", async () => {
    renderAddUser();
    fillFormFields({ username: null });
    clickCreateAccountButton();

    await waitFor(() => {
      expect(screen.getByText(/Error: El nombre de usuario es obligatorio/i)).toBeInTheDocument();
    });
  });

  test("shows error when password is empty", async () => {
    renderAddUser();
    fillFormFields({ password: null });
    clickCreateAccountButton();

    await waitFor(() => {
      expect(screen.getByText(/Error: La contraseña es obligatoria/i)).toBeInTheDocument();
    });
  });

  test("shows error when password confirmation is empty", async () => {
    renderAddUser();
    fillFormFields({ confirmPassword: null });
    clickCreateAccountButton();

    await waitFor(() => {
      expect(screen.getByText(/Error: Confirma la contraseña/i)).toBeInTheDocument();
    });
  });

  test("shows error when passwords do not match", async () => {
    renderAddUser();
    fillFormFields({ confirmPassword: "differentpassword" });
    clickCreateAccountButton();

    await waitFor(() => {
      expect(screen.getByText(/Error: Las contraseñas no coinciden/i)).toBeInTheDocument();
    });
  });

  test("successfully adds user when all inputs are valid", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    renderAddUser();
    fillFormFields();
    clickCreateAccountButton();

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(expect.any(String), {
        email: validUserData.email,
        username: validUserData.username,
        password: validUserData.password,
      });
      expect(screen.findByText(/Usuario añadido correctamente/i)).toBeInTheDocument();
    });
  });

  test("shows error message when API call fails", async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { error: "Usuario ya existe" } },
    });
    
    renderAddUser();
    fillFormFields();
    clickCreateAccountButton();

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
      expect(screen.getByText(/Error: Usuario ya existe/i)).toBeInTheDocument();
    });
  });

  test("shows generic error message when API fails without response data", async () => {
    axios.post.mockRejectedValueOnce({});
    
    renderAddUser();
    fillFormFields();
    clickCreateAccountButton();

    await waitFor(() => {
      expect(screen.getByText(/Error: Error al crear el usuario/i)).toBeInTheDocument();
    });
  });

  test("toggles password visibility", () => {
    renderAddUser();

    const passwordInput = screen.getByLabelText(/^Contraseña$/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const togglePasswordVisibilityButton = passwordInput.parentElement.querySelector("span");
    fireEvent.click(togglePasswordVisibilityButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    // Volver a ocultar la contraseña
    fireEvent.click(togglePasswordVisibilityButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("toggles password confirmation visibility", () => {
    renderAddUser();

    const confirmPasswordInput = screen.getByLabelText(/Confirmar contraseña/i);
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    const togglePasswordVisibilityButton = confirmPasswordInput.parentElement.querySelector("span");
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

    renderAddUser();
    fillFormFields();

    const confirmPasswordInput = screen.getByLabelText(/Confirmar contraseña/i);
    fireEvent.keyDown(confirmPasswordInput, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  test("closes Snackbar after success message", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    jest.useFakeTimers();
  
    renderAddUser();
    fillFormFields();
    clickCreateAccountButton();
  
    await waitFor(() => {
      expect(screen.findByText(/Usuario añadido correctamente/i)).toBeInTheDocument();
    });
  
    jest.advanceTimersByTime(6000);
  
    await waitFor(() => {
      expect(screen.findByText(/Usuario añadido correctamente/i)).not.toBeInTheDocument();
    });
  
    jest.useRealTimers();
  });
});