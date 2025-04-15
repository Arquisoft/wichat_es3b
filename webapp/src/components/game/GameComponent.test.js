import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n"; 
import Game from "./Game";

// Mocks de localStorage y configuración
const mockConfig = {
  numPreguntas: 2,
  tiempoPregunta: 30,
  limitePistas: 3,
  modoJuego: "Jugador vs IA",
  categories: ["cine"]
};

beforeEach(() => {
  localStorage.setItem("username", "testuser");
  localStorage.setItem("quizConfig", JSON.stringify(mockConfig));
  jest.resetAllMocks();
});

// Simulación básica de preguntas
const mockQuestions = [
  {
    pregunta: { es: "¿Cuál es la capital de Francia?" },
    respuestaCorrecta: { es: "París" },
    respuestas: { es: ["Madrid", "Roma", "Londres", "París"] },
    descripcion: [],
    img: []
  },
  {
    pregunta: { es: "¿Cuál es el río más largo del mundo?" },
    respuestaCorrecta: { es: "Amazonas" },
    respuestas: { es: ["Nilo", "Misisipi", "Yangtsé", "Amazonas"] },
    descripcion: [],
    img: []
  }
];

describe("Game Component", () => {
  test("Debería renderizar y mostrar la primera pregunta", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockQuestions)
    });

    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <Game />
        </MemoryRouter>
      </I18nextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/¿Cuál es la capital de Francia\?/)).toBeInTheDocument();
    });

    const options = ["Madrid", "Roma", "Londres", "París"];
    options.forEach((opt) => {
      expect(screen.getByText(opt)).toBeInTheDocument();
    });
  });

  test("Debería procesar una respuesta correcta", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockQuestions)
    });

    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <Game />
        </MemoryRouter>
      </I18nextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/¿Cuál es la capital de Francia\?/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("París"));
    await waitFor(() => {
      expect(screen.getByText(/¿Cuál es el río más largo del mundo\?/)).toBeInTheDocument();
    });
  });

  test("Debería procesar una respuesta incorrecta", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockQuestions)
    });

    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <Game />
        </MemoryRouter>
      </I18nextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/¿Cuál es la capital de Francia\?/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Madrid")); // Incorrecta
    await waitFor(() => {
      expect(screen.getByText(/¿Cuál es el río más largo del mundo\?/)).toBeInTheDocument();
    });
  });

  test("Debería mostrar el resumen del juego al final", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockQuestions)
    });

    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <Game />
        </MemoryRouter>
      </I18nextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/¿Cuál es la capital de Francia\?/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("París"));
    await waitFor(() => {
      expect(screen.getByText(/¿Cuál es el río más largo del mundo\?/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Amazonas"));

    await waitFor(() => {
      expect(screen.getByText(/Resumen de la partida/)).toBeInTheDocument();
      expect(screen.getByText(/Respuestas correctas:/)).toBeInTheDocument();
    });
  });

  test("Debería mostrar error cuando no se puedan obtener las preguntas", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Internal error" })
    });

    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <Game />
        </MemoryRouter>
      </I18nextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeInTheDocument(); 
    });
  });
});
