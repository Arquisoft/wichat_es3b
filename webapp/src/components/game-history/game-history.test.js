import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import GameHistory from "./game-history";
import { useTranslation } from "react-i18next";

// Mock de react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        gameHistory: "Historial de partidas",
        points: "puntos",
        rightQuestions: "Respuestas correctas",
        rightAnswersRatio: "Proporción de aciertos",
        time: "Tiempo",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock setTimeout para pruebas de animación
jest.useFakeTimers();

describe("GameHistory Component", () => {
  const mockGames = [
    {
      id: 1,
      date: "01/01/2023",
      score: 100,
      correct: 8,
      ratio: 0.8,
      time: "2:30",
    },
    {
      id: 2,
      date: "02/01/2023",
      score: 150,
      correct: 10,
      ratio: 0.9,
      time: "3:15",
    },
    {
      id: 3,
      date: "03/01/2023",
      score: 200,
      correct: 12,
      ratio: 1.0,
      time: "4:00",
    },
    {
      id: 4,
      date: "04/01/2023",
      score: 120,
      correct: 9,
      ratio: 0.75,
      time: "2:45",
    },
  ];

  const mockOnNavigate = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  test("renderiza correctamente con los juegos proporcionados", () => {
    render(
      <GameHistory
        games={mockGames}
        currentIndex={0}
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByText("Historial de partidas")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("#3")).toBeInTheDocument();
    expect(screen.getByText("01/01/2023")).toBeInTheDocument();
    expect(screen.getByText("100 puntos")).toBeInTheDocument();
    expect(screen.getByText("8 respuestas correctas")).toBeInTheDocument();
    expect(
      screen.getByText("Proporción de aciertos: 0.80")
    ).toBeInTheDocument();
    expect(screen.getByText("Tiempo: 2:30")).toBeInTheDocument();
  });

  test("renderiza correctamente cuando no hay juegos", () => {
    render(
      <GameHistory games={[]} currentIndex={0} onNavigate={mockOnNavigate} />
    );

    expect(screen.getByText("Historial de partidas")).toBeInTheDocument();
    expect(screen.queryAllByTestId("pagination-dot")).toHaveLength(0);
    expect(screen.queryByText("#1")).not.toBeInTheDocument();
  });

  test("navega a la derecha al hacer clic en el botón siguiente", () => {
    render(
      <GameHistory
        games={mockGames}
        currentIndex={0}
        onNavigate={mockOnNavigate}
      />
    );

    fireEvent.click(screen.getByText(">"));
    expect(mockOnNavigate).toHaveBeenCalledWith("next");
  });

  test("navega a la izquierda al hacer clic en el botón anterior", () => {
    render(
      <GameHistory
        games={mockGames}
        currentIndex={1}
        onNavigate={mockOnNavigate}
      />
    );

    fireEvent.click(screen.getByText("<"));
    expect(mockOnNavigate).toHaveBeenCalledWith("prev");
  });

  test("evita múltiples clics durante la animación", () => {
    render(
      <GameHistory
        games={mockGames}
        currentIndex={0}
        onNavigate={mockOnNavigate}
      />
    );

    fireEvent.click(screen.getByText(">"));
    expect(mockOnNavigate).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText(">"));
    expect(mockOnNavigate).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(600);
    });

    fireEvent.click(screen.getByText(">"));
    expect(mockOnNavigate).toHaveBeenCalledTimes(2);
  });

  test("maneja la navegación circular correctamente", () => {
    render(
      <GameHistory
        games={mockGames}
        currentIndex={3}
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByText("#4")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
  });

  test("muestra los puntos de paginación y permite la navegación directa", () => {
    render(
      <GameHistory
        games={mockGames}
        currentIndex={0}
        onNavigate={mockOnNavigate}
      />
    );

    const paginationDots = screen.getAllByTestId("pagination-dot");
    expect(paginationDots).toHaveLength(4);
    expect(paginationDots[0]).toHaveClass("active");

    fireEvent.click(paginationDots[2]);

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(mockOnNavigate).toHaveBeenNthCalledWith(1, "next");
    expect(mockOnNavigate).toHaveBeenNthCalledWith(2, "next");
  });

  test("maneja la navegación hacia atrás con puntos de paginación", () => {
    render(
      <GameHistory
        games={mockGames}
        currentIndex={2}
        onNavigate={mockOnNavigate}
      />
    );

    const paginationDots = screen.getAllByTestId("pagination-dot");
    expect(paginationDots[2]).toHaveClass("active");

    fireEvent.click(paginationDots[0]);

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(mockOnNavigate).toHaveBeenNthCalledWith(1, "prev");
    expect(mockOnNavigate).toHaveBeenNthCalledWith(2, "prev");
  });

  test("evita múltiples clics en paginación durante la animación", () => {
    render(
      <GameHistory
        games={mockGames}
        currentIndex={0}
        onNavigate={mockOnNavigate}
      />
    );

    const paginationDots = screen.getAllByTestId("pagination-dot");

    fireEvent.click(paginationDots[2]);
    fireEvent.click(paginationDots[3]);

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(mockOnNavigate).toHaveBeenCalledTimes(2);

    act(() => {
      jest.advanceTimersByTime(600);
    });

    fireEvent.click(paginationDots[3]);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(mockOnNavigate).toHaveBeenCalledTimes(4);
  });

  test("no navega cuando hace clic en el punto de paginación activo actual", () => {
    render(
      <GameHistory
        games={mockGames}
        currentIndex={1}
        onNavigate={mockOnNavigate}
      />
    );

    const paginationDots = screen.getAllByTestId("pagination-dot");
    fireEvent.click(paginationDots[1]);

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(mockOnNavigate).not.toHaveBeenCalled();
  });
});
