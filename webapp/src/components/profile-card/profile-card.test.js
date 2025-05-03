import React from "react";
import { render, screen } from "@testing-library/react";
import ProfileCard from "./profile-card";

// Mock de react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        level: "Nivel",
        matches: "Partidas",
        averageTime: "Tiempo medio",
        rightQuestions: "Respuestas correctas",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock del componente UserAvatar
jest.mock("../userAvatar/UserAvatar", () => {
  return function MockUserAvatar({ username }) {
    return (
      <img data-testid="mock-avatar" alt={`Foto de perfil de ${username}`} />
    );
  };
});

describe("ProfileCard Component", () => {
  // Datos de prueba para el usuario
  const mockUserData = {
    username: "TestUser",
    level: 3,
    stats: {
      gamesPlayed: 42,
      averageTime: "2:30",
      correctAnswers: 120,
    },
  };

  // Datos de prueba para un usuario sin avatar
  const mockUserDataNoAvatar = {
    username: "UserNoAvatar",
    level: 2,
    stats: {
      gamesPlayed: 25,
      averageTime: "3:15",
      correctAnswers: 75,
    },
  };

  test("renders profile card with complete user data", () => {
    render(<ProfileCard userData={mockUserData} />);

    // Verificar que el nombre de usuario está presente
    expect(screen.getByText("TestUser")).toBeInTheDocument();

    // Verificar que el avatar se renderiza a través del componente mockeado
    expect(screen.getByTestId("mock-avatar")).toBeInTheDocument();
    expect(
      screen.getByAltText("Foto de perfil de TestUser")
    ).toBeInTheDocument();

    // Verificar que las estadísticas se muestran correctamente
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Partidas")).toBeInTheDocument();

    expect(screen.getByText("2:30")).toBeInTheDocument();
    expect(screen.getByText("Tiempo medio")).toBeInTheDocument();

    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("Respuestas correctas")).toBeInTheDocument();
  });

  test("renders profile card with correct user information", () => {
    render(<ProfileCard userData={mockUserDataNoAvatar} />);

    // Verificar que el avatar se renderiza a través del componente mockeado
    expect(screen.getByTestId("mock-avatar")).toBeInTheDocument();
    expect(
      screen.getByAltText("Foto de perfil de UserNoAvatar")
    ).toBeInTheDocument();

    // Verificar que el nombre de usuario está presente
    expect(screen.getByText("UserNoAvatar")).toBeInTheDocument();
  });

  test("renders all profile stats correctly", () => {
    render(<ProfileCard userData={mockUserData} />);

    // Verificar que todas las estadísticas están presentes
    const statIcons = document.querySelectorAll(".stat-icon");
    expect(statIcons.length).toBe(3);

    // Verificar que cada icono tiene la clase correcta
    expect(statIcons[0]).toHaveClass("flag-icon");
    expect(statIcons[1]).toHaveClass("clock-icon");
    expect(statIcons[2]).toHaveClass("check-icon");

    // Verificar que todas las estadísticas tienen sus valores y etiquetas
    const statValues = document.querySelectorAll(".stat-value");
    expect(statValues[0].textContent).toBe("42");
    expect(statValues[1].textContent).toBe("2:30");
    expect(statValues[2].textContent).toBe("120");

    const statLabels = document.querySelectorAll(".stat-label");
    expect(statLabels[0].textContent).toBe("Partidas");
    expect(statLabels[1].textContent).toBe("Tiempo medio");
    expect(statLabels[2].textContent).toBe("Respuestas correctas");
  });

  test("renders correct component structure", () => {
    render(<ProfileCard userData={mockUserData} />);

    // Verificar que la estructura del componente es correcta
    expect(document.querySelector(".profile-card")).toBeInTheDocument();
    expect(document.querySelector(".profile-image")).toBeInTheDocument();
    expect(document.querySelector(".profile-info")).toBeInTheDocument();
    expect(document.querySelector(".profile-header")).toBeInTheDocument();
    expect(document.querySelector(".profile-stats")).toBeInTheDocument();

    // Verificar el número de elementos stat
    const statElements = document.querySelectorAll(".profile-stat");
    expect(statElements.length).toBe(3);
  });
});
