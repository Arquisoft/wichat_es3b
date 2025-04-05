import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import i18n from "../../i18n"; // Ajusta la ruta según tu estructura de proyecto
import { I18nextProvider } from "react-i18next";
import AddUser from "../addUser/AddUser";
import userEvent from "@testing-library/user-event";
import axios from 'axios';

jest.mock('axios');

describe("AddUser component", () => {
    test("Renderiza correctamente el formulario", () => {
        render(
            <I18nextProvider i18n={i18n}>
                <MemoryRouter>
                    <AddUser handleToggleView={jest.fn()} />
                </MemoryRouter>
            </I18nextProvider>
        );

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

        userEvent.type(screen.getByLabelText(/Correo electrónico*/i), "test@example.com");
        userEvent.type(screen.getByLabelText(/Nombre de usuario*/i), "testuser");

        const passwordFields = screen.queryAllByText(/Contraseña*/i);
        userEvent.type(passwordFields[0].closest('label').nextElementSibling, "123456");
        userEvent.type(passwordFields[1].closest('label').nextElementSibling, "654321");

        userEvent.click(screen.getByText(/Crear cuenta*/i));

        // Utiliza una expresión regular que permite saltos de línea y otros elementos
        const errorMessage = await screen.findByText((content, element) =>
            content.includes("Las contraseñas no coinciden") &&
            element.closest('div') &&
            element.closest('div').classList.contains('MuiSnackbarContent-message')
        );

        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage.closest('div')).toHaveClass('MuiSnackbarContent-message');
    });

    test("Muestra error si el nombre de usuario está repetido", async () => {
        render(
            <I18nextProvider i18n={i18n}>
                <MemoryRouter>
                    <AddUser handleToggleView={jest.fn()} />
                </MemoryRouter>
            </I18nextProvider>
        );

        userEvent.type(screen.getByLabelText(/Correo electrónico*/i), "enol@gmail.com");
        userEvent.type(screen.getByLabelText(/Nombre de usuario*/i), "enol");

        const passwordFields = screen.queryAllByText(/Contraseña*/i);
        userEvent.type(passwordFields[0].closest('label').nextElementSibling, "123456");
        userEvent.type(passwordFields[1].closest('label').nextElementSibling, "123456");

        userEvent.click(screen.getByText(/Crear cuenta*/i));

        // Utiliza una expresión regular que permite saltos de línea y otros elementos
        const errorMessage = await screen.findByText((content, element) =>
            content.includes("Ya existe un usuario con ese nombre o correo electrónico") &&
            element.closest('div') &&
            element.closest('div').classList.contains('MuiSnackbarContent-message')
        );

        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage.closest('div')).toHaveClass('MuiSnackbarContent-message');
    });

    test("Muestra error si el correo está repetido", async () => {
        axios.post.mockRejectedValueOnce({
            response: {
                data: {
                    error: "Ya existe un usuario con ese correo electrónico",
                }
            }
        });

        render(
            <I18nextProvider i18n={i18n}>
                <MemoryRouter>
                    <AddUser handleToggleView={jest.fn()} />
                </MemoryRouter>
            </I18nextProvider>
        );

        userEvent.type(screen.getByLabelText(/Correo electrónico*/i), "enol@gmail.com");
        userEvent.type(screen.getByLabelText(/Nombre de usuario*/i), "nolindhdhhd");

        const passwordFields = screen.queryAllByText(/Contraseña*/i);
        userEvent.type(passwordFields[0].closest('label').nextElementSibling, "123456");
        userEvent.type(passwordFields[1].closest('label').nextElementSibling, "123456");

        userEvent.click(screen.getByRole('button', { name: /Crear cuenta/i }));

        // Utiliza una expresión regular que permite saltos de línea y otros elementos
        const errorMessage = await screen.findByText((content, element) =>
            content.includes("Ya existe un usuario con ese correo electrónico") &&
            element.closest('div') &&
            element.closest('div').classList.contains('MuiSnackbarContent-message')
        );

        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage.closest('div')).toHaveClass('MuiSnackbarContent-message');
    });

    test("Muestra error si el correo está vacío", async () => {
        render(
            <I18nextProvider i18n={i18n}>
                <MemoryRouter>
                    <AddUser handleToggleView={jest.fn()} />
                </MemoryRouter>
            </I18nextProvider>
        );

        userEvent.type(screen.getByLabelText(/Nombre de usuario*/i), "testuser");

        const passwordFields = screen.queryAllByText(/Contraseña*/i);
        userEvent.type(passwordFields[0].closest('label').nextElementSibling, "123456");
        userEvent.type(passwordFields[1].closest('label').nextElementSibling, "123456");

        userEvent.click(screen.getByRole('button', { name: /Crear cuenta/i }));

        // Utiliza una expresión regular que permite saltos de línea y otros elementos
        const errorMessage = await screen.findByText((content, element) =>
            content.includes("Por favor, introduce un correo electrónico") &&
            element.closest('div') &&
            element.closest('div').classList.contains('MuiSnackbarContent-message')
        );

        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage.closest('div')).toHaveClass('MuiSnackbarContent-message');
    });

    test("Muestra error si el nombre de usuario está vacío", async () => {
        render(
            <I18nextProvider i18n={i18n}>
                <MemoryRouter>
                    <AddUser handleToggleView={jest.fn()} />
                </MemoryRouter>
            </I18nextProvider>
        );

        userEvent.type(screen.getByLabelText(/Correo electrónico*/i), "testuser");

        const passwordFields = screen.queryAllByText(/Contraseña*/i);
        userEvent.type(passwordFields[0].closest('label').nextElementSibling, "123456");
        userEvent.type(passwordFields[1].closest('label').nextElementSibling, "123456");

        userEvent.click(screen.getByRole('button', { name: /Crear cuenta/i }));

        // Utiliza una expresión regular que permite saltos de línea y otros elementos
        const errorMessage = await screen.findByText((content, element) =>
            content.includes("Por favor, introduce un nombre de usuario") &&
            element.closest('div') &&
            element.closest('div').classList.contains('MuiSnackbarContent-message')
        );

        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage.closest('div')).toHaveClass('MuiSnackbarContent-message');
    });

    test("Muestra error si la contraseña está vacía", async () => {
        render(
            <I18nextProvider i18n={i18n}>
                <MemoryRouter>
                    <AddUser handleToggleView={jest.fn()} />
                </MemoryRouter>
            </I18nextProvider>
        );

        userEvent.type(screen.getByLabelText(/Correo electrónico*/i), "testuser");
        userEvent.type(screen.getByLabelText(/Nombre de usuario*/i), "testuser");

        const passwordFields = screen.queryAllByText(/Contraseña*/i);
        userEvent.type(passwordFields[1].closest('label').nextElementSibling, "123456");

        userEvent.click(screen.getByRole('button', { name: /Crear cuenta/i }));

        // Utiliza una expresión regular que permite saltos de línea y otros elementos
        const errorMessage = await screen.findByText((content, element) =>
            content.includes("Por favor, introduce una contraseña") &&
            element.closest('div') &&
            element.closest('div').classList.contains('MuiSnackbarContent-message')
        );

        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage.closest('div')).toHaveClass('MuiSnackbarContent-message');
    });

    test("Muestra error si la confirmación de la contraseña está vacía", async () => {
        render(
            <I18nextProvider i18n={i18n}>
                <MemoryRouter>
                    <AddUser handleToggleView={jest.fn()} />
                </MemoryRouter>
            </I18nextProvider>
        );

        userEvent.type(screen.getByLabelText(/Correo electrónico*/i), "testuser");
        userEvent.type(screen.getByLabelText(/Nombre de usuario*/i), "testuser");

        const passwordFields = screen.queryAllByText(/Contraseña*/i);
        userEvent.type(passwordFields[0].closest('label').nextElementSibling, "123456");

        userEvent.click(screen.getByRole('button', { name: /Crear cuenta/i }));

        // Utiliza una expresión regular que permite saltos de línea y otros elementos
        const errorMessage = await screen.findByText((content, element) =>
            content.includes("Por favor, confirma tu contraseña") &&
            element.closest('div') &&
            element.closest('div').classList.contains('MuiSnackbarContent-message')
        );

        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage.closest('div')).toHaveClass('MuiSnackbarContent-message');
    });
});
