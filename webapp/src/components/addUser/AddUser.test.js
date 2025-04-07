import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import i18n from "../../i18n";
import { I18nextProvider } from "react-i18next";
import AddUser from "./AddUser";
import userEvent from "@testing-library/user-event";
import axios from "axios";

jest.mock("axios");

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
    const confirmPasswordInput = passwordFields[1]?.closest("label")?.nextElementSibling;
    if (confirmPasswordInput) userEvent.type(confirmPasswordInput, "123456");
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
        renderAddUser();
        fillForm({ email: "test@example.com", username: "testuser", password: "123456", confirmPassword: "654321" });
        userEvent.click(screen.getByRole("button", { name: /Crear cuenta/i }));
        expect(screen.getByText("Introduce tus datos y únete a WiChat ya mismo.")).toBeInTheDocument();
        expectSnackbarError("passwordsDoNotMatch")
    });

    test("Muestra error si el nombre de usuario está repetido", async () => {
        renderAddUser();
        fillForm({ email: "enol@gmail.com", username: "enol", password: "123456", confirmPassword: "123456" });
        userEvent.click(screen.getByRole("button", { name: /Crear cuenta/i }));
        expectSnackbarError("addUserError")
    });

    test("Muestra error si el correo está repetido", async () => {
        renderAddUser();
        fillForm({ email: "enol@gmail.com", username: "nolindhdhhd", password: "123456", confirmPassword: "123456" });
        userEvent.click(screen.getByRole("button", { name: /Crear cuenta/i }));
        expectSnackbarError("addUserError")
    });

    test("Muestra error si el correo está vacío", async () => {
        renderAddUser();
        fillForm({ username: "testuser", password: "123456", confirmPassword: "123456" });
        userEvent.click(screen.getByRole("button", { name: /Crear cuenta/i }));
        expectSnackbarError("emptyEmail")
    });

    test("Muestra error si el nombre de usuario está vacío", async () => {
        renderAddUser();
        fillForm({ email: "testuser", password: "123456", confirmPassword: "123456" });
        userEvent.click(screen.getByRole("button", { name: /Crear cuenta/i }));
        expectSnackbarError("emptyUsername")
    });

    test("Muestra error si la contraseña está vacía", async () => {
        renderAddUser();
        fillForm({ email: "testuser", username: "testuser", confirmPassword: "123456" });
        userEvent.click(screen.getByRole("button", { name: /Crear cuenta/i }));
        expectSnackbarError("emptyPassword")
    });

    test("Muestra error si la confirmación de la contraseña está vacía", async () => {
        renderAddUser();
        fillForm({ email: "testuser", username: "testuser", password: "123456" });
        userEvent.click(screen.getByRole("button", { name: /Crear cuenta/i }));
        expectSnackbarError("emptyPasswordConfirm")
    });

});
