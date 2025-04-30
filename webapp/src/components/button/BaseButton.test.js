import { render, screen, fireEvent } from "@testing-library/react";
import BaseButton from "../button/BaseButton";

describe("BaseButton component", () => {
    test("Renderiza el texto del botón correctamente", () => {
        render(<BaseButton text="Test Button" onClick={() => {}} />);
        expect(screen.getByText("Test Button")).toBeInTheDocument();
    });

    test("Llama a onClick al hacer clic", () => {
        const mockClick = jest.fn();
        render(<BaseButton text="Click Me" onClick={mockClick} />);
        fireEvent.click(screen.getByText("Click Me"));
        expect(mockClick).toHaveBeenCalled();
    });

    test("Aplica la clase adecuada según el tipo de botón", () => {
        render(<BaseButton text="Primary Button" onClick={() => {}} buttonType="buttonPrimary" />);
        expect(screen.getByText("Primary Button")).toHaveClass("buttonPrimary");

        render(<BaseButton text="Secondary Button" onClick={() => {}} buttonType="buttonSecondary" />);
        expect(screen.getByText("Secondary Button")).toHaveClass("buttonSecondary");
    });

    test("El atributo 'variant' y 'color' no son útiles en este componente pero no afectan", () => {
        const { container } = render(<BaseButton text="Test Button" onClick={() => {}} />);
        expect(container.querySelector("button")).toHaveAttribute("variant", "contained");
        expect(container.querySelector("button")).toHaveAttribute("color", "primary");
    });
});
