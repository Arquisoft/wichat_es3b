// src/components/__tests__/GameSettingsSidebar.test.js
import { render, screen, fireEvent } from "@testing-library/react";
import GameSettingsSidebar from "../gameSettingsSidebar/GameSettingsSidebar";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";

beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("quizConfig", JSON.stringify({
        numPreguntas: 10,
        tiempoPregunta: 30,
        limitePistas: 3,
        modoJuego: "singleplayer",
        categories: ["all"]
    }));
});

describe("GameSettingsSidebar component", () => {
    const renderSidebar = (isOpen = true) => {
        render(
            <I18nextProvider i18n={i18n}>
                <GameSettingsSidebar
                    isOpen={isOpen}
                    toggleButton={<button>Toggle</button>}
                />
            </I18nextProvider>
        );
    };

    test("Renderiza las etiquetas de configuración traducidas", () => {
        renderSidebar();

        expect(screen.getByLabelText(i18n.t("numQuestions"))).toBeInTheDocument();
        expect(screen.getByLabelText(i18n.t("timePerQuestion"))).toBeInTheDocument();
        expect(screen.getByLabelText(i18n.t("aiHintLimit"))).toBeInTheDocument();
        expect(screen.getByLabelText(i18n.t("gameMode"))).toBeInTheDocument();
    });

    test("Actualiza localStorage al cambiar una opción", () => {
        renderSidebar();

        const select = screen.getByLabelText(i18n.t("numQuestions"));
        fireEvent.change(select, { target: { value: "20" } });

        const config = JSON.parse(localStorage.getItem("quizConfig"));
        expect(config.numPreguntas).toBe(20);
    });

    test("Muestra el botón toggle si isOpen es true", () => {
        renderSidebar(true);
        expect(screen.getByText("Toggle")).toBeInTheDocument();
    });

    test("Oculta el botón toggle si isOpen es false", () => {
        renderSidebar(false);
        expect(screen.queryByText("Toggle")).not.toBeInTheDocument();
    });
});
