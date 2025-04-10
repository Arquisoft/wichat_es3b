// Nav.test.js
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n"; // Ajusta la ruta según tu estructura
import Nav from "./Nav";

// Helper para renderizar con contexto
const renderNav = () => {
    return render(
        <BrowserRouter>
            <I18nextProvider i18n={i18n}>
                <Nav />
            </I18nextProvider>
        </BrowserRouter>
    );
};

describe("Nav component", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test("Muestra enlaces básicos sin autenticación", () => {
        renderNav();

        expect(screen.getByText(i18n.t("title"))).toBeInTheDocument();
        expect(screen.getByText(i18n.t("home"))).toBeInTheDocument();
        expect(screen.getByText("Ranking")).toBeInTheDocument();
        expect(screen.getByText(i18n.t("login"))).toBeInTheDocument();

        // No deben aparecer los enlaces de usuario autenticado
        expect(screen.queryByText(i18n.t("play"))).not.toBeInTheDocument();
        expect(screen.queryByText(i18n.t("profile"))).not.toBeInTheDocument();
        expect(screen.queryByText(i18n.t("logout"))).not.toBeInTheDocument();
    });

    test("Muestra enlaces adicionales cuando el usuario está autenticado", () => {
        localStorage.setItem("token", "mockedToken");

        renderNav();

        expect(screen.getByText(i18n.t("play"))).toBeInTheDocument();
        expect(screen.getByText(i18n.t("profile"))).toBeInTheDocument();
        expect(screen.getByText(i18n.t("logout"))).toBeInTheDocument();

        // No debería mostrarse el login
        expect(screen.queryByText(i18n.t("login"))).not.toBeInTheDocument();
    });

    test("Cierra sesión al hacer clic en Logout", () => {
        localStorage.setItem("token", "mockedToken");
        localStorage.setItem("username", "mockUser");

        renderNav();

        const logoutLink = screen.getByText(i18n.t("logout"));
        fireEvent.click(logoutLink);

        expect(localStorage.getItem("token")).toBe(null);
        expect(localStorage.getItem("username")).toBe(null);
    });
});
