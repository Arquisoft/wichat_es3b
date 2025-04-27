import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import ApiKeyGenerator from "./ApiKeyGenerator";
import axios from "axios";

// Mock de axios y lucide-react
jest.mock("axios");
jest.mock("lucide-react", () => ({
  Copy: jest.fn(() => null),
}));

// Mock de los componentes hijos
jest.mock("../../components/nav/Nav", () => () => <div>Nav Mock</div>);
jest.mock("../../components/Footer", () => () => <div>Footer Mock</div>);
jest.mock("../../components/button/BaseButton", () => ({ text, onClick }) => (
  <button onClick={onClick}>{text}</button>
));
jest.mock(
  "../../components/textField/WiChatTextField",
  () =>
    ({ type, value, onChange }) =>
      (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e)}
          data-testid="email-input"
        />
      )
);
jest.mock(
  "../../components/infoDialog/InfoDialog",
  () =>
    ({ title, content, onClose, variant }) =>
      (
        <div data-testid="info-dialog">
          <h3>{title}</h3>
          <div>{content}</div>
          <button onClick={onClose}>Close</button>
          <span>{variant}</span>
        </div>
      )
);

describe("ApiKeyGenerator Component", () => {
  beforeEach(() => {
    // Reset mocks antes de cada prueba
    axios.post.mockReset();
    window.navigator.clipboard = {
      writeText: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test("1. Renderiza correctamente el componente inicial", () => {
    render(<ApiKeyGenerator />);

    expect(screen.getByText("Solicitar API key")).toBeInTheDocument();
    expect(
      screen.getByText(/Ingresa tu correo electrónico/)
    ).toBeInTheDocument();
    expect(screen.getByTestId("email-input")).toBeInTheDocument();
    expect(screen.getByText("Generar API Key")).toBeInTheDocument();
    expect(screen.getByText("Nav Mock")).toBeInTheDocument();
    expect(screen.getByText("Footer Mock")).toBeInTheDocument();
  });

  test("2. Maneja el cambio en el campo de email", () => {
    render(<ApiKeyGenerator />);

    const emailInput = screen.getByTestId("email-input");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    expect(emailInput.value).toBe("test@example.com");
  });

  test("3. Maneja el envío del formulario con éxito", async () => {
    const mockApiKey = "test-api-key-123";
    axios.post.mockResolvedValueOnce({ data: { apiKey: mockApiKey } });

    render(<ApiKeyGenerator />);

    // Simular entrada de email
    const emailInput = screen.getByTestId("email-input");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    // Simular envío del formulario
    const submitButton = screen.getByText("Generar API Key");
    fireEvent.click(submitButton);

    // Verificar que se hizo la llamada a la API
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/generate-apikey"),
        { email: "test@example.com" }
      );
    });

    // Verificar que se muestra el diálogo con la API key
    await waitFor(() => {
      expect(screen.getByTestId("info-dialog")).toBeInTheDocument();
      expect(screen.getByText("API Key")).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockApiKey)).toBeInTheDocument();
    });
  });

  test("4. Maneja el error en el envío del formulario", async () => {
    const errorMessage = "Error de prueba";
    axios.post.mockRejectedValueOnce({
      response: {
        data: { error: errorMessage },
      },
    });

    render(<ApiKeyGenerator />);

    // Simular entrada de email
    const emailInput = screen.getByTestId("email-input");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    // Simular envío del formulario
    const submitButton = screen.getByText("Generar API Key");
    fireEvent.click(submitButton);

    // Verificar que se muestra el diálogo de error
    await waitFor(() => {
      expect(screen.getByTestId("info-dialog")).toBeInTheDocument();
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText("error")).toBeInTheDocument(); // Variant del diálogo
    });
  });

  test("5. Copia la API key al portapapeles", async () => {
    const mockApiKey = "test-api-key-123";
    axios.post.mockResolvedValueOnce({ data: { apiKey: mockApiKey } });

    render(<ApiKeyGenerator />);

    const emailInput = screen.getByTestId("email-input");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByText("Generar API Key"));

    await waitFor(() => {
      expect(screen.getByDisplayValue(mockApiKey)).toBeInTheDocument();
    });

    const copyButton = screen.getByTitle("Copiar al portapapeles");
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockApiKey);
    expect(screen.getByText("¡Copiado al portapapeles!")).toBeInTheDocument();

    // Esperar a que el mensaje desaparezca
    await waitFor(
      () => {
        expect(
          screen.queryByText("¡Copiado al portapapeles!")
        ).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    ); // Aumentar el timeout si es necesario
  });

  test("6. Cierra el diálogo y limpia el email", async () => {
    const mockApiKey = "test-api-key-123";
    axios.post.mockResolvedValueOnce({ data: { apiKey: mockApiKey } });

    render(<ApiKeyGenerator />);

    // Simular entrada y envío del formulario
    const emailInput = screen.getByTestId("email-input");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByText("Generar API Key"));

    // Esperar a que aparezca el diálogo
    await waitFor(() => {
      expect(screen.getByTestId("info-dialog")).toBeInTheDocument();
    });

    // Simular clic en el botón de cerrar
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);

    // Verificar que el diálogo se cierra
    expect(screen.queryByTestId("info-dialog")).not.toBeInTheDocument();

    // Verificar que el campo de email se limpia
    expect(emailInput.value).toBe("");
  });

  test("7. Maneja error cuando no hay respuesta del servidor", async () => {
    axios.post.mockRejectedValueOnce({
      message: "Network Error",
    });

    render(<ApiKeyGenerator />);

    // Simular entrada y envío del formulario
    const emailInput = screen.getByTestId("email-input");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByText("Generar API Key"));

    // Verificar que se muestra el mensaje de error por defecto
    await waitFor(() => {
      expect(screen.getByTestId("info-dialog")).toBeInTheDocument();
      expect(
        screen.getByText("Error al generar la API KEY")
      ).toBeInTheDocument();
    });
  });
});
