import {render, screen} from "@testing-library/react";
import {I18nextProvider} from "react-i18next";
import i18n from "../i18n";
import {MemoryRouter} from "react-router-dom";
import Footer from "./Footer";

const renderFooter = () => {
    render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter>
                <Footer handleToggleView={jest.fn()} />
            </MemoryRouter>
        </I18nextProvider>
    );
};

describe("Footer component", () => {
    test("Renderiza correctamente el footer", () => {
        renderFooter();

        expect(screen.getByText(i18n.t("footer_text")).toBeInTheDocument());
    });
});