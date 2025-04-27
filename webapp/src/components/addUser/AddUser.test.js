import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import i18n from "../../i18n";
import { I18nextProvider } from "react-i18next";
import AddUser from "./AddUser";
import userEvent from "@testing-library/user-event";

jest.mock("axios");

const generateRandomPassword = () => Math.random().toString(36).slice(-8);

const renderAddUser = () => {
    render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter>
                <AddUser handleToggleView={jest.fn()} />
            </MemoryRouter>
        </I18nextProvider>
    );
};

const fillForm = ({ email = "", username = "", password = "", confirmPassword = "" }) => {
    if (email) userEvent.type(screen.getByLabelText(/Correo electrónico*/i), email);
    if (username) userEvent.type(screen.getByLabelText(/Nombre de usuario*/i), username);

    const passwordFields = screen.queryAllByText(/Contraseña*/i);
    const passwordInput = passwordFields[0]?.closest("label")?.nextElementSibling;
    if (passwordInput) userEvent.type(passwordInput, password);
    const confirmPasswordInput = passwordFields[1]?.closest("label")?.nextElementSibling;
    if (confirmPasswordInput) userEvent.type(confirmPasswordInput, confirmPassword);
};

const expectSnackbarError = async (expectedKey) => {
    await waitFor(() => {
        const alerts = screen.getAllByRole("alert");
        const hasError = alerts.some(alert => alert.textContent.includes(i18n.t(expectedKey)));
        expect(hasError).toBe(true);
    });
};

describe("AddUser component", () => {
    test("Renderiza correctamente el formulario", () => {
        renderAddUser();

        expect(screen.queryAllByText("Crear cuenta").length).toBeGreaterThan(0);
        expect(screen.getByText("Introduce tus datos y únete a WiChat ya mismo.")).toBeInTheDocument();
        expect(screen.getByText("Correo electrónico*")).toBeInTheDocument();
        expect(screen.getByText("Nombre de usuario*")).toBeInTheDocument();
        expect(screen.getByText("Contraseña*")).toBeInTheDocument();
        expect(screen.getByText("Confirmar contraseña*")).toBeInTheDocument();
    });

    test("Muestra error si las contraseñas no coinciden", async () => {
        const password = generateRandomPassword();
        const confirmPassword = generateRandomPassword(); // Different password for the mismatch

        renderAddUser();
        fillForm({ email: "test@example.com", username: "testuser", password, confirmPassword });
        userEvent.click(screen.getByRole("button", { name: /Crear cuenta/i }));
        expect(screen.getByText("Introduce tus datos y únete a WiChat ya mismo.")).toBeInTheDocument();
        expectSnackbarError("passwordsDoNotMatch");
    });

    test("Muestra error si el nombre de usuario está repetido", async () => {
        const password = generateRandomPassword();

        renderAddUser();
        fillForm({ email: "enol@gmail.com", username: "enol", password, confirmPassword: password });
        userEvent.click(screen.getByRole("button", { name: /Crear cuenta/i }));
        expectSnackbarError("addUserError");
    });

    test("Muestra error si el correo está repetido", async () => {
        const password = generateRandomPassword();

        renderAddUser();
        fillForm({ email: "enol@gmail.com", username: "nolindhdhhd", password, confirmPassword: password });
        userEvent.click(screen.getByRole("button", { name: /Crear cuenta/i }));
        expectSnackbarError("addUserError");
    });



    test("Alterna visibilidad de contraseña principal", async () => {
        renderAddUser();
        const togglePasswordButton = screen.getByTestId('togglePass');
        userEvent.click(togglePasswordButton);
    });

    test("Alterna visibilidad de confirmación de contraseña", async () => {
        renderAddUser();
        const toggleConfirmPasswordButton = screen.getByTestId('togglePassConfirm');
        userEvent.click(toggleConfirmPasswordButton);
    });


    test("Muestra error al enviar formulario vacío", async () => {
        renderAddUser();
        userEvent.click(screen.getByRole("button", { name: /Crear cuenta/i }));
        await expectSnackbarError("emptyEmail");
    });

    test("Muestra error con email vacío", async () => {
        renderAddUser();
        fillForm({ username: "test", password: "pass", confirmPassword: "pass" });
        userEvent.click(screen.getByRole("button", { name: /Crear cuenta/i }));
        await expectSnackbarError("emptyEmail");
    });

    test("Muestra error con username vacío", async () => {
        renderAddUser();
        fillForm({ email: "test@test.com", password: "pass", confirmPassword: "pass" });
        userEvent.click(screen.getByRole("button", { name: /Crear cuenta/i }));
        await expectSnackbarError("emptyUsername");
    });

    test("Muestra error con contraseña vacía", async () => {
        renderAddUser();
        fillForm({ email: "test@test.com", username: "test", confirmPassword: "pass" });
        userEvent.click(screen.getByRole("button", { name: /Crear cuenta/i }));
        await expectSnackbarError("emptyPassword");
    });

    test("Muestra error con confirmación de contraseña vacía", async () => {
        renderAddUser();
        fillForm({ email: "test@test.com", username: "test", password: "pass" });
        userEvent.click(screen.getByRole("button", { name: /Crear cuenta/i }));
        await expectSnackbarError("emptyPasswordConfirm");
    });



    test("Alterna visibilidad de contraseña actualizando el tipo de input", async () => {
        renderAddUser();
        const passwordInput = screen.getByLabelText(/Contraseña*/i).closest("div").querySelector("input");
        const toggleButton = screen.getByTestId("togglePass");

        expect(passwordInput).toHaveAttribute("type", "password");
        userEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute("type", "text");
    });











});
