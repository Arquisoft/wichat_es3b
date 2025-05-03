import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserAvatar from "./UserAvatar";

describe("UserAvatar Component", () => {
  test("renderiza las iniciales del usuario correctamente", () => {
    render(<UserAvatar username="TestUser" />);

    // Verificar que se muestran las primeras dos letras del nombre de usuario
    const avatarElement = screen.getByText("Te");
    expect(avatarElement).toBeInTheDocument();
  });

  test("renderiza con un color de fondo basado en el nombre de usuario", () => {
    const { container } = render(<UserAvatar username="TestUser" />);

    // Obtener el elemento div del avatar
    const avatarDiv = container.querySelector(".user-avatar");

    // Verificar que tiene un color de fondo (usamos expect.stringContaining en lugar de expect.any)
    expect(avatarDiv).toHaveStyle({
      backgroundColor: expect.stringContaining("rgb"),
    });

    // El color específico dependerá del hash generado para "TestUser"
    // No verificamos el color exacto, solo que existe
  });

  test("asigna diferentes colores a diferentes nombres de usuario", () => {
    const { rerender, container } = render(<UserAvatar username="User1" />);

    const firstColor = window.getComputedStyle(
      container.querySelector(".user-avatar")
    ).backgroundColor;

    // Renderizar con un nombre de usuario diferente
    rerender(<UserAvatar username="User2" />);

    const secondColor = window.getComputedStyle(
      container.querySelector(".user-avatar")
    ).backgroundColor;

    // Verificar que los colores asignados son diferentes para distintos usuarios
    // Nota: Hay una pequeña probabilidad de que sean iguales por casualidad,
    // pero es extremadamente baja con los nombres elegidos
    expect(firstColor).not.toBe(secondColor);
  });

  test("maneja el caso de nombre de usuario vacío", () => {
    const { container } = render(<UserAvatar username="" />);

    // Verificar que el div existe (en lugar de buscar por texto vacío)
    const avatarDiv = container.querySelector(".user-avatar");
    expect(avatarDiv).toBeInTheDocument();

    // Verificar que el contenido está vacío
    expect(avatarDiv.textContent).toBe("");

    // Verificar que tiene un color de fondo (el primero de la lista)
    expect(avatarDiv).toHaveStyle({
      backgroundColor: expect.stringContaining("rgb"),
    });
  });

  test("preserva la consistencia de color para el mismo nombre de usuario", () => {
    const { rerender, container } = render(<UserAvatar username="SameUser" />);

    const firstRenderColor = window.getComputedStyle(
      container.querySelector(".user-avatar")
    ).backgroundColor;

    // Volver a renderizar con el mismo nombre de usuario
    rerender(<UserAvatar username="SameUser" />);

    const secondRenderColor = window.getComputedStyle(
      container.querySelector(".user-avatar")
    ).backgroundColor;

    // Verificar que el color es el mismo en ambas renderizaciones
    expect(firstRenderColor).toBe(secondRenderColor);
  });

  test("aplica la clase CSS correcta", () => {
    const { container } = render(<UserAvatar username="TestUser" />);

    // Verificar que el elemento tiene la clase user-avatar
    const avatarDiv = container.querySelector(".user-avatar");
    expect(avatarDiv).toHaveClass("user-avatar");
  });
});
