import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import i18n from "../../i18n"; // Ajusta la ruta según tu estructura de proyecto
import { I18nextProvider } from "react-i18next";
import AddUser from "../addUser/AddUser";
import userEvent from "@testing-library/user-event";


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
        expect(screen.queryAllByText("Crear cuenta").length).toBeGreaterThan(0);
        expect(screen.getByText("Introduce tus datos y únete a WiChat ya mismo.")).toBeInTheDocument();
        expect(screen.getByText("Correo electrónico*")).toBeInTheDocument();
        expect(screen.getByText("Nombre de usuario*")).toBeInTheDocument();
        expect(screen.getByText("Contraseña*")).toBeInTheDocument();
        expect(screen.getByText("Confirmar contraseña*")).toBeInTheDocument();
    });

    test("Muestra error si las contraseñas no coinciden", async () => {
        render(
            <I18nextProvider i18n={i18n}>
                <MemoryRouter>
                    <AddUser handleToggleView={jest.fn()} />
                </MemoryRouter>
            </I18nextProvider>
        );

        userEvent.type(screen.getByLabelText(/Correo electrónico*o/i), "test@example.com");
        userEvent.type(screen.getByLabelText(/Nombre de usuario*/i), "testuser");
        // Utiliza `getByLabelText` para los campos de contraseña con el texto exacto
        userEvent.type(screen.getByLabelText(/Contraseña*/i, { exact: false }), "123456");
        userEvent.type(screen.getByLabelText(/Confirmar contraseña*/i, { exact: false }), "654321");

        userEvent.click(screen.getByText(/Crear cuenta*/i));

        expect(await screen.findByText(/Las contraseñas no coinciden/i)).toBeInTheDocument(); // asegúrate que `passwordsDoNotMatch` esté traducido correctamente
    });
});