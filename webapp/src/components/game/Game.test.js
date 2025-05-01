import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  within,
} from "@testing-library/react";
import Game from "./Game";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (key === "questionImageAlt" && options && options.question) {
        return `Image for: ${options.question}`;
      }
      return options?.fallback || key;
    },
    i18n: { language: "es", changeLanguage: jest.fn() },
  }),
}));

jest.mock("../button/BaseButton", () => (props) => (
  <button
    onClick={props.onClick}
    disabled={props.disabled}
    data-testid={`button-${props.text}`}
    className={props.buttonType}
  >
    {props.text}
  </button>
));

jest.mock("../hintButton/HintButton", () => (props) => (
  <button
    onClick={props.onClick}
    disabled={props.disabled}
    data-testid={`hint-button-${props.text}`}
  >
    {props.text}
  </button>
));

jest.mock("../chatBox/ChatBox", () => (props) => (
  <div data-testid="chat-box">
    <button
      data-testid="use-hint-button"
      onClick={() => props.setHintsLeft(props.hintsLeft - 1)}
    >
      Use Hint
    </button>
    <span data-testid="hints-left">{props.hintsLeft}</span>
    <span data-testid="chat-box-visible">{props.isVisible.toString()}</span>
  </div>
));

jest.mock("../infoDialog/InfoDialog", () => (props) => (
  <div data-testid="info-dialog">
    <h2>{props.title}</h2>
    <div>{props.content}</div>
    <button onClick={props.onClose} data-testid="info-dialog-close-button">
      Close
    </button>
  </div>
));

jest.mock("@mui/material/LinearProgress", () => (props) => (
  <div data-testid="progress-bar" style={{ width: `${props.value}%` }}>
    {props.value}%
  </div>
));

jest.mock("@mui/material/Box", () => (props) => (
  <div {...props}>{props.children}</div>
));

jest.mock("@mui/icons-material/ArrowForward", () => (props) => (
  <svg data-testid="next-arrow" onClick={props.onClick} style={props.style} />
));

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("username", "TestUser");
  localStorage.setItem(
    "quizConfig",
    JSON.stringify({
      numPreguntas: 2,
      tiempoPregunta: 30,
      limitePistas: 3,
      modoJuego: "singleplayer",
      categories: ["cine"],
    })
  );

  global.fetch = jest.fn((url) => {
    if (url.includes("/questionsDB")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              pregunta: { es: "Pregunta 1" },
              respuestaCorrecta: { es: "Correcta1" },
              respuestas: { es: ["Incorrecta1A", "Incorrecta1B"] },
              img: ["http://example.com/image1.jpg"],
            },
            {
              pregunta: { es: "Pregunta 2" },
              respuestaCorrecta: { es: "Correcta2" },
              respuestas: { es: ["Incorrecta2A", "Incorrecta2B"] },
              img: [],
            },
          ]),
      });
    } else if (url.includes("/savestats")) {
      return Promise.resolve({ ok: true });
    }
    return Promise.reject(
      new Error(`Unhandled URL in global fetch mock: ${url}`)
    );
  });

  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation((message) => {
    if (
      typeof message === "string" &&
      (message.includes("React state update on an unmounted component") ||
        message.includes("validateDOMNesting"))
    ) {
      return;
    }
  });

  jest.useRealTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test("carga inicial y renderiza la primera pregunta", async () => {
  render(<Game />);

  // Wait for the first question text to appear
  await waitFor(() => {
    expect(screen.getByText("Pregunta 1")).toBeInTheDocument();
  });

  // Wait for answer buttons to be rendered
  await waitFor(() => {
    expect(screen.getByTestId("button-Correcta1")).toBeInTheDocument();
  });

  // Now test for the other buttons
  expect(screen.getByTestId("button-Incorrecta1A")).toBeInTheDocument();
  expect(screen.getByTestId("button-Incorrecta1B")).toBeInTheDocument();
});

test("muestra la imagen de la pregunta cuando está disponible", async () => {
  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  const image = screen.getByAltText("Image for: Pregunta 1");
  expect(image).toBeInTheDocument();
  expect(image.src).toContain("example.com/image1.jpg");
});

test("maneja error en la carga de la imagen", async () => {
  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  const image = screen.getByAltText("Image for: Pregunta 1");
  fireEvent.error(image);
  expect(image.style.display).toBe("none");
});

test("muestra la categoría correctamente", async () => {
  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  expect(screen.getByText("cinema 🎬")).toBeInTheDocument();
});

test("muestra 'various' para múltiples categorías", async () => {
  localStorage.setItem(
    "quizConfig",
    JSON.stringify({
      numPreguntas: 2,
      tiempoPregunta: 30,
      categories: ["cine", "literatura"],
    })
  );

  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  expect(screen.getByText("various 🧩")).toBeInTheDocument();
});

test("muestra 'all' para categoría por defecto", async () => {
  localStorage.setItem(
    "quizConfig",
    JSON.stringify({
      numPreguntas: 2,
      tiempoPregunta: 30,
      categories: ["all"],
    })
  );

  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  expect(screen.getByText("all 🧠")).toBeInTheDocument();
});

test("muestra correctamente el timer", async () => {
  jest.useFakeTimers();
  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  expect(screen.getByText("00:30")).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(5000);
  });

  expect(screen.getByText("00:25")).toBeInTheDocument();
  expect(screen.getByTestId("progress-bar").textContent).toBe(
    "83.33333333333334%"
  );

  jest.useRealTimers();
});

test("responde correctamente y actualiza el puntaje", async () => {
  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  const scoreDisplay = screen.getByText("score:").nextElementSibling;
  expect(scoreDisplay).toHaveTextContent("0");

  fireEvent.click(screen.getByTestId("button-Correcta1"));

  await waitFor(() => {
    expect(scoreDisplay).toHaveTextContent("30");
  });
});

test("responde incorrectamente y no incrementa el puntaje", async () => {
  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  fireEvent.click(screen.getByTestId("button-Incorrecta1A"));

  expect(screen.getByText("0")).toBeInTheDocument();
});

test("timeout marca la respuesta como incorrecta", async () => {
  jest.useFakeTimers();
  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  act(() => {
    jest.advanceTimersByTime(31000);
  });

  await waitFor(() => {
    const correctButton = screen.getByTestId("button-Correcta1");
    expect(correctButton).toHaveClass("buttonCorrect");
    expect(correctButton).toBeDisabled();
  });

  expect(screen.getByText("0")).toBeInTheDocument();

  jest.useRealTimers();
});

test("navega a la siguiente pregunta", async () => {
  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  fireEvent.click(screen.getByTestId("button-Correcta1"));

  const nextButton = screen.getByTestId("next-arrow");
  expect(nextButton).toHaveStyle({
    backgroundColor: "var(--color-primario)",
    opacity: "1",
  });

  fireEvent.click(nextButton);

  await waitFor(() => {
    expect(screen.getByText("Pregunta 2")).toBeInTheDocument();
    expect(screen.getByText("question 2/2")).toBeInTheDocument();
  });
});

test("próximo botón deshabilitado antes de responder", async () => {
  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  const nextButton = screen.getByTestId("next-arrow");
  expect(nextButton).toHaveStyle({
    opacity: "0.5",
    backgroundColor: "#ccc",
  });

  fireEvent.click(nextButton);
  expect(screen.getByText("Pregunta 1")).toBeInTheDocument();
});

test("muestra el dialogo de reglas", async () => {
  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  fireEvent.click(screen.getByTestId("button-rules"));

  expect(screen.getByTestId("info-dialog")).toBeInTheDocument();
  expect(screen.getByText("gameRules")).toBeInTheDocument();

  fireEvent.click(screen.getByTestId("info-dialog-close-button"));

  await waitFor(() => {
    expect(screen.queryByTestId("info-dialog")).not.toBeInTheDocument();
  });
});

test("muestra el resumen al finalizar el juego", async () => {
  localStorage.setItem(
    "quizConfig",
    JSON.stringify({
      numPreguntas: 1,
      tiempoPregunta: 30,
      categories: ["cine"],
    })
  );

  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  fireEvent.click(screen.getByTestId("button-Correcta1"));

  await waitFor(() => {
    expect(screen.getByTestId("info-dialog")).toBeInTheDocument();
    expect(screen.getByText("summaryTitle")).toBeInTheDocument();
    expect(screen.getByText(/summaryCorrect/)).toHaveTextContent(
      "summaryCorrect 1"
    );
    expect(screen.getByText(/summaryIncorrect/)).toHaveTextContent(
      "summaryIncorrect 0"
    );
    expect(screen.getByText(/summaryRatio/)).toHaveTextContent(
      "summaryRatio 100%"
    );
    expect(screen.getByText(/summaryMaxScore/)).toHaveTextContent(
      "summaryMaxScore 30"
    );
  });
});

test("llama a onGameEnd cuando se cierra el resumen", async () => {
  localStorage.setItem(
    "quizConfig",
    JSON.stringify({
      numPreguntas: 1,
      tiempoPregunta: 30,
      categories: ["cine"],
    })
  );

  const mockOnGameEnd = jest.fn();
  render(<Game onGameEnd={mockOnGameEnd} />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  fireEvent.click(screen.getByTestId("button-Correcta1"));

  await waitFor(() => screen.getByTestId("info-dialog"));
  fireEvent.click(screen.getByTestId("info-dialog-close-button"));

  expect(mockOnGameEnd).toHaveBeenCalledTimes(1);
});

test("recarga la página cuando onGameEnd no existe", async () => {
  localStorage.setItem(
    "quizConfig",
    JSON.stringify({
      numPreguntas: 1,
      tiempoPregunta: 30,
      categories: ["cine"],
    })
  );

  const reloadMock = jest.fn();
  const originalLocation = window.location;
  delete window.location;
  window.location = { reload: reloadMock };

  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  fireEvent.click(screen.getByTestId("button-Correcta1"));

  await waitFor(() => screen.getByTestId("info-dialog"));
  fireEvent.click(screen.getByTestId("info-dialog-close-button"));

  expect(reloadMock).toHaveBeenCalledTimes(1);

  window.location = originalLocation;
});

test("maneja errores al cargar preguntas", async () => {
  global.fetch = jest.fn((url) => {
    if (url.includes("/questionsDB")) {
      return Promise.resolve({ ok: false, statusText: "Server Error" });
    }
    return Promise.reject(
      new Error(`Unhandled URL in global fetch mock: ${url}`)
    );
  });

  render(<Game />);
  await waitFor(() => {
    expect(
      screen.getByText("Error: No question data available.")
    ).toBeInTheDocument();
  });
});

test("maneja respuesta vacía de preguntas", async () => {
  global.fetch = jest.fn((url) => {
    if (url.includes("/questionsDB")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }
    return Promise.reject(
      new Error(`Unhandled URL in global fetch mock: ${url}`)
    );
  });

  render(<Game />);
  await waitFor(() => {
    expect(
      screen.getByText("Error: No question data available.")
    ).toBeInTheDocument();
  });
});

test("maneja error al guardar estadísticas", async () => {
  localStorage.setItem(
    "quizConfig",
    JSON.stringify({
      numPreguntas: 1,
      tiempoPregunta: 30,
      categories: ["cine"],
    })
  );

  global.fetch = jest.fn((url) => {
    if (url.includes("/questionsDB")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              pregunta: { es: "Pregunta 1" },
              respuestaCorrecta: { es: "Correcta1" },
              respuestas: { es: ["Incorrecta1A", "Incorrecta1B"] },
              img: [],
            },
          ]),
      });
    } else if (url.includes("/savestats")) {
      return Promise.resolve({ ok: false, statusText: "Save Stats Failed" });
    }
    return Promise.reject(
      new Error(`Unhandled URL in global fetch mock: ${url}`)
    );
  });

  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  fireEvent.click(screen.getByTestId("button-Correcta1"));

  await waitFor(() => screen.getByTestId("info-dialog"));

  expect(errorSpy).toHaveBeenCalledWith(
    "Error saving single player statistics:",
    expect.any(Error)
  );

  errorSpy.mockRestore();
});

test("maneja cuando no hay categorías configuradas", async () => {
  localStorage.setItem(
    "quizConfig",
    JSON.stringify({
      numPreguntas: 2,
      tiempoPregunta: 30,
      categories: [],
    })
  );

  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

  render(<Game />);
  await waitFor(() => {
    expect(
      screen.getByText("Error: No question data available.")
    ).toBeInTheDocument();
  });

  expect(warnSpy).toHaveBeenCalledWith(
    "No categories selected, cannot fetch questions."
  );

  warnSpy.mockRestore();
});

test("alterna la visibilidad del chat de pistas", async () => {
  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  const chatBox = screen.getByTestId("chat-box-visible");
  expect(chatBox.textContent).toBe("false");

  fireEvent.click(screen.getByTestId("hint-button-needHint"));

  await waitFor(() => {
    expect(chatBox.textContent).toBe("true");
  });

  fireEvent.click(screen.getByTestId("hint-button-hideHints"));

  await waitFor(() => {
    expect(chatBox.textContent).toBe("false");
  });
});

test("reduce el contador de pistas al usar una", async () => {
  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  fireEvent.click(screen.getByTestId("hint-button-needHint"));

  await waitFor(() => {
    expect(screen.getByTestId("hints-left").textContent).toBe("3");
  });

  fireEvent.click(screen.getByTestId("use-hint-button"));

  expect(screen.getByTestId("hints-left").textContent).toBe("2");
});

test("deshabilita el botón de pistas cuando no quedan", async () => {
  localStorage.setItem(
    "quizConfig",
    JSON.stringify({
      numPreguntas: 2,
      tiempoPregunta: 30,
      limitePistas: 1,
      categories: ["cine"],
    })
  );

  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  fireEvent.click(screen.getByTestId("hint-button-needHint"));
  await waitFor(() => screen.getByTestId("use-hint-button"));
  fireEvent.click(screen.getByTestId("use-hint-button"));

  fireEvent.click(screen.getByTestId("hint-button-hideHints"));

  const hintButton = screen.getByTestId("hint-button-needHint");
  expect(hintButton).toBeDisabled();
});

test("utiliza configuración por defecto cuando no hay localStorage", async () => {
  localStorage.clear();

  render(<Game />);
  await waitFor(() => {
    expect(screen.getByText(/question 1\/10/)).toBeInTheDocument();
  });
});

test("cálculo correcto de ratio en el resumen con cero correctas", async () => {
  localStorage.setItem(
    "quizConfig",
    JSON.stringify({
      numPreguntas: 1,
      tiempoPregunta: 30,
      categories: ["cine"],
    })
  );

  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  fireEvent.click(screen.getByTestId("button-Incorrecta1A"));

  await waitFor(() => {
    expect(screen.getByTestId("info-dialog")).toBeInTheDocument();
    expect(screen.getByText("summaryCorrect 0")).toBeInTheDocument();
    expect(screen.getByText("summaryIncorrect 1")).toBeInTheDocument();
    expect(screen.getByText("summaryRatio 0%")).toBeInTheDocument();
  });
});

test("muestra mensaje de carga mientras se inicializa", async () => {
  global.fetch = jest.fn(
    () =>
      new Promise((resolve) =>
        setTimeout(() => {
          resolve({
            ok: true,
            json: () =>
              Promise.resolve([
                {
                  pregunta: { es: "Pregunta 1" },
                  respuestaCorrecta: { es: "Correcta1" },
                  respuestas: { es: ["Incorrecta1A", "Incorrecta1B"] },
                  img: [],
                },
              ]),
          });
        }, 100)
      )
  );

  render(<Game />);

  expect(screen.getByText("loading")).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText("Pregunta 1")).toBeInTheDocument();
  });
});

test("actualiza correctamente el tiempo total usado", async () => {
  jest.useFakeTimers();

  render(<Game />);
  await waitFor(() => screen.getByText("Pregunta 1"));

  act(() => {
    jest.advanceTimersByTime(10000);
  });

  fireEvent.click(screen.getByTestId("button-Correcta1"));

  fireEvent.click(screen.getByTestId("next-arrow"));

  await waitFor(() => {
    expect(screen.getByText("Pregunta 2")).toBeInTheDocument();
  });

  act(() => {
    jest.advanceTimersByTime(5000);
  });

  fireEvent.click(screen.getByTestId("button-Correcta2"));

  await waitFor(() => {
    expect(screen.getByTestId("info-dialog")).toBeInTheDocument();
    expect(screen.getByText("summaryAvgTime 7.50s")).toBeInTheDocument();
  });

  jest.useRealTimers();
});
