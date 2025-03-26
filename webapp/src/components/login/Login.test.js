import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";
import i18n from "../../i18n"; // Ajusta la ruta según tu estructura de proyecto
import { I18nextProvider } from "react-i18next";

describe("Login component", () => {
  test("Renderiza correctamente el formulario", () => {
    render(
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <Login handleToggleView={jest.fn()} />
          </MemoryRouter>
        </I18nextProvider>
    );

    // Verificaciones con textos internacionalizados desde i18n
    expect(screen.getByText("Identifícate")).toBeInTheDocument();
    expect(screen.getByText("Introduce tus datos y únete a WiChat ya mismo.")).toBeInTheDocument();
    expect(screen.getByText("Nombre de usuario*")).toBeInTheDocument();
    expect(screen.getByText("Contraseña*")).toBeInTheDocument();
    expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
    expect(screen.getByText("Crear cuenta")).toBeInTheDocument();
  });
});