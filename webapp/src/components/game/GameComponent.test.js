import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";
import Game from "./Game";

// Mock del gateway URL
jest.mock("../../../config", () => ({
  getGatewayUrl: () => "http://localhost:8000"
}))

// Mock de componentes utilizados por Game.js
jest.mock("../chatBox/ChatBox", () => {
  return function MockChatBox({ hintsLeft, setHintsLeft }) {
    return (
        <div data-testid="chat-box">
          <div>ChatBox Mock</div>
          <div data-testid="hints-left">Pistas restantes: {hintsLeft}</div>
          <button onClick={() => setHintsLeft(hintsLeft - 1)}>Usar pista</button>
        </div>
    );
  };
});

jest.mock("../infoDialog/InfoDialog", () => {
  return function MockInfoDialog({ title, content, onClose }) {
    return (
        <div data-testid="info-dialog">
          <h2>{title}</h2>
          <div>{content}</div>
          <button onClick={onClose}>Cerrar</button>
        </div>
    );
  };
});

// Mock reload de página
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true
});

// Mock de preguntas
const mockQuestions = [
  {
    pregunta: {
      es: "¿Cuál es la capital de Francia?",
      en: "What is the capital of France?"
    },
    respuestaCorrecta: {
      es: "París",
      en: "Paris"
    },
    respuestas: {
      es: ["Londres", "Roma", "Berlín"],
      en: ["London", "Rome", "Berlin"]
    },
    descripcion: "Es una ciudad europea.",
    img: []
  },
  {
    pregunta: {
      es: "¿Cuál es la capital de Italia?",
      en: "What is the capital of Italy?"
    },
    respuestaCorrecta: {
      es: "Roma",
      en: "Rome"
    },
    respuestas: {
      es: ["Londres", "Madrid", "Berlín"],
      en: ["London", "Madrid", "Berlin"]
    },
    descripcion: "Es una ciudad europea con mucha historia.",
    img: []
  }
]

// Configuración antes de cada prueba
beforeEach(() => {
  jest.useFakeTimers();
  mockReload.mockClear();

  jest.spyOn(global, "fetch").mockImplementation((url) => {
    if (url.includes("/questionsDB")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockQuestions)
      })
    }

    if (url.includes("/savestats")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "saved" })
      })
    }

    return Promise.reject(new Error("Not Found"))
  })

  Storage.prototype.getItem = jest.fn((key) => {
    if (key === "username") return "testUser"
    if (key === "quizConfig") {
      return JSON.stringify({
        numPreguntas: 2,
        tiempoPregunta: 10,
        limitePistas: 2,
        modoJuego: "Jugador vs IA",
        categories: ["all"]
      })
    }
    return null
  })

  Storage.prototype.setItem = jest.fn()
})

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.restoreAllMocks()
})

test("muestra una pregunta y permite seleccionar la respuesta correcta", async () => {
  render(
      <I18nextProvider i18n={i18n}>
        <Game />
      </I18nextProvider>
  )

  // Espera a que cargue la pregunta
  const questionText = await screen.findByText("¿Cuál es la capital de Francia?")
  expect(questionText).toBeInTheDocument()

  // Espera a que se rendericen los botones de respuesta
  const correctOption = await screen.findByRole("button", { name: /París/i })
  expect(correctOption).toBeInTheDocument()

  // Simula el clic en la opción correcta
  fireEvent.click(correctOption)

  // Espera a que cambie el estado de la respuesta seleccionada
  await waitFor(() => {
    expect(correctOption).toHaveClass("buttonCorrect")
  })
})

test("selecciona una respuesta incorrecta y muestra el feedback adecuado", async () => {
  render(
      <I18nextProvider i18n={i18n}>
        <Game />
      </I18nextProvider>
  )

  // Espera a que cargue la pregunta
  await screen.findByText("¿Cuál es la capital de Francia?")

  // Encuentra una opción incorrecta
  const incorrectOption = await screen.findByRole("button", { name: /Londres/i })

  // Simula el clic en la opción incorrecta
  fireEvent.click(incorrectOption)

  // Espera a que cambie el estado de la respuesta seleccionada
  await waitFor(() => {
    expect(incorrectOption).toHaveClass("buttonIncorrect")
  })
})

test("permite navegar a la siguiente pregunta después de responder", async () => {
  render(
      <I18nextProvider i18n={i18n}>
        <Game />
      </I18nextProvider>
  )

  // Espera a que cargue la primera pregunta
  await screen.findByText("¿Cuál es la capital de Francia?")

  // Responde la pregunta
  const correctOption = await screen.findByRole("button", { name: /París/i })
  fireEvent.click(correctOption)

  // Haz clic en el botón de siguiente pregunta
  const nextButton = screen.getByTitle("Siguiente pregunta");
  fireEvent.click(nextButton)

  // Verifica que se muestre la siguiente pregunta
  await waitFor(() => {
    expect(screen.getByText("¿Cuál es la capital de Italia?")).toBeInTheDocument()
  })
})

test("el temporizador disminuye correctamente", async () => {
  render(
      <I18nextProvider i18n={i18n}>
        <Game />
      </I18nextProvider>
  )

  // Espera a que cargue la pregunta
  await screen.findByText("¿Cuál es la capital de Francia?")

  // Avanza el temporizador
  act(() => {
    jest.advanceTimersByTime(5000); // 5 segundos
  });

  // Verifica que el temporizador haya disminuido
  expect(screen.getByText("00:05")).toBeInTheDocument()
})

test("muestra el resumen al terminar el juego", async () => {
  render(
      <I18nextProvider i18n={i18n}>
        <Game />
      </I18nextProvider>
  )

  // Responde la primera pregunta
  await screen.findByText("¿Cuál es la capital de Francia?")
  fireEvent.click(await screen.findByRole("button", { name: /París/i }))

  // Navega a la siguiente pregunta
  fireEvent.click(screen.getByTitle("Siguiente pregunta"));

  // Responde la segunda pregunta (última)
  await screen.findByText("¿Cuál es la capital de Italia?")
  fireEvent.click(await screen.findByRole("button", { name: /Roma/i }))

  // Espera a que se muestre el resumen
  await waitFor(() => {
    expect(screen.getByTestId("info-dialog")).toBeInTheDocument()
    expect(screen.getByText("Resumen de la partida")).toBeInTheDocument()
  })
})

test("maneja correctamente cuando se agota el tiempo", async () => {
  render(
      <I18nextProvider i18n={i18n}>
        <Game />
      </I18nextProvider>
  )

  // Espera a que cargue la pregunta
  await screen.findByText("¿Cuál es la capital de Francia?")

  // Avanza el temporizador hasta que se acabe el tiempo
  act(() => {
    jest.advanceTimersByTime(10000); // 10 segundos
  });

  // Verifica que el tiempo sea 0
  expect(screen.getByText("00:00")).toBeInTheDocument()
})

test("permite mostrar y ocultar las reglas del juego", async () => {
  render(
      <I18nextProvider i18n={i18n}>
        <Game />
      </I18nextProvider>
  )

  // Espera a que cargue la pregunta
  await screen.findByText("¿Cuál es la capital de Francia?")

  // Haz clic en el botón de reglas
  const rulesButton = screen.getByText("rules")
  fireEvent.click(rulesButton)

  // Verifica que se muestren las reglas
  await waitFor(() => {
    expect(screen.getByTestId("info-dialog")).toBeInTheDocument()
  })

  // Cierra las reglas
  fireEvent.click(screen.getByText("Cerrar"))

  // Verifica que las reglas ya no estén visibles
  await waitFor(() => {
    expect(screen.queryByTestId("info-dialog")).not.toBeInTheDocument()
  })
})

test("permite solicitar y mostrar pistas", async () => {
  render(
      <I18nextProvider i18n={i18n}>
        <Game />
      </I18nextProvider>
  )

  // Espera a que cargue la pregunta
  await screen.findByText("¿Cuál es la capital de Francia?")

  // Haz clic en el botón de pista
  const hintButton = screen.getByText("¿Necesitas una pista?")
  fireEvent.click(hintButton)

  // Verifica que el chat de pistas sea visible
  await waitFor(() => {
    expect(screen.getByTestId("chat-box")).toBeInTheDocument()
  })

  // Usa una pista
  fireEvent.click(screen.getByText("Usar pista"))

  // Verifica que se actualice el contador de pistas
  await waitFor(() => {
    expect(screen.getByTestId("hints-left")).toHaveTextContent("Pistas restantes: 1")
  })
})

test("guarda las estadísticas al finalizar el juego", async () => {
  render(
      <I18nextProvider i18n={i18n}>
        <Game />
      </I18nextProvider>
  )

  // Responde las preguntas y finaliza el juego
  await screen.findByText("¿Cuál es la capital de Francia?")
  fireEvent.click(await screen.findByRole("button", { name: /París/i }))
  fireEvent.click(screen.getByTitle("Siguiente pregunta"))

  await screen.findByText("¿Cuál es la capital de Italia?")
  fireEvent.click(await screen.findByRole("button", { name: /Roma/i }))

  // Verifica que se llame a fetch para guardar estadísticas
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/savestats"),
        expect.objectContaining({
          method: "POST",
          headers: expect.any(Object),
          body: expect.stringContaining("username")
        })
    );
  });
})
