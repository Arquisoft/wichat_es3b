import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";

describe("Login component", () => {
  test("Renderiza correctamente el formulario", () => {
    render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
    );

    //expect(screen.getByText("Identifícate")).toBeInTheDocument();
    expect(screen.getByText("Nombre de usuario")).toBeInTheDocument();
    expect(screen.getByText("Contraseña")).toBeInTheDocument();
    expect(screen.getByText("Iniciar Sesión")).toBeInTheDocument();
    expect(screen.getByText("Crear cuenta")).toBeInTheDocument();
  });
});
