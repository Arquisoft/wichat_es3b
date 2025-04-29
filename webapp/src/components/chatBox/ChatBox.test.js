import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import ChatBox from "./ChatBox";
import axios from "axios";
import useSubmitOnEnter from "../../hooks/useSubmitOnEnter";

// Mock de las dependencias
jest.mock("axios");
jest.mock("../../hooks/useSubmitOnEnter", () =>
  jest.fn((callback) => (event) => {
    if (event.key === "Enter") callback();
  })
);
jest.mock("@mui/icons-material/ArrowUpward", () => () => (
  <div data-testid="mock-arrow-icon">ArrowUpward</div>
));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        hintsLeft: "Pistas restantes",
        askAIForHints: "Pregunta al asistente por pistas",
        noHintsLeft: "No hay más pistas disponibles",
        hintError: "Error al obtener la pista",
      };
      return translations[key] || key;
    },
  }),
}));

describe("ChatBox Component", () => {
  const mockQuestion = "¿Cuál es la capital de España?";
  const mockSetHintsLeft = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("no se renderiza cuando isVisible es false", () => {
    render(
      <ChatBox
        question={mockQuestion}
        isVisible={false}
        hintsLeft={3}
        setHintsLeft={mockSetHintsLeft}
      />
    );

    expect(screen.queryByText("Pistas restantes")).not.toBeInTheDocument();
  });

  test("se renderiza correctamente cuando isVisible es true", () => {
    render(
      <ChatBox
        question={mockQuestion}
        isVisible={true}
        hintsLeft={3}
        setHintsLeft={mockSetHintsLeft}
      />
    );

    expect(screen.getByText("Pistas restantes:")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Pregunta al asistente por pistas")
    ).toBeInTheDocument();
  });

  test("muestra el contador de pistas correctamente", () => {
    render(
      <ChatBox
        question={mockQuestion}
        isVisible={true}
        hintsLeft={0}
        setHintsLeft={mockSetHintsLeft}
      />
    );

    const hintsCounter = screen.getByText("0");
    expect(hintsCounter).toHaveClass("no-hints");
    expect(
      screen.getByPlaceholderText("No hay más pistas disponibles")
    ).toBeInTheDocument();
  });

  test("desactiva el input y botón cuando no quedan pistas", () => {
    render(
      <ChatBox
        question={mockQuestion}
        isVisible={true}
        hintsLeft={0}
        setHintsLeft={mockSetHintsLeft}
      />
    );

    const input = screen.getByPlaceholderText("No hay más pistas disponibles");
    const button = screen.getByRole("button");

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  test("actualiza el valor del input al escribir", () => {
    render(
      <ChatBox
        question={mockQuestion}
        isVisible={true}
        hintsLeft={3}
        setHintsLeft={mockSetHintsLeft}
      />
    );

    const input = screen.getByPlaceholderText(
      "Pregunta al asistente por pistas"
    );
    fireEvent.change(input, { target: { value: "¿Dónde está Madrid?" } });

    expect(input.value).toBe("¿Dónde está Madrid?");
  });

  test("envía el mensaje al hacer clic en el botón", async () => {
    axios.post.mockResolvedValueOnce({
      data: { answer: "Madrid es la capital de España" },
    });

    render(
      <ChatBox
        question={mockQuestion}
        isVisible={true}
        hintsLeft={3}
        setHintsLeft={mockSetHintsLeft}
      />
    );

    const input = screen.getByPlaceholderText(
      "Pregunta al asistente por pistas"
    );
    const button = screen.getByRole("button");

    fireEvent.change(input, { target: { value: "¿Dónde está Madrid?" } });
    fireEvent.click(button);

    // Verificar que el mensaje del usuario se muestra
    expect(screen.getByText("¿Dónde está Madrid?")).toBeInTheDocument();

    // Esperar a que se muestre la respuesta
    await waitFor(() => {
      expect(
        screen.getByText("Madrid es la capital de España")
      ).toBeInTheDocument();
    });

    // Verificar que se llamó a axios.post con los parámetros correctos
    expect(axios.post).toHaveBeenCalledWith(expect.any(String), {
      userQuestion: "¿Dónde está Madrid?",
      question: mockQuestion,
      idioma: "es",
    });

    // Verificar que se decrementó el contador de pistas
    expect(mockSetHintsLeft).toHaveBeenCalledWith(expect.any(Function));
  });

  // Test "envía el mensaje al presionar Enter" removed as requested.

  test("no envía mensaje si el input está vacío", () => {
    render(
      <ChatBox
        question={mockQuestion}
        isVisible={true}
        hintsLeft={3}
        setHintsLeft={mockSetHintsLeft}
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(axios.post).not.toHaveBeenCalled();
  });

  test("muestra un error si la petición falla", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network error"));

    render(
      <ChatBox
        question={mockQuestion}
        isVisible={true}
        hintsLeft={3}
        setHintsLeft={mockSetHintsLeft}
      />
    );

    const input = screen.getByPlaceholderText(
      "Pregunta al asistente por pistas"
    );
    const button = screen.getByRole("button");

    fireEvent.change(input, { target: { value: "¿Dónde está Madrid?" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Error al obtener la pista")).toBeInTheDocument();
    });
  });

  test("muestra un alert cuando no hay pistas y se intenta obtener una", async () => {
    global.alert = jest.fn();

    render(
      <ChatBox
        question={mockQuestion}
        isVisible={true}
        hintsLeft={0}
        setHintsLeft={mockSetHintsLeft}
      />
    );

    // Acceder y llamar a getHint directamente
    // This part of the test might need refactoring if getHint is not exposed or directly callable like this.
    // However, keeping it as it was in the original code since the request was to remove a different test.
    const instance = screen.getByText("Pistas restantes:").closest(".chat-box");
    const chatBoxInstance = {
      getHint: async () => {
        alert("No hay más pistas disponibles.");
        return;
      },
    };

    await chatBoxInstance.getHint();

    expect(global.alert).toHaveBeenCalledWith("No hay más pistas disponibles.");
  });

  test("muestra los puntos de carga durante la obtención de pistas", async () => {
    // Crear una promesa que no se resuelva de inmediato
    let resolvePromise;
    const mockPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    axios.post.mockImplementationOnce(() => mockPromise);

    render(
      <ChatBox
        question={mockQuestion}
        isVisible={true}
        hintsLeft={3}
        setHintsLeft={mockSetHintsLeft}
      />
    );

    const input = screen.getByPlaceholderText(
      "Pregunta al asistente por pistas"
    );
    const button = screen.getByRole("button");

    fireEvent.change(input, { target: { value: "¿Dónde está Madrid?" } });
    fireEvent.click(button);

    // Avanzar el tiempo para que se muestre el indicador de carga
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Resolver la promesa para finalizar la carga
    resolvePromise({ data: { answer: "Madrid es la capital de España" } });

    await waitFor(() => {
      expect(
        screen.getByText("Madrid es la capital de España")
      ).toBeInTheDocument();
    });
  });

  test("prueba el efecto para la animación de carga", async () => {
    jest.useFakeTimers();

    // Crear una promesa que no se resuelva inmediatamente
    let resolvePromise;
    const mockPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    axios.post.mockImplementationOnce(() => mockPromise);

    render(
      <ChatBox
        question={mockQuestion}
        isVisible={true}
        hintsLeft={3}
        setHintsLeft={mockSetHintsLeft}
      />
    );

    const input = screen.getByPlaceholderText(
      "Pregunta al asistente por pistas"
    );
    const button = screen.getByRole("button");

    fireEvent.change(input, { target: { value: "¿Dónde está Madrid?" } });
    fireEvent.click(button);

    // Avanzar el tiempo para ver la animación de carga
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Resolver la promesa
    resolvePromise({ data: { answer: "Madrid es la capital de España" } });

    await waitFor(() => {
      expect(
        screen.getByText("Madrid es la capital de España")
      ).toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});
