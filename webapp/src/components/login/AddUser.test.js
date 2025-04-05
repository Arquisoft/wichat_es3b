import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";
import i18n from "../../i18n"; // Ajusta la ruta según tu estructura de proyecto
import { I18nextProvider } from "react-i18next";
import AddUser from "../addUser/AddUser";

describe("AddUser component", () => {
    test("Renderiza correctamente el formulario", () => {
        render(
            <I18nextProvider i18n={i18n}>
                <MemoryRouter>
                    <AddUser handleToggleView={jest.fn()} />
                </MemoryRouter>
            </I18nextProvider>
        );

        // Verificaciones con textos internacionalizados desde i18n
        expect(screen.getByText("Crear cuenta")).toBeInTheDocument();
        expect(screen.getByText("Introduce tus datos y únete a WiChat ya mismo.")).toBeInTheDocument();
        expect(screen.getByText("Correo electrónico*")).toBeInTheDocument();
        expect(screen.getByText("Nombre de usuario*")).toBeInTheDocument();
        expect(screen.getByText("Contraseña*")).toBeInTheDocument();
        expect(screen.getByText("Confirmar contraseña*")).toBeInTheDocument();
    });
});