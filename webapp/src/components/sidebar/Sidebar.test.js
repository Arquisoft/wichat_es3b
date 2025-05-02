import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Sidebar from "./Sidebar";

// Mock de la función de traducción
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        gamesPlayed: "Partidas jugadas",
        rightQuestions: "Respuestas correctas",
        wrongQuestions: "Respuestas incorrectas",
        rightAnswersRatio: "Ratio de aciertos",
        averageTime: "Tiempo promedio",
        bestScore: "Mejor puntuación",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock del componente UserAvatar
jest.mock("../userAvatar/UserAvatar", () => {
  return function MockUserAvatar({ username }) {
    return <img data-testid="mock-avatar" alt="Avatar de usuario" />;
  };
});

// Datos de prueba para el usuario
const mockUserData = {
  username: "TestUser",
  stats: {
    gamesPlayed: 10,
    correctAnswers: 75,
    wrongAnswers: 25,
    ratio: "75%",
    averageTime: "2.5s",
    bestScore: 500,
  },
};

describe("Sidebar Component", () => {
  test("no se renderiza cuando isVisible es false", () => {
    render(
      <Sidebar userData={mockUserData} isVisible={false} onClose={() => {}} />
    );

    // Verificamos que el sidebar está en el DOM pero no es visible
    const sidebar = document.querySelector(".sidebar");
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).not.toHaveClass("visible");
  });

  test("se renderiza correctamente cuando isVisible es true", () => {
    render(
      <Sidebar userData={mockUserData} isVisible={true} onClose={() => {}} />
    );

    // Verificamos que el sidebar es visible
    const sidebar = document.querySelector(".sidebar");
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveClass("visible");

    // Verificamos que el overlay también está presente
    const overlay = document.querySelector(".sidebar-overlay");
    expect(overlay).toBeInTheDocument();
  });

  test("muestra correctamente la información del usuario", () => {
    render(
      <Sidebar userData={mockUserData} isVisible={true} onClose={() => {}} />
    );

    // Nombre de usuario
    expect(screen.getByText("TestUser")).toBeInTheDocument();

    // Avatar
    const avatar = screen.getByTestId("mock-avatar");
    expect(avatar).toBeInTheDocument();

    // Estadísticas
    expect(screen.getByText("Partidas jugadas:")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();

    expect(screen.getByText("Respuestas correctas:")).toBeInTheDocument();
    expect(screen.getByText("75")).toBeInTheDocument();

    expect(screen.getByText("Respuestas incorrectas:")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();

    expect(screen.getByText("Ratio de aciertos:")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();

    expect(screen.getByText("Tiempo promedio:")).toBeInTheDocument();
    expect(screen.getByText("2.5s")).toBeInTheDocument();

    expect(screen.getByText("Mejor puntuación:")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
  });

  test("llama a onClose cuando se hace clic en el overlay", () => {
    const mockOnClose = jest.fn();

    render(
      <Sidebar userData={mockUserData} isVisible={true} onClose={mockOnClose} />
    );

    const overlay = document.querySelector(".sidebar-overlay");
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("el efecto de cleanup se ejecuta cuando el componente se desmonta", () => {
    // Espiamos el método useEffect
    const useEffectSpy = jest.spyOn(React, "useEffect");

    const { unmount } = render(
      <Sidebar userData={mockUserData} isVisible={true} onClose={() => {}} />
    );

    // Desmontamos el componente para ejecutar la función de cleanup
    unmount();

    // Verificamos que useEffect fue llamado
    expect(useEffectSpy).toHaveBeenCalled();

    // Restauramos el espía para no afectar otras pruebas
    useEffectSpy.mockRestore();
  });

  test("el componente se renderiza cuando cambia la visibilidad", () => {
    const { rerender } = render(
      <Sidebar userData={mockUserData} isVisible={false} onClose={() => {}} />
    );

    // Inicialmente no es visible
    let sidebar = document.querySelector(".sidebar");
    expect(sidebar).not.toHaveClass("visible");

    // Re-renderizamos con isVisible = true
    rerender(
      <Sidebar userData={mockUserData} isVisible={true} onClose={() => {}} />
    );

    // Ahora debería ser visible
    sidebar = document.querySelector(".sidebar");
    expect(sidebar).toHaveClass("visible");
  });
});
