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
      const answers = screen.getAllByText(opt);

      expect(answers.length).toBeGreaterThan(0);
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

    const parisButton = await screen.findAllByText("París")
    expect(parisButton.length).toBeGreaterThan(0)
    fireEvent.click(parisButton[0])


    await waitFor(() => {
      var botonSiguiente = screen.getByTitle("Siguiente pregunta");
      fireEvent.click(botonSiguiente);
    });

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
      var botonSiguiente = screen.getByTitle("Siguiente pregunta");
      fireEvent.click(botonSiguiente);
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

    const parisButton = await screen.findAllByText("París")
    expect(parisButton.length).toBeGreaterThan(0)
    fireEvent.click(parisButton[0])

    await waitFor(() => {
      var botonSiguiente = screen.getByTitle("Siguiente pregunta");
      fireEvent.click(botonSiguiente);
    });

    await waitFor(() => {
      expect(screen.getByText(/¿Cuál es el río más largo del mundo\?/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Amazonas"));

    await waitFor(() => {
      expect(screen.getByText(/Resumen de la partida/)).toBeInTheDocument();
      expect(screen.getByText(/Respuestas correctas:/)).toBeInTheDocument();
    });
  });

});