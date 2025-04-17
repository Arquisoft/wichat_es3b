// src/components/__tests__/GameSettings.test.js
import { render, screen, fireEvent } from "@testing-library/react";
import GameSettings from "../gameSettings/GameSettings";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";

// Mock localStorage
beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("quizConfig", JSON.stringify({ categories: ["all"] }));
});

jest.mock("framer-motion", () => ({
    motion: {
        div: ({ children }) => <div>{children}</div>,
    },
}));

describe("GameSettings component", () => {
    const mockStartGame = jest.fn();

    const renderGameSettings = () => {
        render(
            <I18nextProvider i18n={i18n}>
                <GameSettings onStartGame={mockStartGame} />
            </I18nextProvider>
        );
    };

    test("Renderiza todas las categorías con nombres traducidos", () => {
        renderGameSettings();

        expect(screen.getByText(i18n.t("select_category"))).toBeInTheDocument();
        expect(screen.getByText(i18n.t("football"))).toBeInTheDocument();
        expect(screen.getByText(i18n.t("cinema"))).toBeInTheDocument();
        expect(screen.getByText(i18n.t("literature"))).toBeInTheDocument();
        expect(screen.getByText(i18n.t("countries"))).toBeInTheDocument();
        expect(screen.getByText(i18n.t("art"))).toBeInTheDocument();
        expect(screen.getByText(i18n.t("all"))).toBeInTheDocument();
    });

    test("Al hacer clic en una categoría se actualiza localStorage", () => {
        renderGameSettings();
        const category = screen.getByText(i18n.t("cinema"));
        fireEvent.click(category);

        const storedConfig = JSON.parse(localStorage.getItem("quizConfig"));
        expect(storedConfig.categories.includes("cine")).toBe(true);
    });

    test("Al hacer clic en Jugar se ejecuta onStartGame", () => {
        renderGameSettings();
        const playButton = screen.getByText(i18n.t("play"));
        fireEvent.click(playButton);

        expect(mockStartGame).toHaveBeenCalled();
    });
});
