// src/components/__tests__/GameSettingsSidebar.test.js
import { render, screen, fireEvent, act } from "@testing-library/react";
import GameSettingsSidebar from "../gameSettingsSidebar/GameSettingsSidebar";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";

// Mock de los valores almacenados en localStorage
let mockLocalStorage = {};

// Mock de localStorage
beforeEach(() => {
  // Reiniciar el mock de localStorage antes de cada prueba
  mockLocalStorage = {
    quizConfig: JSON.stringify({
      numPreguntas: 10,
      tiempoPregunta: 30,
      limitePistas: 3,
      modoJuego: "singleplayer",
      categories: ["all"],
    }),
  };

  // Mock de localStorage - importante sobreescribir ambos métodos
  Storage.prototype.getItem = jest.fn((key) => mockLocalStorage[key] || null);
  Storage.prototype.setItem = jest.fn((key, value) => {
    mockLocalStorage[key] = value;
  });
  Storage.prototype.clear = jest.fn(() => {
    mockLocalStorage = {};
  });

  // Mock de console.error
  console.error = jest.fn();
});

// Restaurar el prototipo original después de las pruebas
afterAll(() => {
  // Restaurar los métodos originales de Storage
  jest.restoreAllMocks();
});

describe("GameSettingsSidebar component", () => {
  const renderSidebar = (isOpen = true) => {
    return render(
      <I18nextProvider i18n={i18n}>
        <GameSettingsSidebar
          isOpen={isOpen}
          toggleButton={<button>Toggle</button>}
        />
      </I18nextProvider>
    );
  };

  // Basic rendering tests
  test("Renderiza las etiquetas de configuración traducidas", () => {
    renderSidebar();

    expect(screen.getByLabelText(i18n.t("numQuestions"))).toBeInTheDocument();
    expect(
      screen.getByLabelText(i18n.t("timePerQuestion"))
    ).toBeInTheDocument();
    expect(screen.getByLabelText(i18n.t("aiHintLimit"))).toBeInTheDocument();
    expect(screen.getByLabelText(i18n.t("gameMode"))).toBeInTheDocument();
  });

  test("Muestra el botón toggle si isOpen es true", () => {
    renderSidebar(true);
    expect(screen.getByText("Toggle")).toBeInTheDocument();
  });

  test("Oculta el botón toggle si isOpen es false", () => {
    renderSidebar(false);
    expect(screen.queryByText("Toggle")).not.toBeInTheDocument();
  });

  test("Aplica la clase 'open' cuando isOpen es true", () => {
    renderSidebar(true);
    const sidebar = screen
      .getByText(i18n.t("settings"))
      .closest(".gameSettingsSidebar");
    expect(sidebar).toHaveClass("open");
  });

  test("No aplica la clase 'open' cuando isOpen es false", () => {
    renderSidebar(false);
    const sidebar = screen
      .getByText(i18n.t("settings"))
      .closest(".gameSettingsSidebar");
    expect(sidebar).not.toHaveClass("open");
  });

  // State initialization tests
  test("Inicializa con valores por defecto cuando localStorage está vacío", () => {
    mockLocalStorage = {}; // Vaciar localStorage
    renderSidebar();

    expect(screen.getByLabelText(i18n.t("numQuestions"))).toHaveValue("10");
    expect(screen.getByLabelText(i18n.t("timePerQuestion"))).toHaveValue("30");
    expect(screen.getByLabelText(i18n.t("aiHintLimit"))).toHaveValue("3");
    expect(screen.getByLabelText(i18n.t("gameMode"))).toHaveValue(
      "singleplayer"
    );
  });

  test("Inicializa con valores de localStorage cuando está disponible", () => {
    // Configurar valores en localStorage
    mockLocalStorage = {
      quizConfig: JSON.stringify({
        numPreguntas: 20,
        tiempoPregunta: 45,
        limitePistas: 5,
        modoJuego: "playerVsIA",
        dificultad: "hard",
        categories: ["history", "science"],
      }),
    };

    renderSidebar();

    expect(screen.getByLabelText(i18n.t("numQuestions"))).toHaveValue("20");
    expect(screen.getByLabelText(i18n.t("timePerQuestion"))).toHaveValue("45");
    expect(screen.getByLabelText(i18n.t("aiHintLimit"))).toHaveValue("5");
    expect(screen.getByLabelText(i18n.t("gameMode"))).toHaveValue("playerVsIA");
    expect(screen.getByLabelText(i18n.t("difficulty"))).toHaveValue("hard");
  });

  test("Maneja errores cuando localStorage contiene datos inválidos", () => {
    // Simular datos inválidos en localStorage
    mockLocalStorage = {
      quizConfig: "invalid-json-data",
    };

    renderSidebar();

    // Debería usar valores predeterminados cuando localStorage está corrupto
    expect(screen.getByLabelText(i18n.t("numQuestions"))).toHaveValue("10");
    expect(console.error).toHaveBeenCalled();
  });

  // Change handling tests
  test("Actualiza numPreguntas en localStorage al cambiar la opción", () => {
    renderSidebar();

    const select = screen.getByLabelText(i18n.t("numQuestions"));
    fireEvent.change(select, { target: { name: "numPreguntas", value: "20" } });

    // Verificar que se llamó a setItem
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "quizConfig",
      expect.any(String)
    );

    // Verificar el valor actualizado en localStorage
    const storedConfig = JSON.parse(mockLocalStorage.quizConfig);
    expect(storedConfig.numPreguntas).toBe(20);
  });

  test("Actualiza tiempoPregunta en localStorage al cambiar la opción", () => {
    renderSidebar();

    const select = screen.getByLabelText(i18n.t("timePerQuestion"));
    fireEvent.change(select, {
      target: { name: "tiempoPregunta", value: "45" },
    });

    // Verificar el valor actualizado en localStorage
    const storedConfig = JSON.parse(mockLocalStorage.quizConfig);
    expect(storedConfig.tiempoPregunta).toBe(45);
  });

  test("Actualiza limitePistas en localStorage al cambiar la opción", () => {
    renderSidebar();

    const select = screen.getByLabelText(i18n.t("aiHintLimit"));
    fireEvent.change(select, { target: { name: "limitePistas", value: "5" } });

    // Verificar el valor actualizado en localStorage
    const storedConfig = JSON.parse(mockLocalStorage.quizConfig);
    expect(storedConfig.limitePistas).toBe(5);
  });

  test("Actualiza modoJuego en localStorage al cambiar la opción", () => {
    renderSidebar();

    const select = screen.getByLabelText(i18n.t("gameMode"));
    fireEvent.change(select, {
      target: { name: "modoJuego", value: "playerVsIA" },
    });

    // Verificar el valor actualizado en localStorage
    const storedConfig = JSON.parse(mockLocalStorage.quizConfig);
    expect(storedConfig.modoJuego).toBe("playerVsIA");
  });

  test("Muestra el selector de dificultad cuando modoJuego es playerVsIA", () => {
    renderSidebar();

    // Inicialmente no debería mostrar el selector de dificultad
    expect(
      screen.queryByLabelText(i18n.t("difficulty"))
    ).not.toBeInTheDocument();

    // Cambiar a modo playerVsIA
    const select = screen.getByLabelText(i18n.t("gameMode"));
    fireEvent.change(select, {
      target: { name: "modoJuego", value: "playerVsIA" },
    });

    // Ahora debería mostrar el selector de dificultad
    expect(screen.getByLabelText(i18n.t("difficulty"))).toBeInTheDocument();
  });

  test("Actualiza dificultad en localStorage al cambiar la opción", () => {
    renderSidebar();

    // Primero cambiar a modo playerVsIA para que aparezca el selector de dificultad
    const modeSelect = screen.getByLabelText(i18n.t("gameMode"));
    fireEvent.change(modeSelect, {
      target: { name: "modoJuego", value: "playerVsIA" },
    });

    // Luego cambiar la dificultad
    const difficultySelect = screen.getByLabelText(i18n.t("difficulty"));
    fireEvent.change(difficultySelect, {
      target: { name: "dificultad", value: "hard" },
    });

    // Verificar el valor actualizado en localStorage
    const storedConfig = JSON.parse(mockLocalStorage.quizConfig);
    expect(storedConfig.dificultad).toBe("hard");
  });

  // Reset functionality test
  test("Restablece la configuración a los valores predeterminados al hacer clic en el botón de reset", () => {
    // Establecer algunos valores personalizados primero
    mockLocalStorage = {
      quizConfig: JSON.stringify({
        numPreguntas: 30,
        tiempoPregunta: 60,
        limitePistas: 7,
        modoJuego: "playerVsIA",
        dificultad: "hard",
        categories: ["history", "science"],
      }),
    };

    renderSidebar();

    // Hacer clic en el botón de reset
    const resetButton = screen.getByText(i18n.t("reset"));
    fireEvent.click(resetButton);

    // Comprobar que los valores se han restablecido (excepto categories que debe preservarse)
    const storedConfig = JSON.parse(mockLocalStorage.quizConfig);
    expect(storedConfig.numPreguntas).toBe(10);
    expect(storedConfig.tiempoPregunta).toBe(30);
    expect(storedConfig.limitePistas).toBe(3);
    expect(storedConfig.modoJuego).toBe("singleplayer");
    expect(storedConfig.categories).toEqual(["history", "science"]); // Categories should be preserved
  });

  // Storage event handling test
  test("Actualiza el estado cuando se cambia localStorage desde otro lugar", () => {
    renderSidebar();

    // Simular un cambio en localStorage desde otra ventana/pestaña
    act(() => {
      const storageEvent = new Event("storage");
      Object.defineProperty(storageEvent, "key", { value: "quizConfig" });
      Object.defineProperty(storageEvent, "newValue", {
        value: JSON.stringify({
          numPreguntas: 20,
          tiempoPregunta: 45,
          limitePistas: 5,
          modoJuego: "playerVsIA",
          dificultad: "hard",
          categories: ["history"],
        }),
      });
      window.dispatchEvent(storageEvent);
    });

    // Verificar que el estado se ha actualizado
    expect(screen.getByLabelText(i18n.t("numQuestions"))).toHaveValue("20");
    expect(screen.getByLabelText(i18n.t("timePerQuestion"))).toHaveValue("45");
    expect(screen.getByLabelText(i18n.t("aiHintLimit"))).toHaveValue("5");
    expect(screen.getByLabelText(i18n.t("gameMode"))).toHaveValue("playerVsIA");
    expect(screen.getByLabelText(i18n.t("difficulty"))).toHaveValue("hard");
  });

  test("Maneja errores en el evento storage con datos JSON inválidos", () => {
    renderSidebar();

    // Simular un evento storage con datos JSON inválidos
    act(() => {
      const storageEvent = new Event("storage");
      Object.defineProperty(storageEvent, "key", { value: "quizConfig" });
      Object.defineProperty(storageEvent, "newValue", {
        value: "invalid-json-data",
      });
      window.dispatchEvent(storageEvent);
    });

    // Debería haber registrado el error
    expect(console.error).toHaveBeenCalled();
  });

  // Edge cases
  test("Maneja valores no numéricos en campos numéricos", () => {
    renderSidebar();

    // Intentar establecer un valor no numérico
    const select = screen.getByLabelText(i18n.t("numQuestions"));
    fireEvent.change(select, {
      target: { name: "numPreguntas", value: "abc" },
    });

    // Debería revertir al valor predeterminado
    const storedConfig = JSON.parse(mockLocalStorage.quizConfig);
    expect(storedConfig.numPreguntas).toBe(10); // Default value
  });

  test("Limpia listeners al desmontar el componente", () => {
    const { unmount } = renderSidebar();

    // Espiar removeEventListener
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

    // Desmontar el componente
    unmount();

    // Verificar que se llamó a removeEventListener
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "storage",
      expect.any(Function)
    );

    // Limpiar
    removeEventListenerSpy.mockRestore();
  });
});
