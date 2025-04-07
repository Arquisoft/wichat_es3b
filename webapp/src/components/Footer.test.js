import {render, screen} from "@testing-library/react";
import {I18nextProvider} from "react-i18next";
import i18n from "../i18n";
import Footer from "./Footer";

const renderFooter = () => {
    render(
        <I18nextProvider i18n={i18n}>
                <Footer handleToggleView={jest.fn()} />
        </I18nextProvider>
    );
};

describe("Footer component", () => {
    test("Renderiza correctamente el footer", () => {
        renderFooter();

        expect(screen.getByText(i18n.t("footer_text"))).toBeInTheDocument();
    });
});